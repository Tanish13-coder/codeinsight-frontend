import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Coder';

    const [tab, setTab] = useState('problems');
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [problems, setProblems] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [solvedIds, setSolvedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const DC = {
        Easy: { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)' },
        Medium: { color: '#FFBD2E', bg: 'rgba(255,189,46,0.08)', border: 'rgba(255,189,46,0.2)' },
        Hard: { color: '#FF3D9A', bg: 'rgba(255,61,154,0.08)', border: 'rgba(255,61,154,0.2)' },
    };

    // Fetch everything on mount
    useEffect(() => {
        fetchProblems();
        fetchUserStats();
        fetchLeaderboard();
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
            setError('Failed to load problems.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserStats() {
        try {
            const res = await fetch('/codeinsight/user', { credentials: 'include' });
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
            const res = await fetch('/codeinsight/leaderboard', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setLeaderboard(data.leaderboard);
        } catch (e) {
            console.error('Failed to load leaderboard.');
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

                {/* ── SIDEBAR ── */}
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
                            { key: 'problems', icon: '🧩', label: 'Problems' },
                            { key: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
                            { key: 'analytics', icon: '📊', label: 'Analytics' },
                        ].map(item => (
                            <button
                                key={item.key}
                                className={`snav-btn ${tab === item.key ? 'snav-btn--active' : ''}`}
                                onClick={() => setTab(item.key)}
                            >
                                <span>{item.icon}</span>{item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* ── MAIN ── */}
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
                                    <span className="search-icon">🔍</span>
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
                                                        ? <span className="status-solved">✓ Solved</span>
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
                                                {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
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
                                    { label: 'Total Solved', value: solved, icon: '✅', color: '#00E5A0' },
                                    { label: 'Global Rank', value: `#${userStats?.rank || '—'}`, icon: '🏆', color: '#00D4FF' },
                                    { label: 'Acceptance Rate', value: `${userStats?.acceptanceRate || 0}%`, icon: '📈', color: '#7B61FF' },
                                    { label: 'Submissions', value: userStats?.totalSubmissions || 0, icon: '📨', color: '#00D4FF' },
                                    { label: 'Easy Solved', value: `${easySolved}/${easyTotal}`, icon: '🟢', color: '#00E5A0' },
                                    { label: 'Medium Solved', value: `${mediumSolved}/${mediumTotal}`, icon: '🟡', color: '#FFBD2E' },
                                    { label: 'Hard Solved', value: `${hardSolved}/${hardTotal}`, icon: '🔴', color: '#FF3D9A' },
                                    { label: 'Total Score', value: userStats?.score || 0, icon: '⭐', color: '#FFBD2E' },
                                ].map(s => (
                                    <div className="an-card" key={s.label}>
                                        <div className="an-icon" style={{ color: s.color }}>{s.icon}</div>
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
                </main>
            </div>
        </div>
    );
}