import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Dashboard.css';
import API from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';

const ACCENT_PRESETS = [
    { label: 'Cyan', value: '#00D4FF' },
    { label: 'Purple', value: '#7B61FF' },
    { label: 'Green', value: '#00E5A0' },
    { label: 'Orange', value: '#FF6B35' },
    { label: 'Pink', value: '#FF3D9A' },
    { label: 'Gold', value: '#FFBD2E' },
];

function getEditorPrefs() {
    try {
        return JSON.parse(localStorage.getItem('ci-editor-prefs') || '{}');
    } catch { return {}; }
}

function getNotifPrefs() {
    try {
        return JSON.parse(localStorage.getItem('ci-notifications') || '{}');
    } catch { return {}; }
}

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const username = localStorage.getItem('username') || 'Coder';
    const role = localStorage.getItem('role') || 'user';

    const [tab, setTab] = useState('problems');
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [problems, setProblems] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [solvedIds, setSolvedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Settings state
    const [editorPrefs, setEditorPrefs] = useState(() => ({
        fontSize: 14, tabSize: 4, lineNumbers: true, wordWrap: true, minimap: false,
        ...getEditorPrefs(),
    }));
    const [notifPrefs, setNotifPrefs] = useState(() => ({
        emailOnAccepted: true, weeklyReport: false, newProblems: true,
        ...getNotifPrefs(),
    }));
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwMsg, setPwMsg] = useState({ text: '', ok: false });
    const [pwLoading, setPwLoading] = useState(false);

    const [reviewForm, setReviewForm] = useState({ rating: 5, text: '', role: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewMsg, setReviewMsg] = useState({ text: '', ok: false });

    const DC = {
        Easy: { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
        Medium: { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
        Hard: { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
    };

    useEffect(() => {
        fetchProblems();
        fetchUserStats();
        fetchLeaderboard();
    }, [location.pathname]);

    useEffect(() => {
        if (tab === 'leaderboard') fetchLeaderboard();
        if (tab === 'analytics') fetchUserStats();
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
            setError('Failed to load problems.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserStats() {
        try {
            const res = await fetch(`${API}/codeinsight/user`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setUserStats(data);
                setSolvedIds(data.solvedProblemIds || []);
            }
        } catch (e) {
            console.error('Failed to load user stats.');
        }
    }

    async function fetchLeaderboard() {
        try {
            const res = await fetch(`${API}/codeinsight/leaderboard`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setLeaderboard(data.leaderboard);
        } catch (e) {
            console.error('Failed to load leaderboard.');
        }
    }

    function updateEditorPref(key, value) {
        const next = { ...editorPrefs, [key]: value };
        setEditorPrefs(next);
        localStorage.setItem('ci-editor-prefs', JSON.stringify(next));
    }

    function updateNotifPref(key, value) {
        const next = { ...notifPrefs, [key]: value };
        setNotifPrefs(next);
        localStorage.setItem('ci-notifications', JSON.stringify(next));
    }

    function setAccentColor(hex) {
        document.documentElement.style.setProperty('--ci-accent', hex);
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (pwForm.next !== pwForm.confirm) {
            setPwMsg({ text: 'New passwords do not match.', ok: false });
            return;
        }
        if (pwForm.next.length < 6) {
            setPwMsg({ text: 'Password must be at least 6 characters.', ok: false });
            return;
        }
        setPwLoading(true);
        setPwMsg({ text: '', ok: false });
        try {
            const res = await fetch(`${API}/codeinsight/user/password`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            if (!res.ok) {
                setPwMsg({ text: 'Endpoint not available yet. Password change will be enabled soon.', ok: false });
            } else {
                const data = await res.json();
                if (data.success) {
                    setPwMsg({ text: 'Password changed successfully.', ok: true });
                    setPwForm({ current: '', next: '', confirm: '' });
                } else {
                    setPwMsg({ text: data.message || 'Failed to change password.', ok: false });
                }
            }
        } catch {
            setPwMsg({ text: 'Endpoint not available yet. Password change will be enabled soon.', ok: false });
        } finally {
            setPwLoading(false);
        }
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();
        if (!reviewForm.text.trim()) {
            setReviewMsg({ text: 'Please write your review before submitting.', ok: false });
            return;
        }
        setReviewSubmitting(true);
        setReviewMsg({ text: '', ok: false });
        try {
            const res = await fetch(`${API}/codeinsight/reviews`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewForm),
            });
            const data = await res.json();
            if (data.success) {
                setReviewMsg({ text: data.message || 'Review submitted for approval.', ok: true });
                setReviewForm({ rating: 5, text: '', role: '' });
            } else {
                setReviewMsg({ text: data.message || 'Failed to submit review.', ok: false });
            }
        } catch {
            setReviewMsg({ text: 'Failed to submit review. Please try again.', ok: false });
        } finally {
            setReviewSubmitting(false);
        }
    }

    const filtered = problems.filter(p => {
        const matchDiff = filter === 'All' || p.difficulty === filter;
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        return matchDiff && matchSearch;
    });

    const solved = solvedIds.length;
    const total = problems.length;
    const easyTotal = problems.filter(p => p.difficulty === 'Easy').length;
    const mediumTotal = problems.filter(p => p.difficulty === 'Medium').length;
    const hardTotal = problems.filter(p => p.difficulty === 'Hard').length;
    const easySolved = userStats?.easySolved || 0;
    const mediumSolved = userStats?.mediumSolved || 0;
    const hardSolved = userStats?.hardSolved || 0;

    return (
        <div className="db-page">
            <Navbar />
            <div className="db-layout">

                
                <aside className="db-sidebar">
                    <div className="sidebar-profile">
                        <div className="profile-avatar">{username[0].toUpperCase()}</div>
                        <div className="profile-info">
                            <div className="profile-name">{username}</div>
                            <div className="profile-rank">
                                Rank <strong style={{ color: 'var(--ci-accent)' }}>
                                    #{userStats?.rank || '—'}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-stats">
                        <div className="ss-row">
                            <span className="ss-label">Problems Solved</span>
                            <span className="ss-value">{solved}/{total}</span>
                        </div>
                        <div className="progress-bar-wrap">
                            <div className="progress-bar-fill"
                                style={{ width: total > 0 ? `${(solved / total) * 100}%` : '0%' }} />
                        </div>
                    </div>

                    <div className="diff-breakdown">
                        {[
                            { label: 'Easy', solved: easySolved, total: easyTotal, color: '#00E5A0' },
                            { label: 'Medium', solved: mediumSolved, total: mediumTotal, color: '#FFBD2E' },
                            { label: 'Hard', solved: hardSolved, total: hardTotal, color: '#FF3D9A' },
                        ].map(d => (
                            <div className="diff-row" key={d.label}>
                                <span className="diff-label" style={{ color: d.color }}>{d.label}</span>
                                <div className="diff-bar-wrap">
                                    <div className="diff-bar-fill" style={{
                                        width: d.total > 0 ? `${(d.solved / d.total) * 100}%` : '0%',
                                        background: d.color,
                                    }} />
                                </div>
                                <span className="diff-count">{d.solved}/{d.total}</span>
                            </div>
                        ))}
                    </div>

                    <nav className="sidebar-nav">
                        {[
                            { key: 'problems', label: 'Problems', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
                            { key: 'leaderboard', label: 'Leaderboard', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                            { key: 'analytics', label: 'Analytics', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
                            { key: 'settings', label: 'Settings', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
                            { key: 'review', label: 'Write Review', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                        ].map(item => (
                            <button
                                key={item.key}
                                className={`snav-btn ${tab === item.key ? 'snav-btn--active' : ''}`}
                                onClick={() => setTab(item.key)}
                            >
                                {item.svg}{item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                
                <main className="db-main">

                    {/* PROBLEMS TAB */}
                    {tab === 'problems' && (
                        <div className="animate-fadeIn">
                            <div className="db-header">
                                <div>
                                    <h1 className="db-title">Problem Set</h1>
                                    <p className="db-subtitle">Pick a problem and start solving</p>
                                </div>
                            </div>

                            <div className="filter-bar">
                                <div className="search-wrap">
                                    <span className="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                                    <input
                                        className="search-input"
                                        placeholder="Search problems..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="filter-pills">
                                    {['All', 'Easy', 'Medium', 'Hard'].map(f => (
                                        <button
                                            key={f}
                                            className={`pill ${filter === f ? 'pill--active' : ''}`}
                                            onClick={() => setFilter(f)}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--ci-text2)' }}>
                                    Loading problems...
                                </div>
                            ) : error ? (
                                <div style={{ textAlign: 'center', padding: 60, color: '#FF3D9A' }}>
                                    {error}
                                </div>
                            ) : (
                                <div className="problem-list">
                                    <div className="problem-list-header">
                                        <span>#</span>
                                        <span>Title</span>
                                        <span>Difficulty</span>
                                        <span>Tags</span>
                                        <span>Status</span>
                                        <span></span>
                                    </div>
                                    {filtered.map(p => {
                                        const dc = DC[p.difficulty] || DC.Easy;
                                        const isSolved = solvedIds.includes(p.id);
                                        return (
                                            <div
                                                className={`problem-row ${isSolved ? 'problem-row--solved' : ''}`}
                                                key={p.id}
                                            >
                                                <span className="p-num">{String(p.id).padStart(2, '0')}</span>
                                                <span className="p-title">{p.title}</span>
                                                <span className="p-diff"
                                                    style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
                                                    {p.difficulty}
                                                </span>
                                                <span className="p-tags">
                                                    {p.tags.map(t => (
                                                        <span key={t} className="p-tag">{t}</span>
                                                    ))}
                                                </span>
                                                <span className="p-status">
                                                    {isSolved
                                                        ? <span className="status-solved"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Solved</span>
                                                        : <span className="status-todo">— Todo</span>}
                                                </span>
                                                <button
                                                    className="btn-primary p-solve-btn"
                                                    onClick={() => navigate(`/editor/${p.id}`)}
                                                >
                                                    {isSolved ? 'Revisit' : 'Solve →'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ci-text3)' }}>
                                            No problems found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEADERBOARD TAB */}
                    {tab === 'leaderboard' && (
                        <div className="animate-fadeIn">
                            <div className="db-header">
                                <div>
                                    <h1 className="db-title">Leaderboard</h1>
                                    <p className="db-subtitle">Top coders this month</p>
                                </div>
                            </div>
                            {leaderboard.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--ci-text2)' }}>
                                    No leaderboard data yet. Start solving problems!
                                </div>
                            ) : (
                                <div className="leaderboard-list">
                                    {leaderboard.map(u => (
                                        <div key={u.rank} className={`lb-row ${u.isYou ? 'lb-row--you' : ''}`}>
                                            <div className="lb-rank">
                                                {u.rank === 1 ? <span style={{color:'#FFD700',fontWeight:800}}>1st</span> : u.rank === 2 ? <span style={{color:'#C0C0C0',fontWeight:800}}>2nd</span> : u.rank === 3 ? <span style={{color:'#CD7F32',fontWeight:800}}>3rd</span> : `#${u.rank}`}
                                            </div>
                                            <div className="lb-avatar">{u.username[0].toUpperCase()}</div>
                                            <div className="lb-info">
                                                <span className="lb-name">
                                                    {u.username}
                                                    {u.isYou && <span className="you-badge">You</span>}
                                                </span>
                                                <span className="lb-sub">{u.solved} problems solved</span>
                                            </div>
                                            <div className="lb-score">
                                                <span className="score-value">{u.score?.toLocaleString()}</span>
                                                <span className="score-label">pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {tab === 'analytics' && (
                        <div className="animate-fadeIn">
                            <div className="db-header">
                                <div>
                                    <h1 className="db-title">Your Analytics</h1>
                                    <p className="db-subtitle">Track your coding journey</p>
                                </div>
                            </div>

                            <div className="analytics-grid">
                                {[
                                    { label: 'Total Solved', value: solved, color: '#00E5A0', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                                    { label: 'Global Rank', value: `#${userStats?.rank || '—'}`, color: '#00D4FF', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                                    { label: 'Acceptance Rate', value: `${userStats?.acceptanceRate || 0}%`, color: '#7B61FF', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                                    { label: 'Submissions', value: userStats?.totalSubmissions || 0, color: '#00D4FF', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
                                    { label: 'Easy Solved', value: `${easySolved}/${easyTotal}`, color: '#00E5A0', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                                    { label: 'Medium Solved', value: `${mediumSolved}/${mediumTotal}`, color: '#FFBD2E', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                                    { label: 'Hard Solved', value: `${hardSolved}/${hardTotal}`, color: '#FF3D9A', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
                                    { label: 'Total Score', value: userStats?.score || 0, color: '#FFBD2E', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                                ].map(s => (
                                    <div className="an-card" key={s.label}>
                                        <div className="an-icon" style={{ color: s.color }}>{s.svg}</div>
                                        <div className="an-value" style={{ color: s.color }}>{s.value}</div>
                                        <div className="an-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="activity-section">
                                <h2 className="activity-title">Recent Activity</h2>
                                <div className="activity-list">
                                    {userStats?.recentActivity?.length > 0 ? (
                                        userStats.recentActivity.map((a, i) => (
                                            <div className="activity-row" key={i}>
                                                <div className={`verdict-dot ${a.verdict === 'Accepted' ? 'vd--green' : 'vd--red'}`} />
                                                <span className="act-problem">{a.problem}</span>
                                                <span className={`act-verdict ${a.verdict === 'Accepted' ? 'av--green' : 'av--red'}`}>
                                                    {a.verdict}
                                                </span>
                                                <span className="act-lang">{a.lang}</span>
                                                <span className="act-time">{a.time}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ci-text3)' }}>
                                            No activity yet. Start solving problems!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* SETTINGS TAB */}
                    {tab === 'settings' && (
                        <div className="animate-fadeIn">
                            <div className="db-header">
                                <div>
                                    <h1 className="db-title">Settings</h1>
                                    <p className="db-subtitle">Customize your CodeInsight experience</p>
                                </div>
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
                                            <span className="theme-toggle-icon">{theme === 'dark'
                                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                                            }</span>
                                            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                            <span className="theme-toggle-pill" data-active={theme === 'light'} />
                                        </button>
                                    </div>
                                    <div className="settings-row settings-row--wrap">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Accent Color</span>
                                            <span className="settings-hint">Changes the primary highlight color</span>
                                        </div>
                                        <div className="accent-presets">
                                            {ACCENT_PRESETS.map(p => (
                                                <button
                                                    key={p.value}
                                                    className="accent-swatch"
                                                    style={{ background: p.value }}
                                                    title={p.label}
                                                    onClick={() => setAccentColor(p.value)}
                                                    aria-label={`Set accent to ${p.label}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Editor Preferences */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Editor Preferences</div>

                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Font Size</span>
                                            <span className="settings-hint">Code editor font size in pixels</span>
                                        </div>
                                        <div className="settings-select-group">
                                            {[12, 14, 16, 18].map(sz => (
                                                <button
                                                    key={sz}
                                                    className={`settings-chip ${editorPrefs.fontSize === sz ? 'settings-chip--active' : ''}`}
                                                    onClick={() => updateEditorPref('fontSize', sz)}
                                                >
                                                    {sz}px
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Tab Size</span>
                                            <span className="settings-hint">Number of spaces per tab</span>
                                        </div>
                                        <div className="settings-select-group">
                                            {[2, 4].map(sz => (
                                                <button
                                                    key={sz}
                                                    className={`settings-chip ${editorPrefs.tabSize === sz ? 'settings-chip--active' : ''}`}
                                                    onClick={() => updateEditorPref('tabSize', sz)}
                                                >
                                                    {sz} spaces
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Line Numbers</span>
                                            <span className="settings-hint">Show line numbers in the editor</span>
                                        </div>
                                        <button
                                            className={`toggle-switch ${editorPrefs.lineNumbers ? 'toggle-switch--on' : ''}`}
                                            onClick={() => updateEditorPref('lineNumbers', !editorPrefs.lineNumbers)}
                                            aria-label="Toggle line numbers"
                                        >
                                            <span className="toggle-thumb" />
                                        </button>
                                    </div>

                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Word Wrap</span>
                                            <span className="settings-hint">Wrap long lines in the editor</span>
                                        </div>
                                        <button
                                            className={`toggle-switch ${editorPrefs.wordWrap ? 'toggle-switch--on' : ''}`}
                                            onClick={() => updateEditorPref('wordWrap', !editorPrefs.wordWrap)}
                                            aria-label="Toggle word wrap"
                                        >
                                            <span className="toggle-thumb" />
                                        </button>
                                    </div>

                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Minimap</span>
                                            <span className="settings-hint">Show code minimap on the right</span>
                                        </div>
                                        <button
                                            className={`toggle-switch ${editorPrefs.minimap ? 'toggle-switch--on' : ''}`}
                                            onClick={() => updateEditorPref('minimap', !editorPrefs.minimap)}
                                            aria-label="Toggle minimap"
                                        >
                                            <span className="toggle-thumb" />
                                        </button>
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Account Info</div>
                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Username</span>
                                        </div>
                                        <span className="settings-value">{username}</span>
                                    </div>
                                    <div className="settings-row">
                                        <div className="settings-label-group">
                                            <span className="settings-label">Role</span>
                                        </div>
                                        <span className="settings-badge">{role}</span>
                                    </div>

                                    <div className="settings-divider" />
                                    <div className="settings-card-subtitle">Change Password</div>

                                    {pwMsg.text && (
                                        <div className={`settings-msg ${pwMsg.ok ? 'settings-msg--ok' : 'settings-msg--err'}`}>
                                            {pwMsg.text}
                                        </div>
                                    )}

                                    <form className="pw-form" onSubmit={handleChangePassword}>
                                        <input
                                            className="settings-input"
                                            type="password"
                                            placeholder="Current password"
                                            value={pwForm.current}
                                            onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                                            required
                                        />
                                        <input
                                            className="settings-input"
                                            type="password"
                                            placeholder="New password"
                                            value={pwForm.next}
                                            onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                                            required
                                        />
                                        <input
                                            className="settings-input"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={pwForm.confirm}
                                            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={pwLoading}
                                            style={{ alignSelf: 'flex-start' }}
                                        >
                                            {pwLoading ? 'Saving...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>

                                {/* Notifications */}
                                <div className="settings-card">
                                    <div className="settings-card-title">Notifications</div>

                                    {[
                                        { key: 'emailOnAccepted', label: 'Email on Accepted', hint: 'Get an email when your submission is accepted' },
                                        { key: 'weeklyReport', label: 'Weekly Progress Report', hint: 'Receive a weekly summary of your activity' },
                                        { key: 'newProblems', label: 'New Problem Alerts', hint: 'Be notified when new problems are added' },
                                    ].map(n => (
                                        <div className="settings-row" key={n.key}>
                                            <div className="settings-label-group">
                                                <span className="settings-label">{n.label}</span>
                                                <span className="settings-hint">{n.hint}</span>
                                            </div>
                                            <button
                                                className={`toggle-switch ${notifPrefs[n.key] ? 'toggle-switch--on' : ''}`}
                                                onClick={() => updateNotifPref(n.key, !notifPrefs[n.key])}
                                                aria-label={`Toggle ${n.label}`}
                                            >
                                                <span className="toggle-thumb" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* REVIEW TAB */}
                    {tab === 'review' && (
                        <div className="animate-fadeIn">
                            <div className="db-header">
                                <div>
                                    <h1 className="db-title">Share Your Experience</h1>
                                    <p className="db-subtitle">Tell the community what you think about CodeInsight</p>
                                </div>
                            </div>

                            <div className="settings-sections">
                                <div className="settings-card" style={{ maxWidth: 560 }}>
                                    {reviewMsg.text && (
                                        <div className={`settings-msg ${reviewMsg.ok ? 'settings-msg--ok' : 'settings-msg--err'}`}>
                                            {reviewMsg.text}
                                        </div>
                                    )}

                                    <form className="pw-form" onSubmit={handleReviewSubmit}>
                                        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                                            <span className="settings-label">Your Rating</span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: 2,
                                                            color: star <= reviewForm.rating ? '#FFBD2E' : 'var(--ci-text3)',
                                                            transition: 'color 0.15s',
                                                        }}
                                                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                                    >
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill={star <= reviewForm.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <textarea
                                            className="settings-input"
                                            placeholder="Tell others about your experience with CodeInsight..."
                                            value={reviewForm.text}
                                            onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                                            rows={5}
                                            maxLength={500}
                                            style={{ resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
                                            required
                                        />
                                        <div style={{ fontSize: 12, color: 'var(--ci-text3)', textAlign: 'right', marginTop: -8 }}>
                                            {reviewForm.text.length}/500
                                        </div>

                                        <input
                                            className="settings-input"
                                            type="text"
                                            placeholder="Your Role (e.g. CS Student, SDE Intern at Google...)"
                                            value={reviewForm.role}
                                            onChange={e => setReviewForm(f => ({ ...f, role: e.target.value }))}
                                            maxLength={100}
                                        />

                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={reviewSubmitting}
                                            style={{ alignSelf: 'flex-start' }}
                                        >
                                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>

                                    <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ci-text3)' }}>
                                        Your review will appear on the homepage after admin approval.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
