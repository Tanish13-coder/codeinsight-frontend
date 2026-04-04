import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Editor.css';
import MonacoEditor from '@monaco-editor/react';

const DEFAULT_TEMPLATE = `import java.util.*;

public class Solution {
    
    // Write your solution method here
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
        
        int[] result1 = sol.twoSum(new int[]{2,7,11,15}, 9);
        System.out.println(Arrays.toString(result1).replace(", ", ","));
        
        int[] result2 = sol.twoSum(new int[]{3,2,4}, 6);
        System.out.println(Arrays.toString(result2).replace(", ", ","));
        
        int[] result3 = sol.twoSum(new int[]{3,3}, 6);
        System.out.println(Arrays.toString(result3).replace(", ", ","));
    }
}`;

export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();

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

    // ── NEW: Input/Output panel state ──
    const [customInput, setCustomInput] = useState('');
    const [ioTab, setIoTab] = useState('input');  // 'input' | 'output'
    const [ioOutput, setIoOutput] = useState('');
    const [ioError, setIoError] = useState('');
    const [ioStatus, setIoStatus] = useState(null);     // 'success' | 'error' | 'compileError'

    useEffect(() => {
        async function fetchProblem() {
            try {
                const res = await fetch(`/codeinsight/problems?id=${id}`, {
                    credentials: 'include'
                });
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

    const dc = problem ? {
        Easy: { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
        Medium: { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
        Hard: { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
    }[problem.difficulty] : { color: '#00E5A0', bg: '', border: '' };

    // ── Run with custom input simulation ──
    async function handleRun() {
        setRunning(true);
        setActiveTab('output');
        setVerdict(null);
        setOutput('');
        setIoTab('output');
        setIoOutput('');
        setIoError('');
        setIoStatus(null);

        await new Promise(r => setTimeout(r, 1200));

        const hasMain = code.includes('main');
        const hasPrint = code.includes('System.out');
        const hasLogic = code.length > 200;
        const hasUnclosed = (code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length;
        const hasSyntaxHint = code.includes(';;') || code.includes('public public');

        if (!hasMain) {
            // Compilation error
            setIoStatus('compileError');
            setIoError(`Solution.java:1: error: class Solution is missing main method

    public class Solution {
    ^
Error: Main method not found in class Solution.
Please define the main method as:
   public static void main(String[] args)

1 error`);
        } else if (hasUnclosed) {
            // Brace mismatch
            setIoStatus('compileError');
            setIoError(`Solution.java: error: reached end of file while parsing
}
^
1 error

Hint: Check for missing or extra { } braces in your code.`);
        } else if (!hasLogic) {
            setIoStatus('error');
            setIoError('Your solution body appears empty. Write your logic and try again.');
        } else {
            // Simulate successful run with custom input
            setIoStatus('success');
            const inputLines = customInput.trim()
                ? `\nCustom Input:\n${customInput.trim()}\n\n`
                : '';
            setIoOutput(`${inputLines}Output:\n${hasPrint ? '[Your printed output would appear here]' : '(no System.out.println statements found)'}

──────────────────────────────
Runtime : 3 ms
Memory  : 42.1 MB`);
        }

        setRunning(false);
    }

    async function handleSubmit() {
        setSubmitting(true);
        setActiveTab('output');
        setVerdict(null);
        setOutput('Submitting your solution...');
        setIoTab('output');
        try {
            const res = await fetch('/codeinsight/submit', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemId: parseInt(id),
                    code,
                    language: 'Java',
                }),
            });
            const data = await res.json();
            if (data.success) {
                const ok = data.verdict === 'Accepted';
                setVerdict(ok ? 'accepted' : 'wrong');
                setIoStatus(ok ? 'success' : 'error');
                setOutput(`${ok ? '🎉' : '❌'}  ${data.verdict}
──────────────────────────────────────
${data.message}

Problem : ${data.problemTitle}
Runtime : ${data.runtime}
Language: Java 17`);
                setIoOutput(`${ok ? '🎉 Accepted' : '❌ Wrong Answer'}\n\n${data.message}`);
            } else {
                setVerdict('error');
                setIoStatus('error');
                setOutput(`❌  Submission Failed\n\n${data.message}`);
                setIoError(data.message);
            }
        } catch {
            setVerdict('error');
            setIoStatus('error');
            setOutput('❌  Network error. Make sure Tomcat is running.');
            setIoError('Network error. Make sure Tomcat is running.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAiInsight() {
        if (!code.trim()) return;
        setAiLoading(true);
        setActiveTab('ai');
        setAiInsight(null);
        setAiError('');
        try {
            const res = await fetch('/codeinsight/ai-insight', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    problem: problem?.title || '',
                    verdict: verdict || '',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAiInsight(data);
            } else {
                setAiError(data.message || 'AI service failed.');
            }
        } catch {
            setAiError('Could not reach AI service. Is Tomcat running?');
        } finally {
            setAiLoading(false);
        }
    }

    if (loading) return (
        <div className="ed-page">
            <Navbar />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--ci-text2)' }}>
                Loading problem...
            </div>
        </div>
    );

    if (!problem) return (
        <div className="ed-page">
            <Navbar />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <div style={{ color: 'var(--ci-text2)', fontSize: 18 }}>Problem not found.</div>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="ed-page">
            <Navbar />

            {/* ── Top bar ── */}
            <div className="ed-topbar">
                <button className="ed-back" onClick={() => navigate('/dashboard')}>← Back</button>
                <div className="ed-problem-meta">
                    <span className="ed-problem-title">{problem.title}</span>
                    <span className="ed-diff-badge"
                        style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                        {problem.difficulty}
                    </span>
                </div>
                <div className="ed-topbar-actions">
                    <span className="ed-lang-badge">☕ Java 17</span>
                    <button className={`ed-run-btn ${running ? 'loading' : ''}`}
                        onClick={handleRun} disabled={running || submitting}>
                        {running ? <span className="spinner" /> : '▶'} Run
                    </button>
                    <button className={`ed-submit-btn ${submitting ? 'loading' : ''}`}
                        onClick={handleSubmit} disabled={running || submitting}>
                        {submitting ? <span className="spinner" /> : '↑'} Submit
                    </button>
                    <button className={`ed-ai-btn ${aiLoading ? 'loading' : ''}`}
                        onClick={handleAiInsight} disabled={aiLoading}>
                        {aiLoading ? <span className="spinner" /> : '🤖'} AI Insight
                    </button>
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="ed-layout">

                {/* ── LEFT PANEL ── */}
                <div className="ed-left">
                    <div className="ed-left-tabs">
                        {['problem', 'output', 'ai'].map(t => (
                            <button key={t}
                                className={`ed-tab ${activeTab === t ? 'ed-tab--active' : ''}`}
                                onClick={() => setActiveTab(t)}>
                                {t === 'problem' ? '📄 Problem'
                                    : t === 'output'
                                        ? `💻 Output ${verdict === 'accepted' ? '✓' : verdict === 'wrong' || verdict === 'error' ? '✗' : ''}`
                                        : `🤖 AI Insight ${aiInsight ? '●' : ''}`}
                            </button>
                        ))}
                    </div>

                    <div className="ed-left-body">

                        {/* Problem Tab */}
                        {activeTab === 'problem' && (
                            <div className="prob-panel animate-fadeIn">
                                <h2 className="prob-title">{problem.title}</h2>
                                <p className="prob-desc">{problem.description}</p>
                                {problem.example_input && (
                                    <>
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
                                    </>
                                )}
                                {problem.constraints && (
                                    <>
                                        <div className="prob-section-label">Constraints</div>
                                        <ul className="prob-constraints">
                                            {problem.constraints.split('\n').map((c, i) => (
                                                <li key={i}><code>{c}</code></li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Output Tab */}
                        {activeTab === 'output' && (
                            <div className="output-panel animate-fadeIn">
                                {!output && !running && !submitting && (
                                    <div className="output-empty">
                                        <span>▶</span>
                                        <p>Run your code or submit to see results here.</p>
                                    </div>
                                )}
                                {(running || submitting) && (
                                    <div className="output-loading">
                                        <div className="output-spinner" />
                                        <p>{submitting ? 'Judging your submission...' : 'Compiling & running...'}</p>
                                    </div>
                                )}
                                {output && !running && !submitting && (
                                    <pre className={`output-pre ${verdict === 'accepted' ? 'output-accepted'
                                            : verdict === 'wrong' ? 'output-wrong'
                                                : verdict === 'error' ? 'output-error' : ''
                                        }`}>
                                        {output}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* AI Tab */}
                        {activeTab === 'ai' && (
                            <div className="ai-panel animate-fadeIn">
                                {!aiInsight && !aiLoading && !aiError && (
                                    <div className="output-empty">
                                        <span>🤖</span>
                                        <p>Click <strong>AI Insight</strong> to get real Gemini-powered feedback.</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                                            {['📖 Code Explanation', '⏱️ Complexity Analysis', '💡 Optimization Tips'].map(f => (
                                                <span key={f} style={{
                                                    background: 'rgba(99,102,241,0.1)',
                                                    border: '1px solid rgba(99,102,241,0.25)',
                                                    borderRadius: 20, padding: '4px 12px',
                                                    fontSize: 12, color: '#a5b4fc'
                                                }}>{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {aiError && (
                                    <div style={{
                                        margin: 16, padding: '12px 16px',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: 8, color: '#fca5a5', fontSize: 13
                                    }}>
                                        ⚠️ {aiError}
                                    </div>
                                )}
                                {aiLoading && (
                                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div className="output-loading">
                                            <div className="output-spinner" style={{ borderTopColor: '#6366f1' }} />
                                            <p>Gemini is analyzing your code...</p>
                                        </div>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{
                                                background: 'rgba(255,255,255,0.04)',
                                                borderRadius: 12, padding: 16,
                                                display: 'flex', flexDirection: 'column', gap: 10
                                            }}>
                                                <div style={{ height: 14, width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                                                <div style={{ height: 10, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                                                <div style={{ height: 10, width: '75%', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {aiInsight && !aiLoading && (
                                    <div className="ai-result animate-fadeIn"
                                        style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>

                                        {/* Section 1 */}
                                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '3px solid #6366f1', borderRadius: 12, padding: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span style={{ fontSize: 18 }}>📖</span>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Code Explanation</h4>
                                            </div>
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
                                        </div>

                                        {/* Section 2 */}
                                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '3px solid #f59e0b', borderRadius: 12, padding: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span style={{ fontSize: 18 }}>⏱️</span>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Complexity Analysis</h4>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Time</div>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace', marginBottom: 6 }}>{aiInsight.timeComplex?.split(' ')[0] || 'O(?)'}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{aiInsight.timeComplex}</div>
                                                </div>
                                                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 10, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Space</div>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: 'monospace', marginBottom: 6 }}>{aiInsight.spaceComplex?.split(' ')[0] || 'O(?)'}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{aiInsight.spaceComplex}</div>
                                                </div>
                                            </div>
                                            {aiInsight.complexity && (
                                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7, margin: 0 }}>{aiInsight.complexity}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Section 3 */}
                                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '3px solid #10b981', borderRadius: 12, padding: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span style={{ fontSize: 18 }}>💡</span>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Optimization Suggestions</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                                {aiInsight.suggestions?.split('\n').filter(s => s.trim()).map((line, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                                                        <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>→</span>
                                                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {aiInsight.optimizedCode && (
                                                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 12px' }}>
                                                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>✨ Optimized Code</span>
                                                        <button onClick={() => navigator.clipboard.writeText(aiInsight.optimizedCode)}
                                                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                                                            📋 Copy
                                                        </button>
                                                    </div>
                                                    <pre style={{ background: '#0f172a', margin: 0, padding: 14, fontSize: 12, lineHeight: 1.7, color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre', fontFamily: '"Fira Code", "Cascadia Code", monospace' }}>
                                                        <code>{aiInsight.optimizedCode}</code>
                                                    </pre>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="ed-right">

                    {/* Monaco Editor — top 65% */}
                    <div className="ed-editor-header">
                        <span className="ed-file-name">☕ Solution.java</span>
                        <div className="ed-editor-actions">
                            <button className="ed-icon-btn" title="Reset to template"
                                onClick={() => { if (window.confirm('Reset code to template?')) setCode(DEFAULT_TEMPLATE); }}>
                                ↺ Reset
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: '0 0 62%', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <MonacoEditor
                            height="100%"
                            language="java"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                fontSize: 14,
                                fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                                fontLigatures: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                matchBrackets: 'always',
                                autoIndent: 'full',
                                formatOnPaste: true,
                                formatOnType: true,
                                tabSize: 4,
                                insertSpaces: true,
                                wordWrap: 'on',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                padding: { top: 16, bottom: 16 },
                                scrollbar: {
                                    verticalScrollbarSize: 6,
                                    horizontalScrollbarSize: 6,
                                },
                            }}
                        />
                    </div>

                    {/* ── Input / Output Panel — bottom 35% ── */}
                    <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', overflow: 'hidden' }}>

                        {/* IO Tab bar */}
                        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#12121f' }}>
                            <button
                                onClick={() => setIoTab('input')}
                                style={{
                                    padding: '8px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                    background: ioTab === 'input' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    color: ioTab === 'input' ? '#a5b4fc' : '#64748b',
                                    borderBottom: ioTab === 'input' ? '2px solid #6366f1' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                📥 Input
                            </button>
                            <button
                                onClick={() => setIoTab('output')}
                                style={{
                                    padding: '8px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                    background: ioTab === 'output' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    color: ioTab === 'output' ? '#a5b4fc' : '#64748b',
                                    borderBottom: ioTab === 'output' ? '2px solid #6366f1' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                📤 Output
                                {ioStatus === 'compileError' && <span style={{ marginLeft: 6, color: '#f87171', fontSize: 10 }}>● Error</span>}
                                {ioStatus === 'success' && <span style={{ marginLeft: 6, color: '#34d399', fontSize: 10 }}>● OK</span>}
                            </button>

                            {/* Clear button */}
                            {ioTab === 'input' && customInput && (
                                <button onClick={() => setCustomInput('')}
                                    style={{ marginLeft: 'auto', marginRight: 10, padding: '4px 10px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* INPUT tab content */}
                        {ioTab === 'input' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10, gap: 8 }}>
                                <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.04em' }}>
                                    CUSTOM TEST INPUT — will be used when you click Run
                                </div>
                                <textarea
                                    value={customInput}
                                    onChange={e => setCustomInput(e.target.value)}
                                    placeholder={"Enter your test input here...\nExample:\n4\n2 7 11 15\n9"}
                                    style={{
                                        flex: 1, resize: 'none', background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                                        color: '#e2e8f0', fontSize: 13, fontFamily: '"Fira Code", monospace',
                                        padding: 10, outline: 'none', lineHeight: 1.6,
                                    }}
                                />
                            </div>
                        )}

                        {/* OUTPUT tab content */}
                        {ioTab === 'output' && (
                            <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
                                {!ioOutput && !ioError && !running && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: 13, gap: 8 }}>
                                        <span style={{ fontSize: 28 }}>▶</span>
                                        <p style={{ margin: 0 }}>Run your code to see output here.</p>
                                    </div>
                                )}

                                {running && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13, padding: 8 }}>
                                        <div className="output-spinner" style={{ width: 16, height: 16 }} />
                                        Compiling & running...
                                    </div>
                                )}

                                {/* Compilation Error */}
                                {ioStatus === 'compileError' && ioError && !running && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
                                            <span style={{ fontSize: 14 }}>🔴</span>
                                            <span style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>Compilation Error</span>
                                        </div>
                                        <pre style={{
                                            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                            borderRadius: 8, padding: 12, margin: 0, fontSize: 12,
                                            color: '#fca5a5', fontFamily: '"Fira Code", monospace',
                                            lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowX: 'auto'
                                        }}>
                                            {ioError}
                                        </pre>
                                    </div>
                                )}

                                {/* Runtime Error */}
                                {ioStatus === 'error' && ioError && !running && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6 }}>
                                            <span style={{ fontSize: 14 }}>⚠️</span>
                                            <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>Runtime Error</span>
                                        </div>
                                        <pre style={{
                                            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
                                            borderRadius: 8, padding: 12, margin: 0, fontSize: 12,
                                            color: '#fcd34d', fontFamily: '"Fira Code", monospace',
                                            lineHeight: 1.7, whiteSpace: 'pre-wrap'
                                        }}>
                                            {ioError}
                                        </pre>
                                    </div>
                                )}

                                {/* Success Output */}
                                {ioStatus === 'success' && ioOutput && !running && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6 }}>
                                            <span style={{ fontSize: 14 }}>✅</span>
                                            <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700 }}>Ran Successfully</span>
                                        </div>
                                        <pre style={{
                                            background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
                                            borderRadius: 8, padding: 12, margin: 0, fontSize: 12,
                                            color: '#a7f3d0', fontFamily: '"Fira Code", monospace',
                                            lineHeight: 1.7, whiteSpace: 'pre-wrap'
                                        }}>
                                            {ioOutput}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status bar */}
                    <div className="ed-statusbar">
                        <span>Ln {code.split('\n').length}</span>
                        <span>{code.length} chars</span>
                        {ioStatus === 'compileError' && <span style={{ color: '#f87171' }}>● Compile Error</span>}
                        {ioStatus === 'success' && <span style={{ color: '#34d399' }}>● Success</span>}
                        <span style={{ marginLeft: 'auto' }}>UTF-8</span>
                        <span>☕ Java</span>
                    </div>
                </div>
            </div>
        </div>
    );
}