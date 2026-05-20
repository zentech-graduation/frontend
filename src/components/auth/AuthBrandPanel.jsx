import { Link } from 'react-router-dom';

function Glyph({ children, size = 18, color = 'currentColor', stroke = 1.5 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SearchIcon({ color }) {
  return (
    <Glyph size={15} color={color}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </Glyph>
  );
}

function ArrowIcon({ color }) {
  return (
    <Glyph size={14} color={color}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Glyph>
  );
}

function NavIcon({ name, active = false }) {
  const color = active ? 'var(--lx-accent)' : 'var(--lx-ink-3)';

  if (name === 'home') {
    return (
      <Glyph color={color} stroke={active ? 1.8 : 1.5}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </Glyph>
    );
  }

  if (name === 'search') {
    return (
      <Glyph color={color} stroke={active ? 1.8 : 1.5}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </Glyph>
    );
  }

  if (name === 'plus') {
    return (
      <Glyph color={color} stroke={active ? 1.8 : 1.5}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </Glyph>
    );
  }

  if (name === 'heart') {
    return (
      <Glyph color={color} stroke={active ? 1.8 : 1.5}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </Glyph>
    );
  }

  return (
    <Glyph color={color} stroke={active ? 1.8 : 1.5}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Glyph>
  );
}

function WordMark({ size = 28, inverted = false }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        display: 'block',
        color: inverted ? 'var(--lx-ink-inverse)' : 'var(--lx-ink)',
      }}
    >
      luvax
    </span>
  );
}

function Eyebrow({ children, color }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: color || 'var(--lx-ink-3)',
      }}
    >
      {children}
    </span>
  );
}

function TopNav({ inverted }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <WordMark size={24} inverted={inverted} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link
          to="/login?reauth=1"
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: inverted ? '#E8E3DC' : 'var(--lx-ink-2)',
            padding: '8px 14px',
            borderRadius: 999,
          }}
        >
          sign in
        </Link>
        <Link
          to="/register"
          style={{
            background: inverted ? '#F9F7F4' : 'var(--lx-ink)',
            color: inverted ? 'var(--lx-ink)' : 'var(--lx-ink-inverse)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            padding: '9px 18px',
            borderRadius: 999,
          }}
        >
          create account
        </Link>
      </div>
    </nav>
  );
}

function FeedCard({ handle, time, caption, avatarColor, background, aspect = '4 / 5' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: avatarColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--lx-ink)',
          }}
        >
          {handle}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--lx-ink-3)',
            marginLeft: 'auto',
          }}
        >
          {time}
        </span>
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background, width: '100%', aspectRatio: aspect }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--lx-ink-2)',
          lineHeight: 1.4,
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function PhoneMock({ scale = 1, tilted = false }) {
  const width = 264;

  return (
    <div
      style={{
        width,
        transform: `scale(${scale}) ${tilted ? 'rotate(-2.5deg)' : ''}`,
        transformOrigin: 'center center',
        filter:
          'drop-shadow(0 30px 60px rgba(26,24,22,0.20)) drop-shadow(0 10px 20px rgba(26,24,22,0.12))',
      }}
    >
      <div
        style={{
          background: '#0E0C0A',
          borderRadius: 42,
          padding: 7,
          border: '1px solid #1f1c19',
        }}
      >
        <div
          style={{
            background: '#F9F7F4',
            borderRadius: 36,
            overflow: 'hidden',
            aspectRatio: '9 / 19.5',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 9,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 84,
              height: 22,
              background: '#0E0C0A',
              borderRadius: 14,
              zIndex: 20,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '13px 20px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--lx-ink)',
            }}
          >
            <span>9:41</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <svg width="13" height="9" viewBox="0 0 13 9" aria-hidden="true">
                <rect x="0" y="6" width="2" height="3" rx="0.5" fill="var(--lx-ink)" />
                <rect x="3" y="4" width="2" height="5" rx="0.5" fill="var(--lx-ink)" />
                <rect x="6" y="2" width="2" height="7" rx="0.5" fill="var(--lx-ink)" />
                <rect x="9" y="0" width="2" height="9" rx="0.5" fill="var(--lx-ink)" />
              </svg>
              <div
                style={{
                  width: 18,
                  height: 8,
                  border: '1px solid var(--lx-ink)',
                  borderRadius: 2,
                  padding: 1,
                  position: 'relative',
                  marginLeft: 2,
                }}
              >
                <div
                  style={{
                    width: '78%',
                    height: '100%',
                    background: 'var(--lx-ink)',
                    borderRadius: 1,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: 1.5,
                    width: 1.5,
                    height: 3,
                    background: 'var(--lx-ink)',
                    borderRadius: 1,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px 10px',
              borderBottom: '1px solid var(--lx-border)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--lx-ink)',
                letterSpacing: '-0.04em',
              }}
            >
              luvax
            </span>
            <SearchIcon color="var(--lx-ink-2)" />
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              padding: '14px 14px 0',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--lx-ink-3)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              today
            </div>

            <FeedCard
              handle="@sol.r"
              time="3h"
              caption="morning, window, coffee"
              avatarColor="#7A9E7A"
              background="linear-gradient(135deg, #D4B896 0%, #C8A97E 60%, #B89468 100%)"
            />

            <FeedCard
              handle="@jo.x"
              time="1d"
              caption="reading slowly"
              avatarColor="#C8A97E"
              background="linear-gradient(150deg, #8FA88F 0%, #7A9E7A 100%)"
              aspect="1 / 1"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '10px 0 14px',
              background: 'rgba(249,247,244,0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderTop: '1px solid var(--lx-border)',
            }}
          >
            {[
              { name: 'home', active: true },
              { name: 'search' },
              { name: 'plus' },
              { name: 'heart' },
              { name: 'user' },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <NavIcon name={item.name} active={item.active} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ theme = 'warm' }) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#1A1816' : 'var(--lx-base)';
  const ink = isDark ? '#F9F7F4' : 'var(--lx-ink)';
  const inkSub = isDark ? '#A89E94' : 'var(--lx-ink-2)';
  const inkMuted = isDark ? '#6A6058' : 'var(--lx-ink-3)';

  return (
    <div style={{ background: bg, color: ink, overflow: 'hidden' }}>
      <TopNav inverted={isDark} />

      <div className="lx-hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px 100px' }}>
        <div className="lx-hero-copy" style={{ display: 'flex', flexDirection: 'column', gap: 32, justifyContent: 'center' }}>
          <Eyebrow color={inkMuted}>luvax — a small social network</Eyebrow>

          <h1
            className="lx-hero-h1"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: ink,
              letterSpacing: '-0.045em',
              lineHeight: 0.96,
              margin: 0,
            }}
          >
            pure social,
            <br />
            no noise.
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 17,
              lineHeight: 1.55,
              color: inkSub,
              maxWidth: 440,
              margin: 0,
            }}
          >
            follow your people. see what they post. that’s the whole product. no public metrics,
            no infinite scroll, no noise.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                background: isDark ? '#F9F7F4' : 'var(--lx-ink)',
                color: isDark ? 'var(--lx-ink)' : 'var(--lx-ink-inverse)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                padding: '15px 26px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              create your account <ArrowIcon color={isDark ? 'var(--lx-ink)' : 'var(--lx-ink-inverse)'} />
            </Link>
            <Link
              to="/login?reauth=1"
              style={{
                background: 'transparent',
                color: ink,
                textDecoration: 'none',
                border: `1px solid ${isDark ? '#3A332E' : 'var(--lx-border)'}`,
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                padding: '14px 26px',
                borderRadius: 999,
              }}
            >
              sign in
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 8,
              paddingTop: 16,
              borderTop: `1px solid ${isDark ? '#2A2522' : 'var(--lx-border)'}`,
            }}
          >
            <Stat label="available on" value="web" ink={inkSub} muted={inkMuted} />
            <Stat label="cost" value="free, forever" ink={inkSub} muted={inkMuted} />
            <Stat label="status" value="open to all" ink={inkSub} muted={inkMuted} />
          </div>
        </div>

        <div className="lx-hero-vis" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {isDark ? (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: 340,
                height: 340,
                background:
                  'radial-gradient(circle, rgba(200,169,126,0.18) 0%, rgba(200,169,126,0) 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
          <PhoneMock tilted />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, ink, muted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: muted,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 500,
          color: ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ background, pad = '120px 28px', children }) {
  return (
    <section style={{ background, padding: pad }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function Manifesto() {
  return (
    <Section background="var(--lx-base)" pad="120px 28px">
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Eyebrow>manifesto</Eyebrow>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 500,
            color: 'var(--lx-ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          the social internet got loud. notifications, metrics, algorithms — none of it making your
          life better.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            color: 'var(--lx-ink-2)',
            lineHeight: 1.65,
            maxWidth: 560,
            margin: 0,
          }}
        >
          luvax is small on purpose. you follow people. you see what they post. that’s the whole
          product. no public follower count. no streaks, no badges, no growth-hacked notification
          pings. just a quiet place for your people.
        </p>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--lx-ink-3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          — the luvax team
        </span>
      </div>
    </Section>
  );
}

const PRINCIPLES = [
  {
    n: '01',
    title: 'finite by design',
    body: 'the feed has an end. you catch up on what your people posted, then you close the app. no infinite scroll, no doom-loop.',
  },
  {
    n: '02',
    title: 'private counts',
    body: 'likes and follower numbers are visible only to you and the other person. no public scoreboard, no popularity contest.',
  },
  {
    n: '03',
    title: 'calm by default',
    body: 'no notifications. no streaks. no badges. open the app when you want to — not because we nagged you.',
  },
];

function Principles() {
  return (
    <Section background="var(--lx-surface)" pad="100px 28px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
          <Eyebrow>principles</Eyebrow>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 40,
              fontWeight: 700,
              color: 'var(--lx-ink)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            three rules we won’t break.
          </h2>
        </div>
        <div className="lx-principles" style={{ display: 'grid', gap: 40 }}>
          {PRINCIPLES.map((item) => (
            <div
              key={item.n}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                paddingTop: 20,
                borderTop: '1px solid var(--lx-border-strong)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--lx-ink-3)',
                  letterSpacing: '0.06em',
                }}
              >
                {item.n}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--lx-ink)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  color: 'var(--lx-ink-2)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function CtaStrip() {
  return (
    <Section background="var(--lx-base)" pad="100px 28px">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          textAlign: 'center',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44,
            fontWeight: 700,
            color: 'var(--lx-ink)',
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          ready for a quieter feed?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--lx-ink-2)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 480,
          }}
        >
          free to use, free of noise. pick a handle and you’re in — no waitlist, no algorithm, no
          ads.
        </p>
        <Link
          to="/register"
          style={{
            marginTop: 8,
            background: 'var(--lx-ink)',
            color: 'var(--lx-ink-inverse)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            padding: '15px 28px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          claim your handle <ArrowIcon color="var(--lx-ink-inverse)" />
        </Link>
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        background: 'var(--lx-surface)',
        padding: '40px 28px',
        borderTop: '1px solid var(--lx-border)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <WordMark size={20} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--lx-ink-3)',
              letterSpacing: '0.1em',
            }}
          >
            © 2026 — made with restraint.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          {['privacy', 'terms', 'press', 'contact'].map((label) => (
            <a
              key={label}
              href="#"
              onClick={(event) => event.preventDefault()}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--lx-ink-2)',
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function AuthBrandPanel() {
  return (
    <div>
      <Hero theme="warm" />
      <Manifesto />
      <Principles />
      <CtaStrip />
      <Footer />
    </div>
  );
}
