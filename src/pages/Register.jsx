import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [focused, setFocused] = useState('');
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
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_BASE}/codeinsight/Register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message || `Server error (${res.status}). Please try again.`);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1800);
            } else {
                setError(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('Cannot connect to server. Check your connection.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    // Password strength
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
    const strengthColor = ['', '#ff4d6d', '#ff9f43', '#ffd32a', '#0be881', '#00d4ff'][strength];

    const passwordMatch = form.confirmPassword && form.confirmPassword === form.password;
    const passwordMismatch = form.confirmPassword && form.confirmPassword !== form.password;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .rg-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #060b14;
                    font-family: 'Outfit', sans-serif;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                }

                /* Background effects */
                .rg-bg-grid {
                    position: fixed; inset: 0;
                    background-image:
                        linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                    pointer-events: none;
                }
                .rg-orb1 {
                    position: fixed; width: 500px; height: 500px;
                    top: -150px; right: -100px;
                    background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .rg-orb2 {
                    position: fixed; width: 400px; height: 400px;
                    bottom: -100px; left: -80px;
                    background: radial-gradient(circle, rgba(120,80,255,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                /* Card */
                .rg-card {
                    position: relative;
                    width: 100%;
                    max-width: 460px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 40px 36px;
                    backdrop-filter: blur(20px);
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Header */
                .rg-logo {
                    display: flex; align-items: center; gap: 10px;
                    text-decoration: none;
                    font-family: 'Space Mono', monospace;
                    font-size: 18px; font-weight: 700;
                    color: #fff;
                    margin-bottom: 28px;
                    width: fit-content;
                }
                .rg-logo-icon {
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, #00d4ff, #7850ff);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px; color: #fff;
                }
                .rg-logo span { color: #00d4ff; }

                .rg-title {
                    font-size: 26px; font-weight: 700;
                    color: #fff; letter-spacing: -0.5px;
                    margin-bottom: 6px;
                }
                .rg-subtitle {
                    font-size: 14px; color: rgba(255,255,255,0.4);
                    margin-bottom: 28px;
                }

                /* Alerts */
                .rg-alert {
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    font-size: 13.5px; font-weight: 500;
                    margin-bottom: 20px;
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .rg-alert-error {
                    background: rgba(255,77,109,0.1);
                    border: 1px solid rgba(255,77,109,0.3);
                    color: #ff7c96;
                }
                .rg-alert-success {
                    background: rgba(11,232,129,0.1);
                    border: 1px solid rgba(11,232,129,0.3);
                    color: #0be881;
                }
                .rg-alert-icon { font-size: 15px; flex-shrink: 0; }

                /* Fields */
                .rg-form { display: flex; flex-direction: column; gap: 18px; }

                .rg-field label {
                    display: block;
                    font-size: 12px; font-weight: 600;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .rg-input-wrap {
                    position: relative;
                    display: flex; align-items: center;
                }
                .rg-input-icon {
                    position: absolute; left: 14px;
                    color: rgba(255,255,255,0.25);
                    font-size: 15px;
                    pointer-events: none;
                    display: flex; align-items: center;
                    transition: color 0.2s;
                }
                .rg-field.focused .rg-input-icon { color: #00d4ff; }

                .rg-input {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 12px 14px 12px 42px;
                    color: #fff;
                    font-size: 14.5px;
                    font-family: 'Outfit', sans-serif;
                    transition: all 0.2s;
                    outline: none;
                }
                .rg-input::placeholder { color: rgba(255,255,255,0.2); }
                .rg-input:focus {
                    border-color: rgba(0,212,255,0.5);
                    background: rgba(0,212,255,0.05);
                    box-shadow: 0 0 0 3px rgba(0,212,255,0.08);
                }
                .rg-input.has-toggle { padding-right: 44px; }
                .rg-input.match   { border-color: rgba(11,232,129,0.5) !important; }
                .rg-input.mismatch { border-color: rgba(255,77,109,0.5) !important; }

                .rg-toggle {
                    position: absolute; right: 12px;
                    background: none; border: none; cursor: pointer;
                    color: rgba(255,255,255,0.3);
                    font-size: 15px; padding: 4px;
                    display: flex; align-items: center;
                    transition: color 0.2s;
                }
                .rg-toggle:hover { color: rgba(255,255,255,0.7); }

                .rg-field-check {
                    position: absolute; right: 12px;
                    font-size: 14px;
                }

                /* Strength meter */
                .rg-strength {
                    display: flex; align-items: center; gap: 8px;
                    margin-top: 8px;
                }
                .rg-strength-bars {
                    display: flex; gap: 4px; flex: 1;
                }
                .rg-strength-bar {
                    height: 3px; border-radius: 99px; flex: 1;
                    transition: background 0.3s;
                }
                .rg-strength-label {
                    font-size: 11px; font-weight: 600;
                    letter-spacing: 0.5px;
                    min-width: 60px; text-align: right;
                    transition: color 0.3s;
                }

                /* Submit */
                .rg-submit {
                    width: 100%;
                    padding: 13px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #00d4ff, #7850ff);
                    color: #fff;
                    font-family: 'Outfit', sans-serif;
                    font-size: 15px; font-weight: 600;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: opacity 0.2s, transform 0.15s;
                    margin-top: 6px;
                    position: relative;
                    overflow: hidden;
                }
                .rg-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
                .rg-submit:active:not(:disabled) { transform: translateY(0); }
                .rg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

                .rg-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Footer */
                .rg-footer {
                    text-align: center;
                    margin-top: 24px;
                    font-size: 13.5px;
                    color: rgba(255,255,255,0.35);
                }
                .rg-footer a {
                    color: #00d4ff;
                    text-decoration: none;
                    font-weight: 600;
                }
                .rg-footer a:hover { text-decoration: underline; }

                /* Divider */
                .rg-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 20px 0 0;
                    color: rgba(255,255,255,0.15);
                    font-size: 12px;
                }
                .rg-divider::before, .rg-divider::after {
                    content: ''; flex: 1;
                    height: 1px; background: rgba(255,255,255,0.07);
                }
            `}</style>

            <div className="rg-page">
                <div className="rg-bg-grid" />
                <div className="rg-orb1" />
                <div className="rg-orb2" />

                <div className="rg-card">
                    {/* Logo */}
                    <Link to="/" className="rg-logo">
                        <div className="rg-logo-icon">{'</>'}</div>
                        Code<span>Insight</span>
                    </Link>

                    {/* Heading */}
                    <h1 className="rg-title">Create your account</h1>
                    <p className="rg-subtitle">Join thousands of coders on CodeInsight</p>

                    {/* Alerts */}
                    {error && (
                        <div className="rg-alert rg-alert-error">
                            <span className="rg-alert-icon">⚠</span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rg-alert rg-alert-success">
                            <span className="rg-alert-icon">✔</span>
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form className="rg-form" onSubmit={handleSubmit} noValidate>

                        {/* Username */}
                        <div className={`rg-field ${focused === 'username' ? 'focused' : ''}`}>
                            <label>Username</label>
                            <div className="rg-input-wrap">
                                <span className="rg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    className="rg-input"
                                    type="text"
                                    name="username"
                                    placeholder="Choose a username"
                                    value={form.username}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('username')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="username"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className={`rg-field ${focused === 'email' ? 'focused' : ''}`}>
                            <label>Email</label>
                            <div className="rg-input-wrap">
                                <span className="rg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    className="rg-input"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="email"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={`rg-field ${focused === 'password' ? 'focused' : ''}`}>
                            <label>Password</label>
                            <div className="rg-input-wrap">
                                <span className="rg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    className="rg-input has-toggle"
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="new-password"
                                />
                                <button type="button" className="rg-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                                    {showPass ? (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {form.password && (
                                <div className="rg-strength">
                                    <div className="rg-strength-bars">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className="rg-strength-bar"
                                                style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="rg-strength-label" style={{ color: strengthColor }}>
                                        {strengthLabel}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className={`rg-field ${focused === 'confirmPassword' ? 'focused' : ''}`}>
                            <label>Confirm Password</label>
                            <div className="rg-input-wrap">
                                <span className="rg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    className={`rg-input has-toggle ${passwordMatch ? 'match' : ''} ${passwordMismatch ? 'mismatch' : ''}`}
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Repeat your password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('confirmPassword')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="new-password"
                                />
                                {form.confirmPassword ? (
                                    <span className="rg-field-check">
                                        {passwordMatch
                                            ? <span style={{ color: '#0be881' }}>✔</span>
                                            : <span style={{ color: '#ff4d6d' }}>✖</span>
                                        }
                                    </span>
                                ) : (
                                    <button type="button" className="rg-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                        {showConfirm ? (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="rg-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="rg-spinner" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="rg-divider">or</div>

                    <div className="rg-footer">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
}
