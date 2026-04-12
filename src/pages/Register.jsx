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
            const res = await fetch(`${API_BASE}/codeinsight/register`, {
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
                .rg-alert-icon { flex-shrink: 0; display: flex; align-items: center; }

                /* Social buttons */
                .rg-social-btns {
                    display: flex; gap: 10px;
                    margin-top: 16px;
                }
                .rg-social-btn {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1.5px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04);
                    color: rgba(255,255,255,0.7);
                    font-family: 'Outfit', sans-serif;
                    font-size: 13.5px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rg-social-btn:hover {
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.07);
                    color: #fff;
                }

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
                            <span className="rg-alert-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            </span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rg-alert rg-alert-success">
                            <span className="rg-alert-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
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
                                            ? <span style={{ color: '#0be881', display: 'flex' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                                            : <span style={{ color: '#ff4d6d', display: 'flex' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
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

                    <div className="rg-divider">or continue with</div>

                    <div className="rg-social-btns">
                        <button type="button" className="rg-social-btn" onClick={() => alert('Google OAuth coming soon')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button type="button" className="rg-social-btn" onClick={() => alert('GitHub OAuth coming soon')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <div className="rg-footer">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
}
