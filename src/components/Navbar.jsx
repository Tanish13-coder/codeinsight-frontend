import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">{'</>'}</span>
                    <span className="logo-text">Code<span className="logo-accent">Insight</span></span>
                </Link>

                {/* Center links */}
                <div className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
                    <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
                    {isLoggedIn && (
                        <>
                            <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                            {role === 'admin' && (
                                <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>Admin</Link>
                            )}
                        </>
                    )}
                </div>

                {/* Right side */}
                <div className="navbar-actions">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: '1px solid var(--ci-border2)',
                            background: 'transparent',
                            color: 'var(--ci-text2)',
                            fontSize: 17,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--ci-accent)';
                            e.currentTarget.style.color = 'var(--ci-accent)';
                            e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--ci-border2)';
                            e.currentTarget.style.color = 'var(--ci-text2)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {theme === 'dark'
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        }
                    </button>

                    {isLoggedIn ? (
                        <div className="navbar-user">
                            <div className="user-avatar">
                                {username ? username[0].toUpperCase() : 'U'}
                            </div>
                            <span className="user-name">{username}</span>
                            <button className="btn-ghost nav-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login">
                                <button className="btn-ghost nav-btn">Sign In</button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-primary nav-btn">Get Started</button>
                            </Link>
                        </>
                    )}

                    {/* Hamburger */}
                    <button
                        className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </div>
        </nav>
    );
}