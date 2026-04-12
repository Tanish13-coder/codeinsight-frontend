import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Editor.css';
import MonacoEditor from '@monaco-editor/react';
import API from '../api.js';

const DEFAULT_TEMPLATE = `import java.util.*;

public class Solution {
    
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] r1 = sol.twoSum(new int[]{2,7,11,15}, 9);
        System.out.println(Arrays.toString(r1).replace(", ", ","));
        int[] r2 = sol.twoSum(new int[]{3,2,4}, 6);
        System.out.println(Arrays.toString(r2).replace(", ", ","));
        int[] r3 = sol.twoSum(new int[]{3,3}, 6);
        System.out.println(Arrays.toString(r3).replace(", ", ","));
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
    const [output, setOutput] = useState('');
    const [verdict, setVerdict] = useState(null);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('problem');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    const [aiError, setAiError] = useState('');
    const [customInput, setCustomInput] = useState('');
    const [ioTab, setIoTab] = useState('input');
    const [ioOutput, setIoOutput] = useState('');
    const [ioError, setIoError] = useState('');
    const [ioStatus, setIoStatus] = useState(null);

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
        setActiveTab('output');
        setVerdict(null);
        setOutput('');
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
                setIoError((data.verdict === 'TLE' ? 'Time Limit Exceeded (5s)\n' : '') + (data.error || ''));
                if (data.output) setIoOutput(data.output);
            } else {
                setIoStatus('success');
                const inp = customInput.trim() ? `Input:\n${customInput.trim()}\n\n` : '';
                setIoOutput(`${inp}Output:\n${data.output || '(no output)'}\n\nRuntime: ${data.runtime || '-'}`);
            }
        } catch (err) {
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
        setActiveTab('output');
        setVerdict(null);
        setOutput('Submitting your solution...');
        setIoTab('output');
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
                setOutput((ok ? '[OK] ' : '[X] ') + data.verdict + '\n--------------------\n' + data.message + '\nProblem : ' + data.problemTitle + '\nRuntime : ' + data.runtime);
                setIoOutput((ok ? '[OK] Accepted' : '[X] Wrong Answer') + '\n\n' + data.message);
            } else {
                setVerdict('error');
                setIoStatus('error');
                setOutput('[X] Submission Failed\n\n' + data.message);
                setIoError(data.message);
            }
        } catch (err) {
            setVerdict('error');
            setIoStatus('error');
            setOutput('[X] Network error.');
            setIoError('Network error.');
        } finally {
            setSubmitting(false);
        }
    }

    /* ── AI Insight ──────────────────────────────── */
    async function handleAiInsight() {
        if (!code.trim() || aiLoading) return;
        setAiLoading(true);
        setActiveTab('ai');
        setAiInsight(null);
        setAiError('');
        try {
            const res = await fetch(`${API}/codeinsight/ai-insight`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, problem: problem?.title || '', verdict: verdict || '' }),
            });
            const data = await res.json();
            if (data.success) setAiInsight(data);
            else setAiError(data.message || 'AI service failed.');
        } catch {
            setAiError('Could not reach AI service.');
        } finally { setAiLoading(false); }
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <div style={{ fontSize: 18, color: '#64748b' }}>Problem not found.</div>
                <button className="ed-back" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="ed-page">

            {/* ══ ROW 1: Editor Navbar (logo + links + user) ══ */}
            <EditorNav username={username} role={role} onLogout={handleLogout} />

            {/* ══ ROW 2: Problem topbar (back + title + buttons) ══ */}
            <div className="ed-topbar">
                <button type="button" className="ed-back" onClick={() => navigate('/dashboard')}>
                    Back
                </button>

                <div className="ed-problem-meta">
                    <span className="ed-problem-title">{problem.title}</span>
                    <span className="ed-diff-badge"
                        style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                        {problem.difficulty}
                    </span>
                </div>

                <div className="ed-topbar-actions">
                    <span className="ed-lang-badge">Java 17</span>

                    <button type="button"
                        className={`ed-run-btn${running ? ' loading' : ''}`}
                        onClick={handleRun}
                        disabled={running || submitting}>
                        {running ? <span className="spinner" /> : <span>Run</span>}
                        <span>{running ? 'Running...' : ''}</span>
                    </button>

                    <button type="button"
                        className={`ed-submit-btn${submitting ? ' loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={running || submitting}>
                        {submitting ? <span className="spinner" /> : <span>Submit</span>}
                        <span>{submitting ? 'Submitting...' : ''}</span>
                    </button>

                    <button type="button"
                        className={`ed-ai-btn${aiLoading ? ' loading' : ''}`}
                        onClick={handleAiInsight}
                        disabled={aiLoading}>
                        {aiLoading ? <span className="spinner" /> : <span>AI Insight</span>}
                        <span>{aiLoading ? 'Analyzing...' : ''}</span>
                    </button>
                </div>
            </div>

            {/* ══ ROW 3: Main editor layout ══ */}
            <div className="ed-layout">

                {/* LEFT PANEL */}
                <div className="ed-left">
                    <div className="ed-left-tabs">
                        {['problem', 'output', 'ai'].map(t => (
                            <button key={t} type="button"
                                className={`ed-tab${activeTab === t ? ' ed-tab--active' : ''}`}
                                onClick={() => setActiveTab(t)}>
                                {t === 'problem' ? 'Problem'
                                    : t === 'output'
                                        ? `Output${verdict === 'accepted' ? ' OK' : (verdict === 'wrong' || verdict === 'error') ? ' X' : ''}`
                                        : `AI${aiInsight ? ' *' : ''}`}
                            </button>
                        ))}
                    </div>

                    <div className="ed-left-body">
                        {activeTab === 'problem' && (
                            <div className="prob-panel animate-fadeIn">
                                <h2 className="prob-title">{problem.title}</h2>
                                <p className="prob-desc">{problem.description}</p>
                                {problem.example_input && (<>
                                    <div className="prob-section-label">Example</div>
                                    <div className="prob-example">
                                        <div className="prob-ex-row"><span className="prob-ex-label">Input:</span><code className="prob-ex-code">{problem.example_input}</code></div>
                                        <div className="prob-ex-row"><span className="prob-ex-label">Output:</span><code className="prob-ex-code">{problem.example_output}</code></div>
                                    </div>
                                </>)}
                                {problem.constraints && (<>
                                    <div className="prob-section-label">Constraints</div>
                                    <ul className="prob-constraints">
                                        {problem.constraints.split('\n').map((c, i) => <li key={i}><code>{c}</code></li>)}
                                    </ul>
                                </>)}
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="output-panel animate-fadeIn">
                                {!output && !running && !submitting && <div className="output-empty"><p>Run or submit to see results.</p></div>}
                                {(running || submitting) && <div className="output-loading"><div className="output-spinner" /><p>{submitting ? 'Judging...' : 'Compiling & running...'}</p></div>}
                                {output && !running && !submitting && (
                                    <pre className={`output-pre${verdict === 'accepted' ? ' output-accepted' : verdict === 'wrong' ? ' output-wrong' : verdict === 'error' ? ' output-error' : ''}`}>{output}</pre>
                                )}
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="ai-panel animate-fadeIn">
                                {!aiInsight && !aiLoading && !aiError && (
                                    <div className="output-empty">
                                        <p>Click <strong>AI Insight</strong> for feedback.</p>
                                    </div>
                                )}
                                {aiError && <div style={{ margin: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>{aiError}</div>}
                                {aiLoading && (
                                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div className="output-loading"><div className="output-spinner" style={{ borderTopColor: '#6366f1' }} /><p>Analyzing...</p></div>
                                    </div>
                                )}
                                {aiInsight && !aiLoading && (
                                    <div className="ai-result animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
                                        <AiSection color="#6366f1" icon="Explanation" title="Code Explanation">
                                            <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{aiInsight.explanation}</p>
                                            {aiInsight.concepts && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Concepts Used</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                        {aiInsight.concepts.split(',').map((c, i) => (
                                                            <span key={i} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{c.trim()}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </AiSection>
                                        <AiSection color="#f59e0b" icon="Complexity" title="Complexity Analysis">
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                                <ComplexBox label="Time" color="#f59e0b" textColor="#fbbf24" value={aiInsight.timeComplex} />
                                                <ComplexBox label="Space" color="#10b981" textColor="#10b981" value={aiInsight.spaceComplex} />
                                            </div>
                                            {aiInsight.complexity && <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}><p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7, margin: 0 }}>{aiInsight.complexity}</p></div>}
                                        </AiSection>
                                        <AiSection color="#10b981" icon="Tips" title="Optimization Suggestions">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                                {aiInsight.suggestions?.split('\n').filter(s => s.trim()).map((line, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                                                        <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{'->'}</span>
                                                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {aiInsight.optimizedCode && (
                                                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 12px' }}>
                                                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Optimized Code</span>
                                                        <button type="button" onClick={() => navigator.clipboard.writeText(aiInsight.optimizedCode)}
                                                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <pre style={{ background: '#0f172a', margin: 0, padding: 14, fontSize: 12, lineHeight: 1.7, color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre', fontFamily: '"Fira Code",monospace' }}>
                                                        <code>{aiInsight.optimizedCode}</code>
                                                    </pre>
                                                </div>
                                            )}
                                        </AiSection>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="ed-right">
                    <div className="ed-editor-header">
                        <span className="ed-file-name">Solution.java</span>
                        <button type="button" className="ed-icon-btn"
                            onClick={() => { if (window.confirm('Reset code to template?')) setCode(DEFAULT_TEMPLATE); }}>
                            Reset
                        </button>
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
                                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                            }}
                        />
                    </div>

                    {/* IO Panel */}
                    <div className="ed-io-panel">
                        <div className="ed-io-tabs">
                            <button type="button" className={`ed-io-tab${ioTab === 'input' ? ' ed-io-tab--active' : ''}`} onClick={() => setIoTab('input')}>Input</button>
                            <button type="button" className={`ed-io-tab${ioTab === 'output' ? ' ed-io-tab--active' : ''}`} onClick={() => setIoTab('output')}>
                                Output
                                {ioStatus === 'compileError' && <span className="io-dot io-dot--error"> Error</span>}
                                {ioStatus === 'success' && <span className="io-dot io-dot--ok"> OK</span>}
                            </button>
                            {ioTab === 'input' && customInput && (
                                <button type="button" className="ed-io-clear" onClick={() => setCustomInput('')}>Clear</button>
                            )}
                        </div>

                        <div className="ed-io-body">
                            {ioTab === 'input' && (
                                <div className="ed-io-input-wrap">
                                    <div className="ed-io-hint">CUSTOM TEST INPUT</div>
                                    <textarea className="ed-io-textarea" value={customInput}
                                        onChange={e => setCustomInput(e.target.value)}
                                        placeholder={"Enter test input...\nExample:\n4\n2 7 11 15\n9"} />
                                </div>
                            )}
                            {ioTab === 'output' && (
                                <div className="ed-io-output-wrap">
                                    {!ioOutput && !ioError && !running && <div className="ed-io-empty"><p>Run your code to see output.</p></div>}
                                    {running && <div className="ed-io-running"><div className="output-spinner" style={{ width: 16, height: 16 }} /> Compiling...</div>}
                                    {ioStatus === 'compileError' && ioError && !running && (
                                        <div className="ed-io-result"><div className="ed-io-badge ed-io-badge--error">Compilation Error</div><pre className="ed-io-pre ed-io-pre--error">{ioError}</pre></div>
                                    )}
                                    {ioStatus === 'error' && ioError && !running && (
                                        <div className="ed-io-result"><div className="ed-io-badge ed-io-badge--warn">Runtime Error</div><pre className="ed-io-pre ed-io-pre--warn">{ioError}</pre></div>
                                    )}
                                    {ioStatus === 'success' && ioOutput && !running && (
                                        <div className="ed-io-result"><div className="ed-io-badge ed-io-badge--ok">Ran Successfully</div><pre className="ed-io-pre ed-io-pre--ok">{ioOutput}</pre></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ed-statusbar">
                        <span>Ln {code.split('\n').length}</span>
                        <span>{code.length} chars</span>
                        {ioStatus === 'compileError' && <span style={{ color: '#f87171' }}>Compile Error</span>}
                        {ioStatus === 'success' && <span style={{ color: '#34d399' }}>Success</span>}
                        <span style={{ marginLeft: 'auto' }}>UTF-8</span>
                        <span>Java</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Small helper components ── */
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

function AiSection({ color, icon, title, children }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${color}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{title}</h4>
            </div>
            {children}
        </div>
    );
}

function ComplexBox({ label, color, textColor, value }) {
    return (
        <div style={{ background: `rgba(${hexToRgb(color)},0.08)`, border: `1px solid rgba(${hexToRgb(color)},0.25)`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textColor, fontFamily: 'monospace', marginBottom: 6 }}>{value?.split(' ')[0] || 'O(?)'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{value}</div>
        </div>
    );
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}
