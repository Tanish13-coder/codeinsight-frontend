import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [focused, setFocused] = useState('');
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
        setError('');

        try {
            const res = await fetch(`${API_BASE}/codeinsight/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    password: form.password,
                }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                setError(`Server returned status ${res.status}. Check your backend.`);
                return;
            }

            if (!res.ok) {
                setError(data?.message || `Error ${res.status}: Server not responding correctly.`);
                return;
            }

            if (data.success) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);
                navigate(data.role === 'admin' ? '/admin' : '/dashboard');
            } else {
                setError(data.message || 'Invalid username or password.');
            }

        } catch (err) {
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Cannot reach server. Make sure Tomcat is running on port 8080.');
            } else {
                setError('Unexpected error. Please try again.');
            }
            console.error('[Login error]', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .lg-page {
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

                .lg-bg-grid {
                    position: fixed; inset: 0;
                    background-image:
                        linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                    pointer-events: none;
                }
                .lg-orb1 {
                    position: fixed; width: 500px; height: 500px;
                    top: -150px; left: -100px;
                    background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .lg-orb2 {
                    position: fixed; width: 400px; height: 400px;
                    bottom: -100px; right: -80px;
                    background: radial-gradient(circle, rgba(120,80,255,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                .lg-card {
                    position: relative;
                    width: 100%;
                    max-width: 420px;
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

                .lg-logo {
                    display: flex; align-items: center; gap: 10px;
                    text-decoration: none;
                    font-family: 'Space Mono', monospace;
                    font-size: 18px; font-weight: 700;
                    color: #fff;
                    margin-bottom: 28px;
                    width: fit-content;
                }
                .lg-logo-icon {
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, #00d4ff, #7850ff);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px; color: #fff;
                }
                .lg-logo span { color: #00d4ff; }

                .lg-title {
                    font-size: 28px; font-weight: 700;
                    color: #fff; letter-spacing: -0.5px;
                    margin-bottom: 6px;
                }
                .lg-subtitle {
                    font-size: 14px; color: rgba(255,255,255,0.4);
                    margin-bottom: 28px;
                }

                /* Alert */
                .lg-alert {
                    display: flex; align-items: flex-start; gap: 10px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    font-size: 13.5px; font-weight: 500;
                    margin-bottom: 20px;
                    background: rgba(255,77,109,0.1);
                    border: 1px solid rgba(255,77,109,0.3);
                    color: #ff7c96;
                    animation: fadeIn 0.3s ease;
                    line-height: 1.5;
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .lg-alert-icon { flex-shrink: 0; display: flex; align-items: center; margin-top: 1px; }

                /* Fields */
                .lg-form { display: flex; flex-direction: column; gap: 18px; }

                .lg-field label {
                    display: block;
                    font-size: 12px; font-weight: 600;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                .lg-input-wrap {
                    position: relative;
                    display: flex; align-items: center;
                }
                .lg-input-icon {
                    position: absolute; left: 14px;
                    color: rgba(255,255,255,0.25);
                    font-size: 15px;
                    pointer-events: none;
                    display: flex; align-items: center;
                    transition: color 0.2s;
                }
                .lg-field.focused .lg-input-icon { color: #00d4ff; }

                .lg-input {
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
                .lg-input::placeholder { color: rgba(255,255,255,0.2); }
                .lg-input:focus {
                    border-color: rgba(0,212,255,0.5);
                    background: rgba(0,212,255,0.05);
                    box-shadow: 0 0 0 3px rgba(0,212,255,0.08);
                }
                .lg-input.has-toggle { padding-right: 44px; }

                .lg-toggle {
                    position: absolute; right: 12px;
                    background: none; border: none; cursor: pointer;
                    color: rgba(255,255,255,0.3);
                    font-size: 15px; padding: 4px;
                    display: flex; align-items: center;
                    transition: color 0.2s;
                }
                .lg-toggle:hover { color: rgba(255,255,255,0.7); }

                /* Submit */
                .lg-submit {
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
                }
                .lg-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
                .lg-submit:active:not(:disabled) { transform: translateY(0); }
                .lg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

                .lg-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Divider */
                .lg-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 22px 0 0;
                    color: rgba(255,255,255,0.15);
                    font-size: 12px;
                }
                .lg-divider::before, .lg-divider::after {
                    content: ''; flex: 1;
                    height: 1px; background: rgba(255,255,255,0.07);
                }

                /* Footer */
                .lg-footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 13.5px;
                    color: rgba(255,255,255,0.35);
                }
                .lg-footer a {
                    color: #00d4ff;
                    text-decoration: none;
                    font-weight: 600;
                }
                .lg-footer a:hover { text-decoration: underline; }

                /* Social buttons */
                .lg-social-btns {
                    display: flex; gap: 10px;
                    margin-top: 16px;
                }
                .lg-social-btn {
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
                .lg-social-btn:hover {
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.07);
                    color: #fff;
                }
            `}</style>

            <div className="lg-page">
                <div className="lg-bg-grid" />
                <div className="lg-orb1" />
                <div className="lg-orb2" />

                <div className="lg-card">

                    {/* Logo */}
                    <Link to="/" className="lg-logo">
                        <div className="lg-logo-icon">{'</>'}</div>
                        Code<span>Insight</span>
                    </Link>

                    {/* Heading */}
                    <h1 className="lg-title">Welcome back</h1>
                    <p className="lg-subtitle">Sign in to continue your coding journey</p>

                    {/* Error */}
                    {error && (
                        <div className="lg-alert">
                            <span className="lg-alert-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            </span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="lg-form" onSubmit={handleSubmit} noValidate>

                        {/* Username */}
                        <div className={`lg-field ${focused === 'username' ? 'focused' : ''}`}>
                            <label>Username</label>
                            <div className="lg-input-wrap">
                                <span className="lg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    className="lg-input"
                                    type="text"
                                    name="username"
                                    placeholder="Enter your username"
                                    value={form.username}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('username')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="username"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={`lg-field ${focused === 'password' ? 'focused' : ''}`}>
                            <label>Password</label>
                            <div className="lg-input-wrap">
                                <span className="lg-input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    className="lg-input has-toggle"
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="lg-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
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
                        </div>

                        {/* Submit */}
                        <button type="submit" className="lg-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="lg-spinner" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>

                    </form>

                    <div className="lg-divider">or continue with</div>

                    <div className="lg-social-btns">
                        <button type="button" className="lg-social-btn" onClick={() => alert('Google OAuth coming soon')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button type="button" className="lg-social-btn" onClick={() => alert('GitHub OAuth coming soon')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <div className="lg-footer">
                        <p>Don't have an account? <Link to="/register">Create one free</Link></p>
                    </div>

                </div>
            </div>
        </>
    );
}
