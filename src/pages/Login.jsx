import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.username || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/codeinsight/login', {
                                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);
                navigate(data.role === 'admin' ? '/admin' : '/dashboard');
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="orb orb-blue" style={{ width: 400, height: 400, top: -100, left: -100 }} />
                <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: -80, right: -80 }} />
                <div className="grid-bg" />
            </div>

            <div className="auth-card animate-fadeUp">
                {/* Header */}
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">{'</>'}</span>
                        <span>Code<span style={{ color: 'var(--ci-accent)' }}>Insight</span></span>
                    </Link>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to continue your coding journey</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="auth-error">
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field-group">
                        <label className="field-label">Username</label>
                        <div className="field-wrap">
                            <span className="field-icon">👤</span>
                            <input
                                className="field-input"
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <div className="field-wrap">
                            <span className="field-icon">🔒</span>
                            <input
                                className="field-input"
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="field-toggle"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn-primary auth-submit ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">Create one free</Link>
                    </p>
                </div>

                {/* Demo hint */}
                <div className="auth-demo">
                    <span className="demo-label">Demo credentials</span>
                    <div className="demo-creds">
                        <span>admin / admin123</span>
                        <span>user / user123</span>
                    </div>
                </div>
            </div>
        </div>
    );
}