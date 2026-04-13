import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useTheme } from '../context/ThemeContext.jsx';
import Logo from './Logo.jsx';

const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
);

const MoonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
);

const LogoutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open on mobile
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    function isActive(path) {
        return location.pathname === path ? 'active' : '';
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar-inner">

                {/* ── Logo ── */}
                <Link to="/" className="navbar-logo">
                    <Logo size="sm" />
                </Link>

                {/* ── Center Nav Links ── */}
                <div className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/')}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        Home
                    </Link>

                    {isLoggedIn && (
                        <>
                            <Link
                                to="/dashboard"
                                className={`nav-link ${isActive('/dashboard')}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Problems
                            </Link>
                            <Link
                                to="/dashboard"
                                className={`nav-link ${location.pathname === '/dashboard' && 'active'}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Leaderboard
                            </Link>
                            {role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className={`nav-link ${isActive('/admin')}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Admin
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* ── Right Actions ── */}
                <div className="navbar-actions">

                    {/* Theme Toggle */}
                    <button
                        className="navbar-theme-btn"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>

                    {isLoggedIn ? (
                        <div className="navbar-user">
                            <div className="user-avatar" title={username}>
                                {username ? username[0].toUpperCase() : 'U'}
                            </div>
                            <span className="user-name">{username}</span>
                            <button className="nav-logout-btn" onClick={handleLogout}>
                                <LogoutIcon />
                                Logout
                            </button>
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

                    {/* Hamburger (mobile only) */}
                    <button
                        className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

            </div>
        </nav>
    );
}
