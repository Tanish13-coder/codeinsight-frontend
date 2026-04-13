import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Editor.css';
import MonacoEditor from '@monaco-editor/react';
import API from '../api.js';

const DEFAULT_TEMPLATE = `import java.util.*;

public class Solution {

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        System.out.println("Hello, World!");
    }
}`;

function readEditorPrefs() {
    try {
        const raw = localStorage.getItem('ci-editor-prefs');
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            fontSize: parsed.fontSize || 14,
            tabSize: parsed.tabSize || 4,
            lineNumbers: parsed.lineNumbers !== undefined ? parsed.lineNumbers : true,
            wordWrap: parsed.wordWrap !== undefined ? parsed.wordWrap : true,
            minimap: parsed.minimap !== undefined ? parsed.minimap : false,
        };
    } catch {
        return { fontSize: 14, tabSize: 4, lineNumbers: true, wordWrap: true, minimap: false };
    }
}

export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const username = localStorage.getItem('username') || 'U';
    const role = localStorage.getItem('role');
    const editorPrefs = readEditorPrefs();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState(DEFAULT_TEMPLATE);

    // Run/Submit state
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verdict, setVerdict] = useState(null);
    const [customInput, setCustomInput] = useState('');
    const [ioTab, setIoTab] = useState('input');
    const [ioOutput, setIoOutput] = useState('');
    const [ioError, setIoError] = useState('');
    const [ioStatus, setIoStatus] = useState(null); // null | 'success' | 'error' | 'compileError'
    const [submitResult, setSubmitResult] = useState(null);

    // Left panel tabs
    const [leftTab, setLeftTab] = useState('problem');

    // AI state
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    const [aiError, setAiError] = useState('');
    const [aiTab, setAiTab] = useState('explanation');

    // Right bottom panel tabs (output | ai)
    const [rightBottomTab, setRightBottomTab] = useState('output');

    useEffect(() => {
        async function fetchProblem() {
            try {
                const res = await fetch(`${API}/codeinsight/problems?id=${id}`, { credentials: 'include' });
                const data = await res.json();
                setProblem(data.id ? data : null);
            } catch (e) {
                console.error('Failed to fetch problem:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchProblem();
    }, [id]);

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    const dc = problem ? ({
        Easy: { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
        Medium: { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
        Hard: { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
    }[problem.difficulty] || { color: '#94a3b8', bg: '', border: '' })
        : { color: '#94a3b8', bg: '', border: '' };

    /* ── Run ─────────────────────────────────────── */
    async function handleRun() {
        if (running || submitting) return;
        setRunning(true);
        setRightBottomTab('output');
        setIoTab('output');
        setIoOutput('');
        setIoError('');
        setIoStatus(null);

        try {
            const res = await fetch(`${API}/codeinsight/run`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, input: customInput }),
            });
            const data = await res.json();
            if (data.verdict === 'Compilation Error') {
                setIoStatus('compileError');
                setIoError(data.error || 'Compilation failed.');
            } else if (data.verdict === 'Runtime Error' || data.verdict === 'TLE') {
                setIoStatus('error');
                setIoError((data.verdict === 'TLE' ? 'Time Limit Exceeded (10s)\n' : '') + (data.error || ''));
                if (data.output) setIoOutput(data.output);
            } else {
                setIoStatus('success');
                const inp = customInput.trim() ? `Input:\n${customInput.trim()}\n\n` : '';
                setIoOutput(`${inp}Output:\n${data.output || '(no output)'}\n\nRuntime: ${data.runtime || '-'}`);
            }
        } catch {
            setIoStatus('error');
            setIoError('Network error — could not reach server.');
        } finally {
            setRunning(false);
        }
    }

    /* ── Submit ──────────────────────────────────── */
    async function handleSubmit() {
        if (running || submitting) return;
        setSubmitting(true);
        setRightBottomTab('output');
        setIoTab('output');
        setVerdict(null);
        setSubmitResult(null);
        setIoOutput('');
        setIoError('');
        setIoStatus(null);

        try {
            const res = await fetch(`${API}/codeinsight/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemId: parseInt(id),
                    code,
                    language: 'Java',
                    userId: parseInt(localStorage.getItem('userId')),
                    username: localStorage.getItem('username'),
                }),
            });
            const data = await res.json();
            if (data.success) {
                const ok = data.verdict === 'Accepted';
                setVerdict(ok ? 'accepted' : 'wrong');
                setIoStatus(ok ? 'success' : 'error');
                setSubmitResult(data);
                setIoOutput(ok
                    ? `All ${data.total} test cases passed!\nRuntime: ${data.runtime}`
                    : data.message + (data.output ? '\n\n' + data.output : ''));
            } else {
                setVerdict('error');
                setIoStatus('error');
                setIoError(data.message || 'Submission failed.');
            }
        } catch {
            setVerdict('error');
            setIoStatus('error');
            setIoError('Network error.');
        } finally {
            setSubmitting(false);
        }
    }

    /* ── AI Insight ──────────────────────────────── */
    async function handleAiInsight() {
        if (!code.trim() || aiLoading) return;
        setAiLoading(true);
        setRightBottomTab('ai');
        setAiInsight(null);
        setAiError('');
        setAiTab('explanation');

        try {
            const res = await fetch(`${API}/codeinsight/ai-insight`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    problem: problem?.title || '',
                    verdict: verdict || (ioStatus === 'compileError' ? 'Compilation Error' : ioStatus === 'error' ? 'Runtime Error' : ''),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAiInsight(data);
            } else {
                setAiError(data.message || 'AI service failed.');
            }
        } catch {
            setAiError('Could not reach AI service.');
        } finally {
            setAiLoading(false);
        }
    }

    /* ── Loading / Not found ─────────────────────── */
    if (loading) return (
        <div className="ed-page">
            <EditorNav username={username} role={role} onLogout={handleLogout} />
            <div className="ed-center-msg">Loading problem...</div>
        </div>
    );

    if (!problem) return (
        <div className="ed-page">
            <EditorNav username={username} role={role} onLogout={handleLogout} />
            <div className="ed-center-msg" style={{ flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 18, color: '#64748b' }}>Problem not found.</div>
                <button className="ed-back" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>
        </div>
    );

    const hasError = ioStatus === 'compileError' || ioStatus === 'error' || verdict === 'wrong';

    return (
        <div className="ed-page">

            {/* ══ ROW 1: Editor Navbar ══ */}
            <EditorNav username={username} role={role} onLogout={handleLogout} />

            {/* ══ ROW 2: Problem topbar ══ */}
            <div className="ed-topbar">
                <div className="ed-topbar-left">
                    <button type="button" className="ed-back" onClick={() => navigate('/dashboard')}>
                        ← Back
                    </button>
                    <div className="ed-problem-meta">
                        <span className="ed-problem-title">{problem.title}</span>
                        <span className="ed-diff-badge"
                            style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                            {problem.difficulty}
                        </span>
                        {problem.tags && (
                            <div className="ed-tags">
                                {problem.tags.split(',').slice(0, 3).map((t, i) => (
                                    <span key={i} className="ed-tag">{t.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ed-topbar-actions">
                    <span className="ed-lang-badge">Java 17</span>

                    <button type="button"
                        className={`ed-run-btn${running ? ' loading' : ''}`}
                        onClick={handleRun}
                        disabled={running || submitting}
                        title="Run with custom input (Ctrl+Enter)">
                        {running
                            ? <><span className="spinner" /> Running...</>
                            : <><RunIcon /> Run</>}
                    </button>

                    <button type="button"
                        className={`ed-submit-btn${submitting ? ' loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={running || submitting}
                        title="Submit against all test cases">
                        {submitting
                            ? <><span className="spinner" /> Judging...</>
                            : <><SubmitIcon /> Submit</>}
                    </button>

                    <button type="button"
                        className={`ed-ai-btn${aiLoading ? ' loading' : ''}`}
                        onClick={handleAiInsight}
                        disabled={aiLoading}
                        title="Get AI feedback, complexity analysis and suggestions">
                        {aiLoading
                            ? <><span className="spinner" /> Analyzing...</>
                            : <><AIIcon /> AI Insight</>}
                    </button>
                </div>
            </div>

            {/* ══ ROW 3: 3-Panel Layout ══ */}
            <div className="ed-layout">

                {/* ── PANEL 1: Problem Description (left) ── */}
                <div className="ed-panel ed-panel--left">
                    <div className="ed-panel-tabs">
                        {[
                            { key: 'problem', label: 'Problem' },
                            { key: 'submissions', label: 'My Submissions' },
                        ].map(t => (
                            <button key={t.key}
                                className={`ed-ptab${leftTab === t.key ? ' ed-ptab--active' : ''}`}
                                onClick={() => setLeftTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="ed-panel-body">
                        {leftTab === 'problem' && (
                            <div className="prob-panel animate-fadeIn">
                                <h2 className="prob-title">{problem.title}</h2>
                                <div className="prob-diff-row">
                                    <span className="prob-diff-badge" style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                                        {problem.difficulty}
                                    </span>
                                    {problem.tags && problem.tags.split(',').map((t, i) => (
                                        <span key={i} className="prob-tag">{t.trim()}</span>
                                    ))}
                                </div>

                                <p className="prob-desc">{problem.description}</p>

                                {problem.example_input && (
                                    <div className="prob-example-block">
                                        <div className="prob-section-label">Example</div>
                                        <div className="prob-example">
                                            <div className="prob-ex-row">
                                                <span className="prob-ex-label">Input:</span>
                                                <code className="prob-ex-code">{problem.example_input}</code>
                                            </div>
                                            <div className="prob-ex-row">
                                                <span className="prob-ex-label">Output:</span>
                                                <code className="prob-ex-code">{problem.example_output}</code>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {problem.constraints && (
                                    <div className="prob-constraints-block">
                                        <div className="prob-section-label">Constraints</div>
                                        <ul className="prob-constraints">
                                            {problem.constraints.split('\n').filter(c => c.trim()).map((c, i) => (
                                                <li key={i}><code>{c}</code></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="prob-hint-box">
                                    <span className="prob-hint-icon">💡</span>
                                    <span>Click <strong>AI Insight</strong> after writing code to get error explanations, complexity analysis, and optimization tips.</span>
                                </div>
                            </div>
                        )}

                        {leftTab === 'submissions' && (
                            <div className="prob-panel animate-fadeIn">
                                {submitResult ? (
                                    <div className="sub-result-card">
                                        <div className={`sub-result-verdict ${verdict === 'accepted' ? 'sub-result--ok' : 'sub-result--fail'}`}>
                                            {verdict === 'accepted' ? '✓ Accepted' : '✗ ' + (submitResult.verdict || 'Wrong Answer')}
                                        </div>
                                        <div className="sub-result-stats">
                                            <div className="sub-stat">
                                                <div className="sub-stat-label">Test Cases</div>
                                                <div className="sub-stat-value">{submitResult.passed}/{submitResult.total}</div>
                                            </div>
                                            <div className="sub-stat">
                                                <div className="sub-stat-label">Runtime</div>
                                                <div className="sub-stat-value">{submitResult.runtime || '-'}</div>
                                            </div>
                                        </div>
                                        {submitResult.output && (
                                            <pre className="sub-result-output">{submitResult.output}</pre>
                                        )}
                                    </div>
                                ) : (
                                    <div className="prob-empty">
                                        <div className="prob-empty-icon">📋</div>
                                        <p>Submit your code to see results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PANEL 2: Code Editor (center) ── */}
                <div className="ed-panel ed-panel--center">
                    <div className="ed-editor-header">
                        <div className="ed-editor-file-tabs">
                            <div className="ed-file-tab ed-file-tab--active">
                                <JavaIcon />
                                <span>Solution.java</span>
                            </div>
                        </div>
                        <div className="ed-editor-actions">
                            <button type="button" className="ed-icon-btn"
                                onClick={() => { if (window.confirm('Reset to default template?')) setCode(DEFAULT_TEMPLATE); }}
                                title="Reset code to template">
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="ed-monaco-wrap">
                        <MonacoEditor
                            height="100%"
                            language="java"
                            theme="vs-dark"
                            value={code}
                            onChange={(v) => setCode(v || '')}
                            options={{
                                fontSize: editorPrefs.fontSize,
                                fontFamily: '"Fira Code","Cascadia Code","Consolas",monospace',
                                fontLigatures: true,
                                minimap: { enabled: editorPrefs.minimap },
                                scrollBeyondLastLine: false,
                                lineNumbers: editorPrefs.lineNumbers ? 'on' : 'off',
                                renderLineHighlight: 'all',
                                matchBrackets: 'always',
                                autoIndent: 'full',
                                formatOnPaste: true,
                                formatOnType: true,
                                tabSize: editorPrefs.tabSize,
                                insertSpaces: true,
                                wordWrap: editorPrefs.wordWrap ? 'on' : 'off',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                padding: { top: 16, bottom: 16 },
                                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                                suggest: { showKeywords: true },
                                quickSuggestions: true,
                            }}
                        />
                    </div>

                    <div className="ed-statusbar">
                        <span className="ed-statusbar-item">Ln {code.split('\n').length}</span>
                        <span className="ed-statusbar-item">{code.length} chars</span>
                        {ioStatus === 'compileError' && <span className="ed-statusbar-item ed-status--error">● Compile Error</span>}
                        {ioStatus === 'success' && verdict !== 'wrong' && <span className="ed-statusbar-item ed-status--ok">● Success</span>}
                        {verdict === 'accepted' && <span className="ed-statusbar-item ed-status--ok">✓ Accepted</span>}
                        {verdict === 'wrong' && <span className="ed-statusbar-item ed-status--error">✗ Wrong Answer</span>}
                        <span className="ed-statusbar-right">UTF-8 · Java · LF</span>
                    </div>
                </div>

                {/* ── PANEL 3: Output + AI (right) ── */}
                <div className="ed-panel ed-panel--right">
                    <div className="ed-panel-tabs">
                        <button
                            className={`ed-ptab${rightBottomTab === 'output' ? ' ed-ptab--active' : ''}`}
                            onClick={() => setRightBottomTab('output')}>
                            Output
                            {ioStatus === 'success' && verdict !== 'wrong' && <span className="ed-ptab-dot ed-ptab-dot--ok" />}
                            {(ioStatus === 'error' || ioStatus === 'compileError') && <span className="ed-ptab-dot ed-ptab-dot--err" />}
                        </button>
                        <button
                            className={`ed-ptab${rightBottomTab === 'ai' ? ' ed-ptab--active' : ''}`}
                            onClick={() => setRightBottomTab('ai')}>
                            AI Insight
                            {aiInsight && <span className="ed-ptab-dot ed-ptab-dot--ai" />}
                        </button>
                    </div>

                    <div className="ed-panel-body">

                        {/* OUTPUT PANEL */}
                        {rightBottomTab === 'output' && (
                            <div className="out-panel animate-fadeIn">
                                {/* Custom Input */}
                                <div className="out-input-section">
                                    <div className="out-section-label">
                                        <span>Custom Input</span>
                                        {customInput && (
                                            <button className="out-clear-btn" onClick={() => setCustomInput('')}>Clear</button>
                                        )}
                                    </div>
                                    <textarea
                                        className="out-input-textarea"
                                        value={customInput}
                                        onChange={e => setCustomInput(e.target.value)}
                                        placeholder={"Enter test input here...\nExample:\n4\n2 7 11 15\n9"}
                                        spellCheck={false}
                                    />
                                </div>

                                <div className="out-divider" />

                                {/* Output Result */}
                                <div className="out-result-section">
                                    <div className="out-section-label">Output</div>

                                    {!ioOutput && !ioError && !running && !submitting && (
                                        <div className="out-empty">
                                            <div className="out-empty-icon">▶</div>
                                            <p>Run your code to see output here.</p>
                                        </div>
                                    )}

                                    {(running || submitting) && (
                                        <div className="out-loading">
                                            <div className="output-spinner" />
                                            <span>{submitting ? 'Judging against test cases...' : 'Compiling & running...'}</span>
                                        </div>
                                    )}

                                    {ioStatus === 'compileError' && ioError && !running && !submitting && (
                                        <div className="out-result-wrap">
                                            <div className="out-badge out-badge--error">Compilation Error</div>
                                            <pre className="out-pre out-pre--error">{ioError}</pre>
                                        </div>
                                    )}

                                    {ioStatus === 'error' && !running && !submitting && (
                                        <div className="out-result-wrap">
                                            <div className="out-badge out-badge--warn">
                                                {verdict === 'wrong' ? 'Wrong Answer' : 'Runtime Error'}
                                            </div>
                                            {ioOutput && <pre className="out-pre out-pre--neutral">{ioOutput}</pre>}
                                            {ioError && <pre className="out-pre out-pre--error">{ioError}</pre>}
                                        </div>
                                    )}

                                    {ioStatus === 'success' && verdict === 'accepted' && !running && !submitting && (
                                        <div className="out-result-wrap">
                                            <div className="out-badge out-badge--success">✓ Accepted — All test cases passed!</div>
                                            <pre className="out-pre out-pre--success">{ioOutput}</pre>
                                        </div>
                                    )}

                                    {ioStatus === 'success' && verdict !== 'accepted' && !running && !submitting && (
                                        <div className="out-result-wrap">
                                            <div className="out-badge out-badge--success">Ran Successfully</div>
                                            <pre className="out-pre out-pre--success">{ioOutput}</pre>
                                        </div>
                                    )}

                                    {hasError && !aiInsight && !aiLoading && (
                                        <div className="out-ai-hint">
                                            <span>Got an error?</span>
                                            <button className="out-ai-hint-btn" onClick={handleAiInsight}>
                                                Ask AI to explain →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI INSIGHT PANEL */}
                        {rightBottomTab === 'ai' && (
                            <div className="ai-panel animate-fadeIn">
                                {!aiInsight && !aiLoading && !aiError && (
                                    <div className="ai-empty">
                                        <div className="ai-empty-icon">✦</div>
                                        <h3>AI Code Analysis</h3>
                                        <p>Click <strong>AI Insight</strong> to get:</p>
                                        <ul className="ai-empty-list">
                                            <li>🔍 Error explanation & how to fix it</li>
                                            <li>📖 Code walkthrough in simple English</li>
                                            <li>⚡ Time & space complexity breakdown</li>
                                            <li>💡 3 optimization suggestions</li>
                                            <li>🚀 Optimized code with comments</li>
                                        </ul>
                                        <button className="ai-empty-btn" onClick={handleAiInsight}>
                                            <AIIcon /> Analyze My Code
                                        </button>
                                    </div>
                                )}

                                {aiError && (
                                    <div className="ai-error-box">
                                        <div className="ai-error-title">AI Error</div>
                                        <p>{aiError}</p>
                                        <button className="ai-retry-btn" onClick={handleAiInsight}>Retry</button>
                                    </div>
                                )}

                                {aiLoading && (
                                    <div className="ai-loading">
                                        <div className="ai-loading-orb" />
                                        <h3>Analyzing your code...</h3>
                                        <p>AI is reviewing complexity, errors, and optimizations</p>
                                    </div>
                                )}

                                {aiInsight && !aiLoading && (
                                    <div className="ai-result animate-fadeIn">
                                        {/* AI Tab nav */}
                                        <div className="ai-tabs">
                                            {[
                                                { key: 'explanation', label: 'Explanation', color: '#6366f1' },
                                                ...(aiInsight.errorAnalysis && !aiInsight.errorAnalysis.includes('No errors') ? [{ key: 'error', label: '⚠ Error Fix', color: '#ef4444' }] : []),
                                                { key: 'complexity', label: 'Complexity', color: '#f59e0b' },
                                                { key: 'suggestions', label: 'Tips', color: '#10b981' },
                                                { key: 'optimized', label: 'Optimized Code', color: '#8b5cf6' },
                                            ].map(t => (
                                                <button key={t.key}
                                                    className={`ai-tab${aiTab === t.key ? ' ai-tab--active' : ''}`}
                                                    style={aiTab === t.key ? { borderBottomColor: t.color, color: t.color } : {}}
                                                    onClick={() => setAiTab(t.key)}>
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="ai-tab-content">
                                            {/* Explanation */}
                                            {aiTab === 'explanation' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-header" style={{ borderColor: '#6366f1' }}>
                                                        <span className="ai-section-icon">📖</span>
                                                        <h4>Code Explanation</h4>
                                                    </div>
                                                    <p className="ai-text">{aiInsight.explanation}</p>
                                                    {aiInsight.concepts && (
                                                        <div className="ai-concepts">
                                                            <div className="ai-sub-label">Concepts Used</div>
                                                            <div className="ai-concept-tags">
                                                                {aiInsight.concepts.split(',').map((c, i) => (
                                                                    <span key={i} className="ai-concept-tag">{c.trim()}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Error Analysis */}
                                            {aiTab === 'error' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-header" style={{ borderColor: '#ef4444' }}>
                                                        <span className="ai-section-icon">🔍</span>
                                                        <h4>Error Analysis & Fix</h4>
                                                    </div>
                                                    <div className="ai-error-analysis">
                                                        <div className="ai-sub-label">Why this error occurred:</div>
                                                        <p className="ai-text">{aiInsight.errorAnalysis}</p>
                                                    </div>
                                                    {aiInsight.errorFix && aiInsight.errorFix !== 'No fix needed.' && (
                                                        <div className="ai-code-block">
                                                            <div className="ai-code-header">
                                                                <span>Fixed Code</span>
                                                                <button onClick={() => navigator.clipboard.writeText(aiInsight.errorFix)} className="ai-copy-btn">Copy</button>
                                                            </div>
                                                            <pre className="ai-code-pre"><code>{aiInsight.errorFix}</code></pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Complexity */}
                                            {aiTab === 'complexity' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-header" style={{ borderColor: '#f59e0b' }}>
                                                        <span className="ai-section-icon">⚡</span>
                                                        <h4>Complexity Analysis</h4>
                                                    </div>
                                                    <div className="ai-complexity-grid">
                                                        <div className="ai-complex-card ai-complex-card--time">
                                                            <div className="ai-complex-label">Time</div>
                                                            <div className="ai-complex-value">{aiInsight.timeComplex?.split(' ')[0] || 'O(?)'}</div>
                                                            <div className="ai-complex-desc">{aiInsight.timeComplex}</div>
                                                        </div>
                                                        <div className="ai-complex-card ai-complex-card--space">
                                                            <div className="ai-complex-label">Space</div>
                                                            <div className="ai-complex-value">{aiInsight.spaceComplex?.split(' ')[0] || 'O(?)'}</div>
                                                            <div className="ai-complex-desc">{aiInsight.spaceComplex}</div>
                                                        </div>
                                                    </div>
                                                    {aiInsight.complexity && (
                                                        <div className="ai-complexity-detail">
                                                            {aiInsight.complexity.split('\n').filter(l => l.trim()).map((line, i) => (
                                                                <div key={i} className="ai-complexity-line">
                                                                    <span className="ai-complexity-bullet">→</span>
                                                                    <span>{line.replace(/^[-•→]\s*/, '')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Suggestions */}
                                            {aiTab === 'suggestions' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-header" style={{ borderColor: '#10b981' }}>
                                                        <span className="ai-section-icon">💡</span>
                                                        <h4>Optimization Suggestions</h4>
                                                    </div>
                                                    <div className="ai-suggestions">
                                                        {aiInsight.suggestions?.split('\n').filter(s => s.trim()).map((line, i) => (
                                                            <div key={i} className="ai-suggestion-item">
                                                                <div className="ai-suggestion-num">{i + 1}</div>
                                                                <span className="ai-suggestion-text">{line.replace(/^\d+\.\s*/, '')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optimized Code */}
                                            {aiTab === 'optimized' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-header" style={{ borderColor: '#8b5cf6' }}>
                                                        <span className="ai-section-icon">🚀</span>
                                                        <h4>Optimized Code</h4>
                                                    </div>
                                                    {aiInsight.optimizedCode && (
                                                        <div className="ai-code-block">
                                                            <div className="ai-code-header">
                                                                <span>Solution.java (optimized)</span>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    <button onClick={() => navigator.clipboard.writeText(aiInsight.optimizedCode)} className="ai-copy-btn">Copy</button>
                                                                    <button onClick={() => { if (window.confirm('Replace your code with the optimized version?')) setCode(aiInsight.optimizedCode); }} className="ai-use-btn">Use This</button>
                                                                </div>
                                                            </div>
                                                            <pre className="ai-code-pre"><code>{aiInsight.optimizedCode}</code></pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="ai-refresh-bar">
                                            <span>Want fresh analysis?</span>
                                            <button className="ai-refresh-btn" onClick={handleAiInsight} disabled={aiLoading}>
                                                Re-analyze Code
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Helper components ── */
function EditorNav({ username, role, onLogout }) {
    return (
        <div className="ed-nav">
            <Link to="/" className="ed-nav-logo">
                <div className="ed-nav-logo-icon">{'</>'}</div>
                Code<span>Insight</span>
            </Link>
            <div className="ed-nav-links">
                <Link to="/" className="ed-nav-link">Home</Link>
                <Link to="/dashboard" className="ed-nav-link">Dashboard</Link>
                {role === 'admin' && <Link to="/admin" className="ed-nav-link">Admin</Link>}
            </div>
            <div className="ed-nav-user">
                <div className="ed-nav-avatar">{username[0].toUpperCase()}</div>
                <span className="ed-nav-username">{username}</span>
                <button type="button" className="ed-nav-logout" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}

function RunIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>;
}
function SubmitIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function AIIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2l-5 5"/><path d="M17 2h5v5"/></svg>;
}
function JavaIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
}
