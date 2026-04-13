import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo.jsx';
import './home.css';

/* ─── AI Guide Chatbot ─────────────────────────────────── */
const GUIDE_QA = [
    {
        q: "What is CodeInsight?",
        a: "CodeInsight is a free online coding practice platform — like LeetCode but with AI superpowers! You write Java code, run it against test cases, and get instant AI feedback on your code quality, errors, and performance.",
    },
    {
        q: "Do I need to know coding to start?",
        a: "You don't need to be an expert! Start with Easy problems. The AI Insight button will explain your code in plain English — no jargon. Think of it as a friendly tutor that's available 24/7.",
    },
    {
        q: "How do I solve a problem?",
        a: "1️⃣ Go to Dashboard → click any problem\n2️⃣ Read the problem description on the left\n3️⃣ Write your Java code in the editor (middle)\n4️⃣ Click Run to test with your own input\n5️⃣ Click Submit to check against all test cases\n6️⃣ Click AI Insight for feedback and tips!",
    },
    {
        q: "What does 'Accepted' mean?",
        a: "'Accepted' means your code passed all the test cases — great job! 🎉 You earn 100 points added to the leaderboard. If you get 'Wrong Answer' or an error, click AI Insight — it will explain exactly what went wrong and how to fix it.",
    },
    {
        q: "What is AI Insight?",
        a: "AI Insight is the magic button ✨ It uses Google's Gemini AI to:\n• Explain what your code does in simple English\n• Tell you WHY an error happened and how to fix it\n• Show Time & Space complexity (how fast/efficient your code is)\n• Give 3 tips to improve your code\n• Show you an optimized version of your code",
    },
    {
        q: "What is Time Complexity?",
        a: "Time complexity tells you how fast your code runs as input gets bigger. O(n) means if you double the input size, the time doubles. O(n²) means it gets 4x slower. The AI Insight panel explains this in plain English with real-life examples — like comparing a search to looking through a notebook vs a dictionary.",
    },
    {
        q: "How does the Leaderboard work?",
        a: "Every time you solve a problem for the first time (Accepted verdict), you earn 100 points! The leaderboard on the Dashboard shows who has solved the most problems and earned the most points. Compete with friends!",
    },
    {
        q: "I got a Runtime Error. What do I do?",
        a: "Don't panic! Click the AI Insight button — it will tell you exactly why the error happened (like dividing by zero, or accessing an array out of bounds) in simple words. It also gives you the fixed code!",
    },
    {
        q: "How do I register?",
        a: "Click 'Start Coding Free' at the top of this page → fill in your username, email and password → done! It's completely free, no credit card needed.",
    },
    {
        q: "What language is supported?",
        a: "Currently Java (Java 17) is supported for code execution. The editor has full syntax highlighting, auto-complete, and bracket matching — just like a professional IDE!",
    },
];

function AIGuide() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: "Hi! 👋 I'm your CodeInsight Guide. I'm here to help you understand how this platform works — no technical knowledge needed!\n\nAsk me anything or pick a question below:" }
    ]);
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (open && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    function sendMessage(text) {
        if (!text.trim()) return;
        const userMsg = { from: 'user', text: text.trim() };
        setShowSuggestions(false);

        // Find best match
        const lower = text.toLowerCase();
        const match = GUIDE_QA.find(qa =>
            qa.q.toLowerCase().includes(lower) ||
            lower.includes(qa.q.toLowerCase().split(' ').slice(1, 4).join(' ').toLowerCase()) ||
            qa.a.toLowerCase().includes(lower.split(' ').slice(0, 3).join(' '))
        );

        const botText = match
            ? match.a
            : "I'm not sure about that one! Here's what I can help with — try picking one of the questions below, or ask something like 'How do I start?' or 'What is AI Insight?'";

        setMessages(prev => [...prev, userMsg, { from: 'bot', text: botText }]);
        setInput('');

        // Show suggestions again after a short delay
        setTimeout(() => setShowSuggestions(true), 300);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }

    return (
        <>
            {/* Floating button */}
            <button className={`guide-fab${open ? ' guide-fab--open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Open AI Guide">
                {open
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2l-5 5"/><path d="M17 2h5v5"/></svg>
                }
                {!open && <span className="guide-fab-label">Ask AI Guide</span>}
            </button>

            {/* Chat window */}
            {open && (
                <div className="guide-window animate-slideUp">
                    <div className="guide-header">
                        <div className="guide-header-avatar">✦</div>
                        <div>
                            <div className="guide-header-title">CodeInsight Guide</div>
                            <div className="guide-header-sub">AI assistant for new users</div>
                        </div>
                        <button className="guide-close" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    <div className="guide-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`guide-msg guide-msg--${m.from}`}>
                                {m.from === 'bot' && <div className="guide-bot-icon">✦</div>}
                                <div className={`guide-bubble guide-bubble--${m.from}`}>
                                    {m.text.split('\n').map((line, j) => (
                                        <span key={j}>{line}{j < m.text.split('\n').length - 1 && <br />}</span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {showSuggestions && (
                            <div className="guide-suggestions">
                                <div className="guide-suggestions-label">Quick questions:</div>
                                {GUIDE_QA.slice(0, 5).map((qa, i) => (
                                    <button key={i} className="guide-suggestion-btn" onClick={() => sendMessage(qa.q)}>
                                        {qa.q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="guide-input-row">
                        <input
                            className="guide-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about CodeInsight..."
                        />
                        <button className="guide-send-btn" onClick={() => sendMessage(input)} disabled={!input.trim()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const featureIcons = {
    Editor: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
    ),
    AI: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12v.01"/><path d="M12 8v.01"/><path d="M16 12v.01"/><path d="M8 12v.01"/><path d="M12 16v.01"/><path d="M22 2l-5 5"/><path d="M17 2h5v5"/>
        </svg>
    ),
    Compete: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
        </svg>
    ),
    Analytics: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
        </svg>
    ),
    Problems: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
    ),
    Admin: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
};

const features = [
    {
        tag: 'Editor',
        title: 'Java Code Editor',
        desc: 'A full-featured Monaco-powered editor with syntax highlighting, auto-complete, and real-time error detection — built for serious coders.',
        accent: '#00D4FF',
    },
    {
        tag: 'AI',
        title: 'AI Insight Engine',
        desc: 'Get instant AI-powered feedback on your code — time complexity analysis, optimization hints, bug detection, and clean code suggestions.',
        accent: '#7B61FF',
    },
    {
        tag: 'Compete',
        title: 'Live Leaderboard',
        desc: 'Compete with peers in real time. Rankings update instantly after every submission — see exactly where you stand.',
        accent: '#00E5A0',
    },
    {
        tag: 'Analytics',
        title: 'Personal Analytics',
        desc: 'Deep-dive into your coding journey — problem categories, submission history, acceptance rate, and performance trends over time.',
        accent: '#FF6B35',
    },
    {
        tag: 'Problems',
        title: 'Curated Problem Set',
        desc: 'Hundreds of problems across Easy, Medium, and Hard — tagged by topic, company, and concept so you practice what matters most.',
        accent: '#FF3D9A',
    },
    {
        tag: 'Admin',
        title: 'Admin Panel',
        desc: 'Educators and admins can upload problems, define test cases, monitor submissions, and track student progress — all in one place.',
        accent: '#00D4FF',
    },
];

const steps = [
    { num: '01', title: 'Pick a Problem', desc: 'Browse the curated problem set filtered by difficulty, topic, or company tag.' },
    { num: '02', title: 'Write Your Code', desc: 'Use the Java editor with syntax highlighting, hints, and a clean workspace.' },
    { num: '03', title: 'Run & Submit', desc: 'Execute against hidden test cases. Get a verdict — Accepted, Wrong Answer, or TLE.' },
    { num: '04', title: 'Get AI Insight', desc: 'Receive instant AI feedback on complexity, style, and optimizations specific to your code.' },
];

const FALLBACK_TESTIMONIALS = [
    {
        name: 'Priya Sharma',
        role: 'CS Student, IIT Delhi',
        avatar: 'P',
        text: 'CodeInsight completely changed how I prep for interviews. The AI feedback on my solutions is like having a mentor available 24/7. I went from 40% acceptance rate to 85% in two months.',
        color: '#00D4FF',
    },
    {
        name: 'Rohan Mehta',
        role: 'SDE Intern, Amazon',
        avatar: 'R',
        text: 'The real-time leaderboard is addictive in the best way. I started competing with my friends and before I knew it, I was consistently solving Hard problems. Got my Amazon offer last month!',
        color: '#7B61FF',
    },
    {
        name: 'Ananya Patel',
        role: 'Final Year, BITS Pilani',
        avatar: 'A',
        text: 'No other platform gives you O(n) vs O(n²) breakdown automatically. The AI insight feature alone is worth it. My code quality has improved massively — cleaner, faster, interview-ready.',
        color: '#00E5A0',
    },
];

const REVIEW_COLORS = ['#00D4FF', '#7B61FF', '#00E5A0'];

const compareData = [
    { feature: 'Java-first editor', ci: true, lc: false, hr: true },
    { feature: 'AI code feedback', ci: true, lc: false, hr: false },
    { feature: 'Complexity analysis', ci: true, lc: false, hr: false },
    { feature: 'Live leaderboard', ci: true, lc: true, hr: true },
    { feature: 'Detailed analytics', ci: true, lc: true, hr: false },
    { feature: 'Admin/educator panel', ci: true, lc: false, hr: false },
    { feature: 'Free to use', ci: true, lc: true, hr: true },
    { feature: 'No ads, no paywall on AI', ci: true, lc: false, hr: false },
];

const TYPING_WORDS = ['Think Deeper.', 'Code Faster.', 'Rank Higher.'];

function ParticleCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animId;
        const particles = [];
        const COUNT = 80;

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
                ctx.fill();

                p.x += p.dx;
                p.y += p.dy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 212, 255, ${0.05 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="particle-canvas" />;
}

function TypingEffect() {
    const [wordIndex, setWordIndex] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const word = TYPING_WORDS[wordIndex];
        if (paused) {
            const t = setTimeout(() => { setDeleting(true); setPaused(false); }, 1800);
            return () => clearTimeout(t);
        }
        if (!deleting) {
            if (displayed.length < word.length) {
                const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 70);
                return () => clearTimeout(t);
            } else {
                setPaused(true);
            }
        } else {
            if (displayed.length > 0) {
                const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
                return () => clearTimeout(t);
            } else {
                setDeleting(false);
                setWordIndex(i => (i + 1) % TYPING_WORDS.length);
            }
        }
    }, [displayed, deleting, wordIndex, paused]);

    return (
        <span className="typing-text gradient-text">
            {displayed}
            <span className="typing-cursor" />
        </span>
    );
}

function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('.reveal');
        if (!els.length) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        els.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
}

export default function Home() {
    useReveal();
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetch('/codeinsight/reviews')
            .then(r => r.json())
            .then(d => { if (d.success && d.reviews.length > 0) setReviews(d.reviews); })
            .catch(() => {});
    }, []);

    return (
        <div className="landing">
            <Navbar />

            
            <section className="hero">
                <ParticleCanvas />
                <div className="grid-bg" />
                <div className="orb orb-blue" />
                <div className="orb orb-purple" />
                <div className="container">
                    <div className="hero-inner">
                        <div className="hero-content">
                            <div className="animate-fadeUp">
                                <span className="tag">
                                    <span className="tag-dot" />
                                    AI-Powered Coding Platform
                                </span>
                            </div>
                            <h1 className="hero-title animate-fadeUp delay-1">
                                Code smarter.<br />
                                <TypingEffect />
                            </h1>
                            <p className="hero-desc animate-fadeUp delay-2">
                                CodeInsight combines a professional Java editor, intelligent AI feedback, and real-time leaderboards — the next evolution beyond LeetCode.
                            </p>
                            <div className="hero-actions animate-fadeUp delay-3">
                                <Link to="/register">
                                    <button className="btn-primary btn-lg">Start Coding Free →</button>
                                </Link>
                                <Link to="/login">
                                    <button className="btn-ghost btn-lg">Sign In</button>
                                </Link>
                            </div>
                            <div className="hero-badges animate-fadeUp delay-4">
                                <span className="badge">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Free to start
                                </span>
                                <span className="badge">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Java editor built-in
                                </span>
                                <span className="badge">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Real AI feedback
                                </span>
                            </div>
                        </div>

                        <div className="hero-visual animate-float">
                            <div className="code-card">
                                <div className="code-card-header">
                                    <div className="dots">
                                        <span style={{ background: '#FF5F56' }} />
                                        <span style={{ background: '#FFBD2E' }} />
                                        <span style={{ background: '#27C93F' }} />
                                    </div>
                                    <span className="code-card-title">TwoSum.java</span>
                                    <span className="verdict passed">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Accepted
                                    </span>
                                </div>
                                <div className="code-block">
                                    {`public int[] twoSum(
  int[] nums, int target) {
  Map<Integer, Integer> map
    = new HashMap<>();
  for (int i = 0; i < nums.length; i++) {
    int comp = target - nums[i];
    if (map.containsKey(comp))
      return new int[]{map.get(comp), i};
    map.put(nums[i], i);
  }
  return new int[]{};
}`}
                                </div>
                                <div className="ai-badge">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2l-5 5"/><path d="M17 2h5v5"/></svg>
                                    AI: O(n) time · O(n) space · Optimal solution
                                </div>
                            </div>

                            <div className="floating-card card-complexity animate-float delay-2">
                                <div className="fc-label">Complexity</div>
                                <div className="fc-value" style={{ color: '#00E5A0' }}>O(n)</div>
                            </div>

                            <div className="floating-card card-rank animate-float delay-4">
                                <div className="fc-label">Your Rank</div>
                                <div className="fc-value" style={{ color: '#00D4FF' }}>#42</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {[
                            { value: '500+', label: 'Problems', sub: 'Easy to Hard' },
                            { value: '12K+', label: 'Coders', sub: 'Active this month' },
                            { value: '98%', label: 'Uptime', sub: 'Reliable execution' },
                            { value: '4.9', label: 'Rating', sub: 'From our users' },
                        ].map((s) => (
                            <div className="stat-card reveal" key={s.label}>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                                <div className="stat-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            
            <section className="features-section">
                <div className="container">
                    <div className="section-header reveal">
                        <span className="tag">Platform Features</span>
                        <h2 className="section-title">Everything you need to<br />level up your coding</h2>
                        <p className="section-desc">
                            Built for students, developers, and educators — CodeInsight gives you the tools to practice, improve, and compete.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div
                                className={`feature-card reveal`}
                                key={f.title}
                                style={{ '--accent': f.accent, animationDelay: `${i * 0.07}s` }}
                            >
                                <div className="feature-icon">
                                    {featureIcons[f.tag]}
                                </div>
                                <span className="feature-tag">{f.tag}</span>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                                <div className="feature-line" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            
            <section className="how-section">
                <div className="container">
                    <div className="section-header reveal">
                        <span className="tag">How It Works</span>
                        <h2 className="section-title">From problem to insight<br />in four steps</h2>
                    </div>
                    <div className="steps-grid">
                        {steps.map((s, i) => (
                            <div className="step-card reveal" key={s.num}>
                                <div className="step-num">{s.num}</div>
                                <h3 className="step-title">{s.title}</h3>
                                <p className="step-desc">{s.desc}</p>
                                {i < steps.length - 1 && <div className="step-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            
            <section className="compare-section">
                <div className="container">
                    <div className="section-header reveal">
                        <span className="tag">Comparison</span>
                        <h2 className="section-title">Why CodeInsight?</h2>
                        <p className="section-desc">
                            We built the features that matter most — and kept it free.
                        </p>
                    </div>
                    <div className="compare-table-wrap reveal">
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th className="ct-feature-col">Feature</th>
                                    <th className="ct-ci-col">
                                        <div className="ct-platform-head ct-platform-ci">
                                            <span className="ct-platform-logo">{'</>'}</span>
                                            CodeInsight
                                        </div>
                                    </th>
                                    <th>
                                        <div className="ct-platform-head">LeetCode</div>
                                    </th>
                                    <th>
                                        <div className="ct-platform-head">HackerRank</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {compareData.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'ct-row-alt' : ''}>
                                        <td className="ct-feature">{row.feature}</td>
                                        <td className="ct-ci-col">
                                            {row.ci
                                                ? <span className="ct-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                                                : <span className="ct-cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
                                        </td>
                                        <td>
                                            {row.lc
                                                ? <span className="ct-check ct-check--muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                                                : <span className="ct-cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
                                        </td>
                                        <td>
                                            {row.hr
                                                ? <span className="ct-check ct-check--muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                                                : <span className="ct-cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header reveal">
                        <span className="tag">Social Proof</span>
                        <h2 className="section-title">Loved by coders</h2>
                        <p className="section-desc">
                            Join thousands of students and developers who already use CodeInsight to level up.
                        </p>
                    </div>
                    <div className="testimonials-grid">
                        {(reviews.length > 0 ? reviews : FALLBACK_TESTIMONIALS).map((t, i) => {
                            const color = REVIEW_COLORS[i % REVIEW_COLORS.length];
                            const name = reviews.length > 0 ? t.username : t.name;
                            const avatar = name ? name[0].toUpperCase() : '?';
                            const role = t.role || '';
                            const text = reviews.length > 0 ? t.text : t.text;
                            const rating = reviews.length > 0 ? (t.rating || 5) : 5;
                            return (
                                <div
                                    className="testimonial-card reveal"
                                    key={reviews.length > 0 ? t.id : t.name}
                                    style={{ '--t-accent': color, transitionDelay: `${i * 0.1}s` }}
                                >
                                    <div className="tc-quote">"</div>
                                    <p className="tc-text">{text}</p>
                                    <div className="tc-author">
                                        <div className="tc-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                                            {avatar}
                                        </div>
                                        <div className="tc-author-info">
                                            <div className="tc-name">{name}</div>
                                            <div className="tc-role">{role}</div>
                                        </div>
                                        <div className="tc-stars">
                                            {[...Array(rating)].map((_, j) => (
                                                <svg key={j} width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            
            <section className="cta-section">
                <div className="orb orb-cta-blue" />
                <div className="orb orb-cta-purple" />
                <div className="container">
                    <div className="cta-inner reveal">
                        <span className="tag">Get Started</span>
                        <h2 className="cta-title">
                            Ready to code<br />
                            <span className="gradient-text">smarter?</span>
                        </h2>
                        <p className="cta-desc">
                            Join thousands of developers who use CodeInsight to sharpen their skills with real AI feedback.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register">
                                <button className="btn-primary btn-lg">Create Free Account →</button>
                            </Link>
                            <Link to="/login">
                                <button className="btn-ghost btn-lg">Sign In</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>


            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-logo">
                            <Logo size="sm" />
                        </div>
                        <p className="footer-copy">© 2025 CodeInsight. Built for coders, by coders.</p>
                        <div className="footer-links">
                            <span>Privacy</span>
                            <span>Terms</span>
                            <span>Contact</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* AI Guide Chatbot — floats on all pages */}
            <AIGuide />
        </div>
    );
}
