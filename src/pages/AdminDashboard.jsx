import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

const DC = {
    Easy: { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
    Medium: { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
    Hard: { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
};

const VS = {
    'Accepted': { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
    'Wrong Answer': { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
    'TLE': { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
    'Runtime Error': { color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)' },
    'Compilation Error': { color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)' },
};

const EMPTY_FORM = {
    title: '', difficulty: 'Easy', description: '',
    example_input: '', example_output: '', constraints: '', tags: '',
    testCases: '',
};

export default function AdminDashboard() {
    const [tab, setTab] = useState('overview');
    const [problems, setProblems] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [subFilter, setSubFilter] = useState('All');
    const [viewCode, setViewCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProblems();
        fetchSubmissions();
    }, []);

    async function fetchProblems() {
        try {
            const res = await fetch('/codeinsight/problems', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setProblems(data.problems.map(p => ({
                    ...p,
                    tags: p.tags ? p.tags.split(',').map(t => t.trim()) : [],
                })));
            }
        } catch (e) {
            console.error('Failed to load problems.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchSubmissions() {
        try {
            const res = await fetch('/codeinsight/submit', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setSubmissions(data.submissions);
        } catch (e) {
            console.error('Failed to load submissions.');
        }
    }

    function handleFormChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSaveError('');
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!form.title || !form.description) {
            setSaveError('Title and description are required.');
            return;
        }
        setSaving(true);
        setSaveError('');

        try {
            // Parse test cases
            const testCasesArray = form.testCases
                .split('\n')
                .filter(line => line.includes('→'))
                .map(line => {
                    const [input, expected] = line.split('→').map(s => s.trim());
                    return { input, expected };
                });

            const res = await fetch('/codeinsight/problems', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    difficulty: form.difficulty,
                    tags: form.tags,
                    example_input: form.example_input,
                    example_output: form.example_output,
                    constraints: form.constraints,
                    testCases: testCasesArray,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setForm(EMPTY_FORM);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                fetchProblems(); // refresh list
            } else {
                setSaveError(data.message || 'Upload failed.');
            }
        } catch (e) {
            setSaveError('Network error. Make sure Tomcat is running.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteProblem(id) {
        if (!window.confirm('Delete this problem? This cannot be undone.')) return;
        try {
            const res = await fetch(`/codeinsight/problems?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setProblems(prev => prev.filter(p => p.id !== id));
            } else {
                alert(data.message || 'Delete failed.');
            }
        } catch (e) {
            alert('Network error.');
        }
    }

    // Stats
    const totalProblems = problems.length;
    const totalSubmissions = submissions.length;
    const acceptedCount = submissions.filter(s => s.verdict === 'Accepted').length;
    const acceptanceRate = totalSubmissions > 0
        ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;
    const totalUsers = [...new Set(submissions.map(s => s.username))].length;

    const filteredSubs = subFilter === 'All'
        ? submissions
        : submissions.filter(s => s.verdict === subFilter);

    return (
        <div className="ad-page">
            <Navbar />

            <div className="ad-layout">
                {/* SIDEBAR */}
                <aside className="ad-sidebar">
                    <div className="ad-sidebar-head">
                        <div className="ad-shield">🛡️</div>
                        <div>
                            <div className="ad-role-title">Admin Panel</div>
                            <div className="ad-role-sub">CodeInsight Platform</div>
                        </div>
                    </div>

                    <nav className="ad-nav">
                        {[
                            { key: 'overview', icon: '📊', label: 'Overview' },
                            { key: 'upload', icon: '➕', label: 'Upload Problem' },
                            { key: 'problems', icon: '🧩', label: 'Manage Problems' },
                            { key: 'submissions', icon: '📨', label: 'Submissions' },
                        ].map(item => (
                            <button
                                key={item.key}
                                className={`ad-nav-btn ${tab === item.key ? 'ad-nav-btn--active' : ''}`}
                                onClick={() => setTab(item.key)}
                            >
                                <span>{item.icon}</span>{item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MAIN */}
                <main className="ad-main">

                    {/* OVERVIEW */}
                    {tab === 'overview' && (
                        <div className="animate-fadeIn">
                            <div className="ad-header">
                                <h1 className="ad-title">Platform Overview</h1>
                                <p className="ad-subtitle">Real-time stats across CodeInsight</p>
                            </div>

                            <div className="ad-stats-grid">
                                {[
                                    { icon: '🧩', label: 'Total Problems', value: totalProblems, color: '#00D4FF' },
                                    { icon: '👥', label: 'Active Users', value: totalUsers, color: '#7B61FF' },
                                    { icon: '📨', label: 'Total Submissions', value: totalSubmissions, color: '#00E5A0' },
                                    { icon: '✅', label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: '#FFBD2E' },
                                ].map(s => (
                                    <div className="ad-stat-card" key={s.label}>
                                        <div className="ad-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                                        <div className="ad-stat-value" style={{ color: s.color }}>{s.value}</div>
                                        <div className="ad-stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent submissions */}
                            <div className="ad-section">
                                <div className="ad-section-head">
                                    <h2 className="ad-section-title">Recent Submissions</h2>
                                    <button className="ad-view-all" onClick={() => setTab('submissions')}>
                                        View all →
                                    </button>
                                </div>
                                <div className="ad-sub-table">
                                    <div className="ad-sub-header">
                                        <span>User</span>
                                        <span>Problem</span>
                                        <span>Verdict</span>
                                        <span>Time</span>
                                    </div>
                                    {submissions.slice(0, 5).map(s => {
                                        const vs = VS[s.verdict] || VS['Wrong Answer'];
                                        return (
                                            <div className="ad-sub-row" key={s.id}>
                                                <span className="sub-user">
                                                    <span className="sub-avatar">{s.username[0]}</span>
                                                    {s.username}
                                                </span>
                                                <span className="sub-problem">{s.problem}</span>
                                                <span className="sub-verdict"
                                                    style={{ color: vs.color, background: vs.bg, border: `1px solid ${vs.border}` }}>
                                                    {s.verdict}
                                                </span>
                                                <span className="sub-time">{s.time}</span>
                                            </div>
                                        );
                                    })}
                                    {submissions.length === 0 && (
                                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ci-text3)' }}>
                                            No submissions yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Difficulty breakdown */}
                            <div className="ad-section">
                                <h2 className="ad-section-title" style={{ padding: '16px 20px 0' }}>
                                    Problems by Difficulty
                                </h2>
                                <div className="ad-diff-cards">
                                    {['Easy', 'Medium', 'Hard'].map(d => {
                                        const count = problems.filter(p => p.difficulty === d).length;
                                        const dc = DC[d];
                                        return (
                                            <div className="ad-diff-card" key={d}
                                                style={{ borderColor: dc.border, background: dc.bg }}>
                                                <div className="ad-diff-count" style={{ color: dc.color }}>{count}</div>
                                                <div className="ad-diff-label" style={{ color: dc.color }}>{d}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UPLOAD PROBLEM */}
                    {tab === 'upload' && (
                        <div className="animate-fadeIn">
                            <div className="ad-header">
                                <h1 className="ad-title">Upload Problem</h1>
                                <p className="ad-subtitle">Add a new problem to the platform</p>
                            </div>

                            {saved && (
                                <div className="ad-success">
                                    ✓ Problem uploaded successfully and added to the problem set!
                                </div>
                            )}
                            {saveError && (
                                <div style={{
                                    padding: '14px 18px', marginBottom: 20,
                                    background: 'rgba(255,61,154,0.08)',
                                    border: '1px solid rgba(255,61,154,0.25)',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#FF3D9A', fontSize: 14,
                                }}>
                                    ⚠ {saveError}
                                </div>
                            )}

                            <form className="upload-form" onSubmit={handleUpload}>
                                <div className="uf-grid-2">
                                    <div className="uf-field">
                                        <label className="uf-label">Problem Title *</label>
                                        <input className="uf-input" name="title"
                                            placeholder="e.g. Two Sum"
                                            value={form.title} onChange={handleFormChange} required />
                                    </div>
                                    <div className="uf-field">
                                        <label className="uf-label">Difficulty *</label>
                                        <select className="uf-input uf-select" name="difficulty"
                                            value={form.difficulty} onChange={handleFormChange}>
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="uf-field">
                                    <label className="uf-label">Description *</label>
                                    <textarea className="uf-input uf-textarea" name="description"
                                        placeholder="Describe the problem clearly..."
                                        value={form.description} onChange={handleFormChange}
                                        required rows={5} />
                                </div>

                                <div className="uf-grid-2">
                                    <div className="uf-field">
                                        <label className="uf-label">Example Input</label>
                                        <textarea className="uf-input uf-textarea uf-code" name="example_input"
                                            placeholder="nums = [2,7,11,15], target = 9"
                                            value={form.example_input} onChange={handleFormChange} rows={3} />
                                    </div>
                                    <div className="uf-field">
                                        <label className="uf-label">Example Output</label>
                                        <textarea className="uf-input uf-textarea uf-code" name="example_output"
                                            placeholder="[0,1]"
                                            value={form.example_output} onChange={handleFormChange} rows={3} />
                                    </div>
                                </div>

                                <div className="uf-field">
                                    <label className="uf-label">Constraints</label>
                                    <textarea className="uf-input uf-textarea" name="constraints"
                                        placeholder="One per line e.g.:&#10;2 ≤ nums.length ≤ 10⁴"
                                        value={form.constraints} onChange={handleFormChange} rows={3} />
                                </div>

                                <div className="uf-field">
                                    <label className="uf-label">
                                        Tags <span className="uf-hint">(comma-separated)</span>
                                    </label>
                                    <input className="uf-input" name="tags"
                                        placeholder="Array, HashMap, Two Pointers"
                                        value={form.tags} onChange={handleFormChange} />
                                </div>

                                <div className="uf-field">
                                    <label className="uf-label">
                                        Test Cases
                                        <span className="uf-hint"> (format: input → expected, one per line)</span>
                                    </label>
                                    <textarea className="uf-input uf-textarea uf-code" name="testCases"
                                        placeholder="[2,7,11,15],9 → [0,1]&#10;[3,2,4],6 → [1,2]"
                                        value={form.testCases} onChange={handleFormChange} rows={4} />
                                </div>

                                <div className="uf-actions">
                                    <button type="button" className="btn-ghost"
                                        onClick={() => setForm(EMPTY_FORM)}>
                                        Clear Form
                                    </button>
                                    <button type="submit"
                                        className={`btn-primary uf-submit ${saving ? 'loading' : ''}`}
                                        disabled={saving}>
                                        {saving ? <span className="spinner" style={{ borderTopColor: 'var(--ci-bg)' }} /> : '➕'}
                                        {saving ? 'Uploading...' : 'Upload Problem'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MANAGE PROBLEMS */}
                    {tab === 'problems' && (
                        <div className="animate-fadeIn">
                            <div className="ad-header">
                                <h1 className="ad-title">Manage Problems</h1>
                                <p className="ad-subtitle">{problems.length} problems on the platform</p>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--ci-text2)' }}>
                                    Loading problems...
                                </div>
                            ) : (
                                <div className="ad-prob-table">
                                    <div className="ad-prob-header">
                                        <span>#</span>
                                        <span>Title</span>
                                        <span>Difficulty</span>
                                        <span>Tags</span>
                                        <span>Actions</span>
                                    </div>
                                    {problems.map(p => {
                                        const dc = DC[p.difficulty] || DC.Easy;
                                        return (
                                            <div className="ad-prob-row" key={p.id}>
                                                <span className="ap-num">{String(p.id).padStart(2, '0')}</span>
                                                <span className="ap-title">{p.title}</span>
                                                <span className="ap-diff"
                                                    style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                                                    {p.difficulty}
                                                </span>
                                                <span className="ap-tags">
                                                    {p.tags.map(t => (
                                                        <span key={t} className="ap-tag">{t}</span>
                                                    ))}
                                                </span>
                                                <div className="ap-actions">
                                                    <button className="ap-btn ap-btn--delete"
                                                        title="Delete"
                                                        onClick={() => handleDeleteProblem(p.id)}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {problems.length === 0 && (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ci-text3)' }}>
                                            No problems yet. Upload one!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUBMISSIONS */}
                    {tab === 'submissions' && (
                        <div className="animate-fadeIn">
                            <div className="ad-header">
                                <h1 className="ad-title">All Submissions</h1>
                                <p className="ad-subtitle">{submissions.length} total submissions</p>
                            </div>

                            <div className="sub-filter-bar">
                                {['All', 'Accepted', 'Wrong Answer', 'TLE', 'Runtime Error', 'Compilation Error'].map(f => (
                                    <button key={f}
                                        className={`pill ${subFilter === f ? 'pill--active' : ''}`}
                                        onClick={() => setSubFilter(f)}>
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="ad-sub-table ad-sub-table--full">
                                <div className="ad-sub-header ad-sub-header--full">
                                    <span>User</span>
                                    <span>Problem</span>
                                    <span>Difficulty</span>
                                    <span>Verdict</span>
                                    <span>Runtime</span>
                                    <span>Time</span>
                                    <span>Code</span>
                                </div>
                                {filteredSubs.map(s => {
                                    const vs = VS[s.verdict] || VS['Wrong Answer'];
                                    const dc = DC[s.difficulty] || DC.Easy;
                                    return (
                                        <div className="ad-sub-row ad-sub-row--full" key={s.id}>
                                            <span className="sub-user">
                                                <span className="sub-avatar">{s.username[0]}</span>
                                                {s.username}
                                            </span>
                                            <span className="sub-problem">{s.problem}</span>
                                            <span className="sub-diff"
                                                style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                                                {s.difficulty}
                                            </span>
                                            <span className="sub-verdict"
                                                style={{ color: vs.color, background: vs.bg, border: `1px solid ${vs.border}` }}>
                                                {s.verdict}
                                            </span>
                                            <span className="sub-runtime">{s.runtime}</span>
                                            <span className="sub-time">{s.time}</span>
                                            <button className="sub-view-btn" onClick={() => setViewCode(s)}>
                                                View
                                            </button>
                                        </div>
                                    );
                                })}
                                {filteredSubs.length === 0 && (
                                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ci-text3)' }}>
                                        No submissions found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Code modal */}
            {viewCode && (
                <div className="modal-overlay" onClick={() => setViewCode(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="modal-title">
                                    {viewCode.username} — {viewCode.problem}
                                </div>
                                <div className="modal-sub">Java · {viewCode.time}</div>
                            </div>
                            <button className="modal-close" onClick={() => setViewCode(null)}>✕</button>
                        </div>
                        <pre className="modal-code">
                            {viewCode.code || '// Code not available'}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}