import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

export default function Register() {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    }

    function validate() {
        if (!form.username || !form.email || !form.password || !form.confirmPassword)
            return 'Please fill in all fields.';
        if (form.username.length < 3)
            return 'Username must be at least 3 characters.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            return 'Please enter a valid email address.';
        if (form.password.length < 6)
            return 'Password must be at least 6 characters.';
        if (form.password !== form.confirmPassword)
            return 'Passwords do not match.';
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        try {
            const res = await fetch('/codeinsight/Register', {
                                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1800);
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const strength = (() => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 6) s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
    const strengthColor = ['', '#FF3D9A', '#FF6B35', '#FFBD2E', '#00E5A0', '#00D4FF'][strength];

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="orb orb-blue" style={{ width: 400, height: 400, top: -100, right: -100 }} />
                <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: -80, left: -80 }} />
                <div className="grid-bg" />
            </div>

            <div className="auth-card animate-fadeUp" style={{ maxWidth: 480 }}>
                {/* Header */}
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">{'</>'}</span>
                        <span>Code<span style={{ color: 'var(--ci-accent)' }}>Insight</span></span>
                    </Link>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Join thousands of coders on CodeInsight</p>
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="auth-error">
                        <span>⚠</span> {error}
                    </div>
                )}
                {success && (
                    <div className="auth-success">
                        <span>✓</span> {success}
                    </div>
                )}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>

                    {/* Username */}
                    <div className="field-group">
                        <label className="field-label">Username</label>
                        <div className="field-wrap">
                            <span className="field-icon">👤</span>
                            <input
                                className="field-input"
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <div className="field-wrap">
                            <span className="field-icon">✉️</span>
                            <input
                                className="field-input"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <div className="field-wrap">
                            <span className="field-icon">🔒</span>
                            <input
                                className="field-input"
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                placeholder="Create a password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="field-toggle"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>

                        {/* Strength meter */}
                        {form.password && (
                            <div className="strength-wrap">
                                <div className="strength-bars">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div
                                            key={i}
                                            className="strength-bar"
                                            style={{ background: i <= strength ? strengthColor : 'var(--ci-border2)' }}
                                        />
                                    ))}
                                </div>
                                <span className="strength-label" style={{ color: strengthColor }}>
                                    {strengthLabel}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="field-group">
                        <label className="field-label">Confirm Password</label>
                        <div className="field-wrap">
                            <span className="field-icon">🔒</span>
                            <input
                                className="field-input"
                                type={showPass ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Repeat your password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                style={{
                                    borderColor: form.confirmPassword
                                        ? form.confirmPassword === form.password
                                            ? 'var(--ci-green)'
                                            : '#FF3D9A'
                                        : undefined
                                }}
                            />
                            {form.confirmPassword && (
                                <span className="field-check">
                                    {form.confirmPassword === form.password ? '✓' : '✗'}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn-primary auth-submit ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}