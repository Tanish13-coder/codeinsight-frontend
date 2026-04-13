/**
 * Logo.jsx — Shared CodeInsight logo component
 * Use anywhere: <Logo size="md" /> or <Logo size="lg" showText />
 */

export default function Logo({ size = 'md', className = '' }) {
    const sizes = {
        sm:  { box: 28, icon: 14, text: 14, gap: 7 },
        md:  { box: 34, icon: 17, text: 16, gap: 9 },
        lg:  { box: 48, icon: 24, text: 22, gap: 12 },
        xl:  { box: 64, icon: 30, text: 28, gap: 16 },
    };
    const s = sizes[size] || sizes.md;

    return (
        <span className={`ci-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, textDecoration: 'none' }}>
            {/* Icon box */}
            <svg
                width={s.box}
                height={s.box}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
            >
                {/* Background rounded square */}
                <rect width="40" height="40" rx="10" fill="url(#logo-bg)" />

                {/* Code brackets */}
                <path d="M14 13L8 20L14 27" stroke="url(#logo-stroke1)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M26 13L32 20L26 27" stroke="url(#logo-stroke1)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>

                {/* Slash */}
                <line x1="22" y1="11" x2="18" y2="29" stroke="url(#logo-stroke2)" strokeWidth="2.5" strokeLinecap="round"/>

                {/* Gradient defs */}
                <defs>
                    <linearGradient id="logo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#0d1b2e"/>
                        <stop offset="100%" stopColor="#0a1020"/>
                    </linearGradient>
                    <linearGradient id="logo-stroke1" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00d4ff"/>
                        <stop offset="100%" stopColor="#7b61ff"/>
                    </linearGradient>
                    <linearGradient id="logo-stroke2" x1="22" y1="11" x2="18" y2="29" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00e5a0"/>
                        <stop offset="100%" stopColor="#00d4ff"/>
                    </linearGradient>
                </defs>
            </svg>

            {/* Wordmark */}
            <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: s.text,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: '#e2e8f0',
                lineHeight: 1,
            }}>
                Code<span style={{
                    background: 'linear-gradient(135deg, #00d4ff, #7b61ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>Insight</span>
            </span>
        </span>
    );
}
