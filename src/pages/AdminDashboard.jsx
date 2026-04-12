import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';
import API from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';

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
    const { theme, toggleTheme } = useTheme();
    const adminUsername = localStorage.getItem('username') || 'Admin';
    const adminRole = localStorage.getItem('role') || 'admin';

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

    useEffect(() => {
        if (tab === 'submissions' || tab === 'overview') {
            fetchSubmissions();
        }
    }, [tab]);

    async function fetchProblems() {
        try {
            const res = await fetch(`${API}/codeinsight/problems`, { credentials: 'include' });
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
            const res = await fetch(`${API}/codeinsight/submit`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) setSubmissions(data.submissions);
            else console.error('Submissions fetch failed:', data.message);
        } catch (e) {
            console.error('Failed to load submissions:', e);
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
            const testCasesArray = form.testCases
                .split('\n')
                .filter(line => line.includes('→'))
                .map(line => {
                    const [input, expected] = line.split('→').map(s => s.trim());
                    return { input, expected };
                });

            const res = await fetch(`${API}/codeinsight/problems`, {
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
                fetchProblems();
            } else {
                setSaveError(data.message || 'Upload failed.');
            }
        } catch (e) {
            setSaveError('Network error.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteProblem(id) {
        if (!window.confirm('Delete this problem? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API}/codeinsight/problems?id=${id}`, {
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

    const totalProblems = problems.length;
    const totalSubmissions = submissions.length;
    const acceptedCount = submissions.filter(s => s.verdict === 'Accepted').length;
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;
    const totalUsers = [...new Set(submissions.map(s => s.username))].length;
    const filteredSubs = subFilter === 'All' ? submissions : submissions.filter(s => s.verdict === subFilter);

    return (
        <div className="ad-page">
            <Navbar />

            <div className="ad-layout">
                {/* SIDEBAR */}
                <aside className="ad-sidebar">
                    <div className="ad-sidebar-head">
                        <div className="ad-shield"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                        <div>
                            <div className="ad-role-title">Admin Panel</div>
                            <div className="ad-role-sub">CodeInsight Platform</div>
                        </div>
                    </div>

                    <nav className="ad-nav">
                        {[
                            { key: 'overview', label: 'Overview', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                            { key: 'upload', label: 'Upload Problem', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
                            { key: 'problems', label: 'Manage Problems', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                            { key: 'submissions', label: 'Submissions', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
                            { key: 'settings', label: 'Settings', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
                        ].map(item => (
                            <button
                                key={item.key}
                                className={`ad-nav-btn ${tab === item.key ? 'ad-nav-btn--active' : ''}`}
                                onClick={() => setTab(item.key)}
                            >
                                {item.svg}{item.label}
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
                                    {
                                        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-7H4a2 2 0 0 0-2 2v17z"/><path d="M14 2v6h6"/><path d="M10 13H8"/><path d="M16 17H8"/><path d="M13 9H8"/></svg>,
                                        label: 'Total Problems', value: totalProblems, color: '#00D4FF',
                                    },
                                    {
                                        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                                        label: 'Active Users', value: totalUsers, color: '#7B61FF',
                                    },
                                    {
                                        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
                                        label: 'Total Submissions', value: totalSubmissions, color: '#00E5A0',
                                    },
                                    {
                                        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                                        label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: '#FFBD2E',
                                    },
                                ].map(s => (
                                    <div className="ad-stat-card" key={s.label}>
                                        <div className="ad-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                                        <div className="ad-stat-value" style={{ color: s.color }}>{s.value}</div>
                                        <div className="ad-stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="ad-section">
                                <div className="ad-section-head">
                                    <h2 className="ad-section-title">Recent Submissions</h2>
                                    <button className="ad-view-all" onClick={() => setTab('submissions')}>
                                        View all →
                                    </button>
                                </div>
                                <div className="ad-sub-table">
                                    <div className="ad-sub-header">
                                        <span>User</span><span>Problem</span><span>Verdict</span><span>Time</span>
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
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Problem uploaded successfully!
                                </div>
                            )}
                            {saveError && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '14px 18px', marginBottom: 20,
                                    background: 'rgba(255,61,154,0.08)',
                                    border: '1px solid rgba(255,61,154,0.25)',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#FF3D9A', fontSize: 14,
                                }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {saveError}
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
                                        placeholder="One per line"
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
                                        placeholder="[2,7,11,15],9 → [0,1]"
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
                                        {saving
                                            ? <span className="spinner" style={{ borderTopColor: 'var(--ci-bg)' }} />
                                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        }
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
                                        <span>#</span><span>Title</span><span>Difficulty</span><span>Tags</span><span>Actions</span>
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
                                                    {p.tags.map(t => <span key={t} className="ap-tag">{t}</span>)}
                                                </span>
                                                <div className="ap-actions">
                                                    <button className="ap-btn ap-btn--delete"
                                                        onClick={() => handleDeleteProblem(p.id)}
                                                        aria-label="Delete problem">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
                                    <span>User</span><span>Problem</span><span>Difficulty</span>
                                    <span>Verdict</span><span>Runtime</span><span>Time</span><span>Code</span>
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
                    {/* ADMIN SETTINGS TAB */}
                    {tab === 'settings' && (
                        <div className="animate-fadeIn">
                            <div className="ad-header">
                                <h1 className="ad-title">Settings</h1>
                                <p className="ad-subtitle">Platform and account configuration</p>
                            </div>

                            <div className="settings-sections">

                                {/* Appearance */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Appearance</div>
                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Theme</span>
                                            <span className="settings-hint">Switch between dark and light mode</span>
                                        </div>
                                        <button
                                            className="theme-toggle-btn"
                                            onClick={toggleTheme}
                                            aria-label="Toggle theme"
                                        >
                                            <span className="theme-toggle-icon">
                                                {theme === 'dark'
                                                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                                                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                                                }
                                            </span>
                                            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                            <span className="theme-toggle-pill" data-active={theme === 'light'} />
                                        </button>
                                    </div>
                                </div>

                                {/* Platform Settings */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Platform Settings</div>
                                    <p style={{ fontSize: 13, color: 'var(--ci-text3)', marginBottom: 4 }}>
                                        Read-only configuration values for the current deployment.
                                    </p>
                                    {[
                                        { label: 'Backend URL', value: 'http://localhost:8080' },
                                        { label: 'Frontend URL', value: 'http://localhost:5173' },
                                        { label: 'Judge Timeout', value: '5 seconds' },
                                        { label: 'Max Submission Limit', value: '200 per day' },
                                    ].map(item => (
                                        <div className="settings-row" key={item.label}>
                                            <div className="settings-label-group">
                                                <span className="settings-label">{item.label}</span>
                                            </div>
                                            <code className="settings-value">{item.value}</code>
                                        </div>
                                    ))}
                                </div>

                                {/* Account Info */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Account Info</div>
                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Username</span>
                                        </div>
                                        <span className="settings-value">{adminUsername}</span>
                                    </div>
                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Role</span>
                                        </div>
                                        <span className="settings-badge settings-badge--admin">{adminRole}</span>
                                    </div>
                                </div>

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
                                <div className="modal-title">{viewCode.username} — {viewCode.problem}</div>
                                <div className="modal-sub">Java · {viewCode.time}</div>
                            </div>
                            <button className="modal-close" onClick={() => setViewCode(null)} aria-label="Close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
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
