import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Editor.css';
import MonacoEditor from '@monaco-editor/react';
import API from '../api.js';
import Logo from '../components/Logo.jsx';

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
        const p = JSON.parse(localStorage.getItem('ci-editor-prefs') || '{}');
        return { fontSize: p.fontSize || 14, tabSize: p.tabSize || 4, lineNumbers: p.lineNumbers !== false, wordWrap: p.wordWrap !== false, minimap: p.minimap || false };
    } catch { return { fontSize: 14, tabSize: 4, lineNumbers: true, wordWrap: true, minimap: false }; }
}

const DIFF_COLORS = {
    Easy:   { color: '#00e5a0', bg: 'rgba(0,229,160,0.1)',   border: 'rgba(0,229,160,0.25)' },
    Medium: { color: '#ffbd2e', bg: 'rgba(255,189,46,0.1)',  border: 'rgba(255,189,46,0.25)' },
    Hard:   { color: '#ff3d9a', bg: 'rgba(255,61,154,0.1)',  border: 'rgba(255,61,154,0.25)' },
};

export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';
    const role = localStorage.getItem('role');
    const prefs = readEditorPrefs();

    // Problem
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editor
    const [code, setCode] = useState(DEFAULT_TEMPLATE);
    const [leftTab, setLeftTab] = useState('problem');

    // Run / Submit
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [runResult, setRunResult] = useState(null);   // { status, badge, output, error }
    const [submitResult, setSubmitResult] = useState(null); // { verdict, passed, total, runtime, output }
    const [rightTab, setRightTab] = useState('output');

    // AI
    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiError, setAiError] = useState('');
    const [aiTab, setAiTab] = useState('explain');

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${API}/codeinsight/problems?id=${id}`, { credentials: 'include' });
                const data = await res.json();
                setProblem(data.id ? data : null);
            } catch { setProblem(null); }
            finally { setLoading(false); }
        }
        load();
    }, [id]);

    /* ── Run ── */
    const handleRun = useCallback(async () => {
        if (running || submitting) return;
        setRunning(true);
        setRightTab('output');
        setRunResult(null);
        setSubmitResult(null);
        try {
            const res = await fetch(`${API}/codeinsight/run`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, input: customInput }),
            });
            const d = await res.json();
            if (d.verdict === 'Compilation Error') {
                setRunResult({ status: 'compile', badge: 'Compilation Error', output: '', error: d.error || 'Compile failed.' });
            } else if (d.verdict === 'Runtime Error' || d.verdict === 'TLE') {
                setRunResult({ status: 'error', badge: d.verdict === 'TLE' ? 'Time Limit Exceeded' : 'Runtime Error', output: d.output || '', error: d.error || '' });
            } else {
                const inp = customInput.trim() ? `📥 Input:\n${customInput.trim()}\n\n` : '';
                setRunResult({ status: 'ok', badge: 'Ran Successfully', output: `${inp}📤 Output:\n${d.output || '(no output)'}\n\n⏱ Runtime: ${d.runtime || '-'}`, error: '' });
            }
        } catch {
            setRunResult({ status: 'error', badge: 'Network Error', output: '', error: 'Could not reach server.' });
        } finally { setRunning(false); }
    }, [code, customInput, running, submitting]);

    /* ── Submit ── */
    const handleSubmit = useCallback(async () => {
        if (running || submitting) return;
        setSubmitting(true);
        setRightTab('output');
        setRunResult(null);
        setSubmitResult(null);
        try {
            const res = await fetch(`${API}/codeinsight/submit`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problemId: parseInt(id), code, language: 'Java', userId: parseInt(localStorage.getItem('userId')), username: localStorage.getItem('username') }),
            });
            const d = await res.json();
            if (d.success) {
                setSubmitResult({ verdict: d.verdict, passed: d.passed, total: d.total, runtime: d.runtime, output: d.output || '', message: d.message || '' });
            } else {
                setRunResult({ status: 'error', badge: 'Submission Error', output: '', error: d.message || 'Submission failed.' });
            }
        } catch {
            setRunResult({ status: 'error', badge: 'Network Error', output: '', error: 'Could not reach server.' });
        } finally { setSubmitting(false); }
    }, [code, id, running, submitting]);

    /* ── AI Insight ── */
    const handleAI = useCallback(async () => {
        if (!code.trim() || aiLoading) return;
        setAiLoading(true);
        setRightTab('ai');
        setAiData(null);
        setAiError('');
        setAiTab('explain');

        // Figure out current verdict to pass to AI
        let currentVerdict = '';
        if (submitResult) currentVerdict = submitResult.verdict;
        else if (runResult) {
            if (runResult.status === 'compile') currentVerdict = 'Compilation Error';
            else if (runResult.status === 'error') currentVerdict = 'Runtime Error';
        }

        try {
            const res = await fetch(`${API}/codeinsight/ai-insight`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, problem: problem?.title || '', verdict: currentVerdict }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error ${res.status}: ${text.substring(0, 200)}`);
            }

            const d = await res.json();
            if (d.success) {
                setAiData(d);
                // Auto-show error tab if there's an error
                if (d.errorAnalysis && !d.errorAnalysis.includes('No errors')) setAiTab('error');
            } else {
                setAiError(d.message || 'AI service unavailable. Please check GEMINI_API_KEY is set.');
            }
        } catch (e) {
            setAiError(`AI service error: ${e.message || 'Could not reach AI service. Make sure backend is running.'}`);
        } finally { setAiLoading(false); }
    }, [code, problem, runResult, submitResult, aiLoading]);

    /* ── Keyboard shortcuts ── */
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleRun]);

    if (loading) return (
        <div className="ed-page"><EditorNav username={username} role={role} onLogout={() => { localStorage.clear(); navigate('/'); }} />
            <div className="ed-loader"><div className="ed-spinner-lg" /><span>Loading problem...</span></div>
        </div>
    );

    if (!problem) return (
        <div className="ed-page"><EditorNav username={username} role={role} onLogout={() => { localStorage.clear(); navigate('/'); }} />
            <div className="ed-loader"><div style={{ fontSize: 40 }}>🔍</div><div style={{ fontSize: 18, color: '#64748b' }}>Problem not found.</div>
                <button className="ed-back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
            </div>
        </div>
    );

    const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Easy;
    const hasError = runResult?.status === 'compile' || runResult?.status === 'error' || submitResult?.verdict === 'Wrong Answer' || submitResult?.verdict === 'Runtime Error' || submitResult?.verdict === 'Compilation Error' || submitResult?.verdict === 'TLE';
    const isAccepted = submitResult?.verdict === 'Accepted';

    const AI_TABS = [
        { key: 'explain', label: '📖 Explanation' },
        ...(aiData?.errorAnalysis && !aiData.errorAnalysis.startsWith('No errors') ? [{ key: 'error', label: '⚠️ Error Fix', hot: true }] : []),
        { key: 'complexity', label: '⚡ Complexity' },
        { key: 'tips', label: '💡 Tips' },
        { key: 'optimized', label: '🚀 Optimized' },
    ];

    return (
        <div className="ed-page">
            {/* ── Navbar ── */}
            <EditorNav username={username} role={role} onLogout={() => { localStorage.clear(); navigate('/'); }} />

            {/* ── Top bar ── */}
            <div className="ed-topbar">
                <div className="ed-topbar-left">
                    <button className="ed-back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
                    <div className="ed-problem-info">
                        <span className="ed-problem-title">{problem.title}</span>
                        <span className="ed-diff-badge" style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>{problem.difficulty}</span>
                        {problem.tags && problem.tags.split(',').slice(0, 2).map((t, i) => (
                            <span key={i} className="ed-tag">{t.trim()}</span>
                        ))}
                    </div>
                </div>
                <div className="ed-topbar-right">
                    <span className="ed-lang-chip">Java 17</span>
                    <button className={`ed-btn ed-btn--run ${running ? 'ed-btn--loading' : ''}`} onClick={handleRun} disabled={running || submitting} title="Run (Ctrl+Enter)">
                        {running ? <><Spinner /> Running...</> : <><PlayIcon /> Run</>}
                    </button>
                    <button className={`ed-btn ed-btn--submit ${submitting ? 'ed-btn--loading' : ''}`} onClick={handleSubmit} disabled={running || submitting}>
                        {submitting ? <><Spinner /> Judging...</> : <><CheckIcon /> Submit</>}
                    </button>
                    <button className={`ed-btn ed-btn--ai ${aiLoading ? 'ed-btn--loading' : ''}`} onClick={handleAI} disabled={aiLoading} title="Get AI analysis, error fix, complexity">
                        {aiLoading ? <><Spinner /> Analyzing...</> : <><AIIcon /> AI Insight</>}
                    </button>
                </div>
            </div>

            {/* ── 3-Panel Layout ── */}
            <div className="ed-layout">

                {/* Panel 1: Problem */}
                <div className="ed-panel ed-panel--left">
                    <div className="ed-tabs">
                        {['problem', 'result'].map(t => (
                            <button key={t} className={`ed-tab ${leftTab === t ? 'ed-tab--active' : ''}`} onClick={() => setLeftTab(t)}>
                                {t === 'problem' ? 'Problem' : `Result${submitResult ? (isAccepted ? ' ✓' : ' ✗') : ''}`}
                            </button>
                        ))}
                    </div>
                    <div className="ed-panel-scroll">
                        {leftTab === 'problem' && (
                            <div className="prob-body animate-fadeIn">
                                <h1 className="prob-title">{problem.title}</h1>
                                <div className="prob-meta">
                                    <span className="prob-diff" style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>{problem.difficulty}</span>
                                    {problem.tags && problem.tags.split(',').map((t, i) => <span key={i} className="prob-tag">{t.trim()}</span>)}
                                </div>
                                <div className="prob-desc">{problem.description}</div>
                                {problem.example_input && (
                                    <div className="prob-example">
                                        <div className="prob-label">Example</div>
                                        <div className="prob-ex-box">
                                            <div className="prob-ex-row"><span className="prob-ex-key">Input:</span><code>{problem.example_input}</code></div>
                                            <div className="prob-ex-row"><span className="prob-ex-key">Output:</span><code>{problem.example_output}</code></div>
                                        </div>
                                    </div>
                                )}
                                {problem.constraints && (
                                    <div className="prob-constraints">
                                        <div className="prob-label">Constraints</div>
                                        <ul>{problem.constraints.split('\n').filter(Boolean).map((c, i) => <li key={i}><code>{c}</code></li>)}</ul>
                                    </div>
                                )}
                                <div className="prob-ai-tip">
                                    <span>✦</span>
                                    <span>Click <strong>AI Insight</strong> after coding to get error fixes, complexity analysis, and optimization tips</span>
                                </div>
                            </div>
                        )}
                        {leftTab === 'result' && (
                            <div className="prob-body animate-fadeIn">
                                {!submitResult ? (
                                    <div className="result-empty">
                                        <div className="result-empty-icon">📋</div>
                                        <p>Submit your code to see the verdict here</p>
                                    </div>
                                ) : (
                                    <div className="result-card">
                                        <div className={`result-verdict ${isAccepted ? 'result-verdict--ok' : 'result-verdict--fail'}`}>
                                            {isAccepted ? '✓ Accepted' : `✗ ${submitResult.verdict}`}
                                        </div>
                                        <div className="result-stats">
                                            <div className="result-stat">
                                                <div className="result-stat-label">Test Cases</div>
                                                <div className="result-stat-val" style={{ color: isAccepted ? '#00e5a0' : '#ff3d9a' }}>{submitResult.passed}/{submitResult.total}</div>
                                            </div>
                                            <div className="result-stat">
                                                <div className="result-stat-label">Runtime</div>
                                                <div className="result-stat-val">{submitResult.runtime || '—'}</div>
                                            </div>
                                        </div>
                                        {submitResult.message && <div className="result-msg">{submitResult.message}</div>}
                                        {submitResult.output && <pre className="result-out">{submitResult.output}</pre>}
                                        {hasError && (
                                            <button className="result-ai-btn" onClick={handleAI} disabled={aiLoading}>
                                                <AIIcon /> {aiLoading ? 'Analyzing...' : 'Explain Error with AI →'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel 2: Monaco Editor */}
                <div className="ed-panel ed-panel--center">
                    <div className="ed-editor-bar">
                        <div className="ed-file-tab">
                            <CodeIcon /><span>Solution.java</span>
                        </div>
                        <div className="ed-editor-bar-right">
                            <button className="ed-reset-btn" onClick={() => { if (window.confirm('Reset to template?')) setCode(DEFAULT_TEMPLATE); }} title="Reset code">Reset</button>
                        </div>
                    </div>

                    <div className="ed-monaco-wrap">
                        <MonacoEditor
                            height="100%" language="java" theme="vs-dark"
                            value={code}
                            onChange={v => setCode(v || '')}
                            options={{
                                fontSize: prefs.fontSize,
                                fontFamily: '"Fira Code","Cascadia Code","Consolas",monospace',
                                fontLigatures: true,
                                minimap: { enabled: prefs.minimap },
                                scrollBeyondLastLine: false,
                                lineNumbers: prefs.lineNumbers ? 'on' : 'off',
                                renderLineHighlight: 'all',
                                matchBrackets: 'always',
                                autoIndent: 'full',
                                formatOnPaste: true,
                                tabSize: prefs.tabSize,
                                wordWrap: prefs.wordWrap ? 'on' : 'off',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                padding: { top: 16, bottom: 16 },
                                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                            }}
                        />
                    </div>

                    <div className="ed-statusbar">
                        <span>Ln {code.split('\n').length}</span>
                        <span>{code.length} chars</span>
                        {runResult?.status === 'compile' && <span className="ed-status-error">● Compile Error</span>}
                        {runResult?.status === 'ok' && <span className="ed-status-ok">● Ran OK</span>}
                        {isAccepted && <span className="ed-status-ok">✓ Accepted</span>}
                        {submitResult && !isAccepted && <span className="ed-status-error">✗ {submitResult.verdict}</span>}
                        <span style={{ marginLeft: 'auto' }}>Java · UTF-8</span>
                    </div>
                </div>

                {/* Panel 3: Output + AI */}
                <div className="ed-panel ed-panel--right">
                    <div className="ed-tabs">
                        <button className={`ed-tab ${rightTab === 'output' ? 'ed-tab--active' : ''}`} onClick={() => setRightTab('output')}>
                            Output
                            {runResult?.status === 'ok' && <span className="ed-tab-dot ed-tab-dot--ok" />}
                            {(runResult?.status === 'compile' || runResult?.status === 'error') && <span className="ed-tab-dot ed-tab-dot--err" />}
                        </button>
                        <button className={`ed-tab ${rightTab === 'ai' ? 'ed-tab--active' : ''}`} onClick={() => setRightTab('ai')}>
                            AI Insight
                            {aiData && <span className="ed-tab-dot ed-tab-dot--ai" />}
                        </button>
                    </div>

                    <div className="ed-panel-scroll">

                        {/* ── OUTPUT ── */}
                        {rightTab === 'output' && (
                            <div className="out-panel animate-fadeIn">
                                <div className="out-section">
                                    <div className="out-section-head">
                                        <span>Custom Input</span>
                                        {customInput && <button className="out-clear" onClick={() => setCustomInput('')}>Clear</button>}
                                    </div>
                                    <textarea className="out-input" value={customInput} onChange={e => setCustomInput(e.target.value)}
                                        placeholder={"Enter test input here...\nExample:\n4\n2 7 11 15\n9"} spellCheck={false} />
                                </div>

                                <div className="out-divider" />

                                <div className="out-section out-section--result">
                                    <div className="out-section-head"><span>Output</span></div>

                                    {!runResult && !running && !submitting && !submitResult && (
                                        <div className="out-empty">
                                            <div className="out-empty-icon">▶</div>
                                            <p>Run your code to see output</p>
                                            <span className="out-shortcut">Ctrl+Enter to run</span>
                                        </div>
                                    )}

                                    {(running || submitting) && (
                                        <div className="out-loading">
                                            <div className="out-spinner" />
                                            <span>{submitting ? 'Judging against all test cases...' : 'Compiling & running...'}</span>
                                        </div>
                                    )}

                                    {runResult && !running && (
                                        <div className="out-result">
                                            <div className={`out-badge out-badge--${runResult.status}`}>{runResult.badge}</div>
                                            {runResult.output && <pre className={`out-pre out-pre--${runResult.status}`}>{runResult.output}</pre>}
                                            {runResult.error && <pre className="out-pre out-pre--error">{runResult.error}</pre>}
                                            {(runResult.status === 'compile' || runResult.status === 'error') && !aiLoading && (
                                                <button className="out-ai-btn" onClick={handleAI}><AIIcon /> Explain this error →</button>
                                            )}
                                        </div>
                                    )}

                                    {submitResult && !submitting && (
                                        <div className="out-result">
                                            <div className={`out-badge ${isAccepted ? 'out-badge--ok' : 'out-badge--error'}`}>
                                                {isAccepted ? '✓ Accepted — All test cases passed!' : `✗ ${submitResult.verdict}`}
                                            </div>
                                            {submitResult.message && <div className="out-msg">{submitResult.message}</div>}
                                            {submitResult.output && <pre className={`out-pre ${isAccepted ? 'out-pre--ok' : 'out-pre--error'}`}>{submitResult.output}</pre>}
                                            {!isAccepted && !aiLoading && (
                                                <button className="out-ai-btn" onClick={handleAI}><AIIcon /> Explain & fix with AI →</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── AI INSIGHT ── */}
                        {rightTab === 'ai' && (
                            <div className="ai-wrap animate-fadeIn">

                                {!aiData && !aiLoading && !aiError && (
                                    <div className="ai-empty">
                                        <div className="ai-empty-glow" />
                                        <div className="ai-empty-icon">✦</div>
                                        <h3>AI Code Analysis</h3>
                                        <p>Click <strong>AI Insight</strong> to instantly get:</p>
                                        <ul className="ai-feature-list">
                                            <li>🔍 Error explanation & fixed code</li>
                                            <li>📖 Plain-English code walkthrough</li>
                                            <li>⚡ Time & space complexity</li>
                                            <li>💡 3 optimization suggestions</li>
                                            <li>🚀 Optimized code to copy</li>
                                        </ul>
                                        <button className="ai-empty-btn" onClick={handleAI}><AIIcon /> Analyze My Code</button>
                                    </div>
                                )}

                                {aiError && (
                                    <div className="ai-error-box">
                                        <div className="ai-error-title">⚠ AI Service Error</div>
                                        <p>{aiError}</p>
                                        <div className="ai-error-hint">Make sure: 1) Backend is running 2) GEMINI_API_KEY is set in env</div>
                                        <button className="ai-retry-btn" onClick={handleAI}>Retry</button>
                                    </div>
                                )}

                                {aiLoading && (
                                    <div className="ai-loading">
                                        <div className="ai-loading-ring" />
                                        <h3>Analyzing your code...</h3>
                                        <p>Checking errors, complexity & optimizations</p>
                                    </div>
                                )}

                                {aiData && !aiLoading && (
                                    <div className="ai-result animate-fadeIn">
                                        <div className="ai-tabs">
                                            {AI_TABS.map(t => (
                                                <button key={t.key} className={`ai-tab ${aiTab === t.key ? 'ai-tab--active' : ''} ${t.hot ? 'ai-tab--hot' : ''}`}
                                                    onClick={() => setAiTab(t.key)}>{t.label}</button>
                                            ))}
                                        </div>

                                        <div className="ai-content">
                                            {aiTab === 'explain' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-head" style={{ '--c': '#6366f1' }}>
                                                        <span>📖</span><h4>Code Explanation</h4>
                                                    </div>
                                                    <p className="ai-text">{aiData.explanation || 'No explanation available.'}</p>
                                                    {aiData.concepts && (
                                                        <div className="ai-concepts">
                                                            <div className="ai-mini-label">Concepts Used</div>
                                                            <div className="ai-concept-chips">
                                                                {aiData.concepts.split(',').map((c, i) => <span key={i} className="ai-chip">{c.trim()}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {aiTab === 'error' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-head" style={{ '--c': '#ef4444' }}>
                                                        <span>🔍</span><h4>Error Analysis & Fix</h4>
                                                    </div>
                                                    <div className="ai-error-analysis">
                                                        <div className="ai-mini-label">Why this error occurred:</div>
                                                        <p className="ai-text">{aiData.errorAnalysis || 'No error analysis available.'}</p>
                                                    </div>
                                                    {aiData.errorFix && aiData.errorFix !== 'No fix needed.' && (
                                                        <div className="ai-code-wrap">
                                                            <div className="ai-code-head">
                                                                <span>Fixed Code</span>
                                                                <div className="ai-code-actions">
                                                                    <button onClick={() => navigator.clipboard.writeText(aiData.errorFix)} className="ai-btn-copy">Copy</button>
                                                                    <button onClick={() => { if (window.confirm('Replace your code with the fix?')) setCode(aiData.errorFix); }} className="ai-btn-use">Use Fix</button>
                                                                </div>
                                                            </div>
                                                            <pre className="ai-code-pre">{aiData.errorFix}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {aiTab === 'complexity' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-head" style={{ '--c': '#f59e0b' }}>
                                                        <span>⚡</span><h4>Complexity Analysis</h4>
                                                    </div>
                                                    <div className="ai-complex-grid">
                                                        <div className="ai-complex-card ai-complex-card--time">
                                                            <div className="ai-complex-label">Time</div>
                                                            <div className="ai-complex-val">{(aiData.timeComplex || 'O(?)').split(' ')[0]}</div>
                                                            <div className="ai-complex-desc">{aiData.timeComplex || '—'}</div>
                                                        </div>
                                                        <div className="ai-complex-card ai-complex-card--space">
                                                            <div className="ai-complex-label">Space</div>
                                                            <div className="ai-complex-val">{(aiData.spaceComplex || 'O(?)').split(' ')[0]}</div>
                                                            <div className="ai-complex-desc">{aiData.spaceComplex || '—'}</div>
                                                        </div>
                                                    </div>
                                                    {aiData.complexity && (
                                                        <div className="ai-complexity-detail">
                                                            {aiData.complexity.split('\n').filter(Boolean).map((l, i) => (
                                                                <div key={i} className="ai-complexity-line">
                                                                    <span className="ai-bullet">→</span>
                                                                    <span>{l.replace(/^[-•→\d.]\s*/, '')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {aiTab === 'tips' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-head" style={{ '--c': '#10b981' }}>
                                                        <span>💡</span><h4>Optimization Suggestions</h4>
                                                    </div>
                                                    <div className="ai-tips">
                                                        {(aiData.suggestions || '').split('\n').filter(Boolean).map((tip, i) => (
                                                            <div key={i} className="ai-tip">
                                                                <div className="ai-tip-num">{i + 1}</div>
                                                                <span>{tip.replace(/^\d+\.\s*/, '')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {aiTab === 'optimized' && (
                                                <div className="ai-section animate-fadeIn">
                                                    <div className="ai-section-head" style={{ '--c': '#8b5cf6' }}>
                                                        <span>🚀</span><h4>Optimized Code</h4>
                                                    </div>
                                                    {aiData.optimizedCode ? (
                                                        <div className="ai-code-wrap">
                                                            <div className="ai-code-head">
                                                                <span>Solution.java (optimized)</span>
                                                                <div className="ai-code-actions">
                                                                    <button onClick={() => navigator.clipboard.writeText(aiData.optimizedCode)} className="ai-btn-copy">Copy</button>
                                                                    <button onClick={() => { if (window.confirm('Replace your editor code with the optimized version?')) setCode(aiData.optimizedCode); }} className="ai-btn-use">Use This</button>
                                                                </div>
                                                            </div>
                                                            <pre className="ai-code-pre">{aiData.optimizedCode}</pre>
                                                        </div>
                                                    ) : <p className="ai-text">No optimized code available.</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="ai-footer">
                                            <span>Results from Google Gemini AI</span>
                                            <button className="ai-reanalyze" onClick={handleAI} disabled={aiLoading}>Re-analyze</button>
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

/* ── Sub-components ── */
function EditorNav({ username, role, onLogout }) {
    return (
        <nav className="ed-nav">
            <Link to="/" className="ed-nav-logo">
                <Logo size="sm" />
            </Link>
            <div className="ed-nav-links">
                <Link to="/" className="ed-nav-link">Home</Link>
                <Link to="/dashboard" className="ed-nav-link">Dashboard</Link>
                {role === 'admin' && <Link to="/admin" className="ed-nav-link">Admin</Link>}
            </div>
            <div className="ed-nav-user">
                <div className="ed-user-avatar">{username[0].toUpperCase()}</div>
                <span className="ed-user-name">{username}</span>
                <button className="ed-logout-btn" onClick={onLogout}>Logout</button>
            </div>
        </nav>
    );
}

const Spinner = () => <span className="btn-spinner" />;
const PlayIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>;
const CheckIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const AIIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M22 2l-5 5" /><path d="M17 2h5v5" /></svg>;
const CodeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
