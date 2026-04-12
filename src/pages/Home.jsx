import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './home.css';

const features = [
    {
        icon: 'âš¡',
        tag: 'Editor',
        title: 'Java Code Editor',
        desc: 'A full-featured Monaco-powered editor with syntax highlighting, auto-complete, and real-time error detection â€” built for serious coders.',
        accent: '#00D4FF',
    },
    {
        icon: 'ðŸ¤–',
        tag: 'AI',
        title: 'AI Insight Engine',
        desc: 'Get instant AI-powered feedback on your code â€” time complexity analysis, optimization hints, bug detection, and clean code suggestions.',
        accent: '#7B61FF',
    },
    {
        icon: 'ðŸ†',
        tag: 'Compete',
        title: 'Live Leaderboard',
        desc: 'Compete with peers in real time. Rankings update instantly after every submission â€” see exactly where you stand.',
        accent: '#00E5A0',
    },
    {
        icon: 'ðŸ“Š',
        tag: 'Analytics',
        title: 'Personal Analytics',
        desc: 'Deep-dive into your coding journey â€” problem categories, submission history, acceptance rate, and performance trends over time.',
        accent: '#FF6B35',
    },
    {
        icon: 'ðŸ§©',
        tag: 'Problems',
        title: 'Curated Problem Set',
        desc: 'Hundreds of problems across Easy, Medium, and Hard â€” tagged by topic, company, and concept so you practice what matters most.',
        accent: '#FF3D9A',
    },
    {
        icon: 'ðŸ›¡ï¸',
        tag: 'Admin',
        title: 'Admin Panel',
        desc: 'Educators and admins can upload problems, define test cases, monitor submissions, and track student progress â€” all in one place.',
        accent: '#00D4FF',
    },
];

const steps = [
    { num: '01', title: 'Pick a Problem', desc: 'Browse the curated problem set filtered by difficulty, topic, or company tag.' },
    { num: '02', title: 'Write Your Code', desc: 'Use the Java editor with syntax highlighting, hints, and a clean workspace.' },
    { num: '03', title: 'Run & Submit', desc: 'Execute against hidden test cases. Get a verdict â€” Accepted, Wrong Answer, or TLE.' },
    { num: '04', title: 'Get AI Insight', desc: 'Receive instant AI feedback on complexity, style, and optimizations specific to your code.' },
];

export default function Home() {
    return (
        <div className="landing">
            <Navbar />

            {/* HERO */}
            <section className="hero">
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
                                <span className="gradient-text">Think deeper.</span>
                            </h1>
                            <p className="hero-desc animate-fadeUp delay-2">
                                CodeInsight combines a professional Java editor, intelligent AI feedback, and real-time leaderboards â€” the next evolution beyond LeetCode.
                            </p>
                            <div className="hero-actions animate-fadeUp delay-3">
                                <Link to="/register">
                                    <button className="btn-primary btn-lg">Start Coding Free â†’</button>
                                </Link>
                                <Link to="/login">
                                    <button className="btn-ghost btn-lg">Sign In</button>
                                </Link>
                            </div>
                            <div className="hero-badges animate-fadeUp delay-4">
                                <span className="badge">âœ“ Free to start</span>
                                <span className="badge">âœ“ Java editor built-in</span>
                                <span className="badge">âœ“ Real AI feedback</span>
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
                                    <span className="verdict passed">âœ“ Accepted</span>
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
                                    ðŸ¤– AI: O(n) time Â· O(n) space Â· Optimal solution
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

            {/* STATS */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {[
                            { value: '500+', label: 'Problems', sub: 'Easy to Hard' },
                            { value: '12K+', label: 'Coders', sub: 'Active this month' },
                            { value: '98%', label: 'Uptime', sub: 'Reliable execution' },
                            { value: '4.9â˜…', label: 'Rating', sub: 'From our users' },
                        ].map((s) => (
                            <div className="stat-card" key={s.label}>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                                <div className="stat-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="tag">Platform Features</span>
                        <h2 className="section-title">Everything you need to<br />level up your coding</h2>
                        <p className="section-desc">
                            Built for students, developers, and educators â€” CodeInsight gives you the tools to practice, improve, and compete.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((f) => (
                            <div
                                className="feature-card"
                                key={f.title}
                                style={{ '--accent': f.accent }}
                            >
                                <div className="feature-icon">
                                    <span style={{ fontSize: 22 }}>{f.icon}</span>
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

            {/* HOW IT WORKS */}
            <section className="how-section">
                <div className="container">
                    <div className="section-header">
                        <span className="tag">How It Works</span>
                        <h2 className="section-title">From problem to insight<br />in four steps</h2>
                    </div>
                    <div className="steps-grid">
                        {steps.map((s, i) => (
                            <div className="step-card" key={s.num}>
                                <div className="step-num">{s.num}</div>
                                <h3 className="step-title">{s.title}</h3>
                                <p className="step-desc">{s.desc}</p>
                                {i < steps.length - 1 && <div className="step-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="orb orb-cta-blue" />
                <div className="orb orb-cta-purple" />
                <div className="container">
                    <div className="cta-inner">
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
                                <button className="btn-primary btn-lg">Create Free Account â†’</button>
                            </Link>
                            <Link to="/login">
                                <button className="btn-ghost btn-lg">Sign In</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-logo">
                            <span style={{ color: '#00D4FF', fontWeight: 800 }}>{'</>'}</span>
                            CodeInsight
                        </div>
                        <p className="footer-copy">Â© 2025 CodeInsight. Built for coders, by coders.</p>
                        <div className="footer-links">
                            <span>Privacy</span>
                            <span>Terms</span>
                            <span>Contact</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}