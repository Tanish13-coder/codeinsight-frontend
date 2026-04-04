import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

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