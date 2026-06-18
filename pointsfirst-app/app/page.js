'use client'

import { useState } from 'react'

const GOLD    = '#E8B84B'
const GOLD_LT = '#F5D98A'
const BLACK   = '#111111'
const SURFACE = '#1C1C1C'

const CARDS = [
  { name: 'Chase UR',  bg: '#1A3A8A', label: 'Chase Ultimate Rewards' },
  { name: 'Amex MR',  bg: '#007AC0', label: 'Amex Membership Rewards' },
  { name: 'Cap One',  bg: '#C41E3A', label: 'Capital One Miles' },
  { name: 'Citi TY',  bg: '#003B6A', label: 'Citi ThankYou Points' },
  { name: 'Bilt',     bg: '#2A2A2A', label: 'Bilt Rewards' },
]

const STEPS = [
  { n: '01', title: 'Pick Your Cards',    desc: 'Select which credit cards you hold. Chase, Amex, Capital One, Citi, Bilt — we support all the major programs.' },
  { n: '02', title: 'Enter Your Points',  desc: 'Tell us your balance for each card. Enter a partial amount or your full balance — your call.' },
  { n: '03', title: 'Choose Your Dates',  desc: 'Select travel dates or compare multiple date ranges side-by-side to find the best window.' },
  { n: '04', title: 'See Your Options',   desc: 'We surface flights you can actually afford with your points, including how to combine across cards for maximum value.' },
  { n: '05', title: 'Book It',            desc: 'We show you exactly where and how to book — through your card portal or directly with the airline. We get out of the way.' },
]

const ICONS = {
  card: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  link: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  bolt: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  plane: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
}

const DIFFERENTIATORS = [
  { icon: 'card',  title: 'Points First. Always.',    desc: 'Every other tool starts with a destination and hopes your points work out. We start with your cards.' },
  { icon: 'link',  title: 'Combine Across Cards',     desc: 'Have Chase and Amex? We find flights where both cards transfer to the same airline and show you the combined math.' },
  { icon: 'chart', title: 'Real Prices. All Fees.',   desc: 'No hidden surprises. Every result includes taxes, carrier fees, and surcharges — the actual number you pay.' },
  { icon: 'bolt',  title: 'Transfer Bonus Alerts',    desc: 'Cards run 20-40% transfer bonuses a few times a year. We track them so you never miss a chance to stretch your points further.' },
]

function WaitlistForm({ size = 'large', className = '' }) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="flex items-center gap-3 rounded-2xl px-6 py-4" style={{ background: 'rgba(232,184,75,0.1)', border: `1px solid rgba(232,184,75,0.35)` }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,184,75,0.2)', color: GOLD }}>
            {ICONS.check}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: GOLD }}>You're on the list.</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>We'll email you the moment we launch.</p>
          </div>
        </div>
      </div>
    )
  }

  const isLarge = size === 'large'

  return (
    <form onSubmit={submit} className={`w-full ${className}`}>
      <div className={`flex flex-col sm:flex-row gap-3 ${isLarge ? 'max-w-md mx-auto' : 'max-w-sm mx-auto'}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 rounded-xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: isLarge ? '16px 20px' : '12px 16px',
            fontSize: isLarge ? '16px' : '14px',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap"
          style={{
            background: GOLD,
            color: BLACK,
            padding: isLarge ? '16px 28px' : '12px 20px',
            fontSize: isLarge ? '16px' : '14px',
            opacity: status === 'loading' ? 0.6 : 1,
          }}
          onMouseEnter={e => e.currentTarget.style.background = GOLD_LT}
          onMouseLeave={e => e.currentTarget.style.background = GOLD}
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-center mt-2" style={{ color: '#f87171' }}>Something went wrong. Try again.</p>
      )}
      <p className="text-xs text-center mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Free to join · No spam · Unsubscribe anytime
      </p>
    </form>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm" style={{ background: 'rgba(17,17,17,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight" style={{ color: 'white' }}>
            Points<span style={{ color: GOLD }}>First</span>
          </span>
          <a
            href="#waitlist"
            className="text-sm font-semibold rounded-lg transition-colors"
            style={{ background: GOLD, color: BLACK, padding: '8px 16px' }}
            onMouseEnter={e => e.currentTarget.style.background = GOLD_LT}
            onMouseLeave={e => e.currentTarget.style.background = GOLD}
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative pt-14 min-h-screen flex flex-col items-center justify-center px-5 text-center overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${BLACK} 0%, ${SURFACE} 60%, ${BLACK} 100%)` }}
      >
        {/* Layered background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 38%, rgba(232,184,75,0.13) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 30% at 30% 60%, rgba(232,184,75,0.05) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 30% at 70% 25%, rgba(232,184,75,0.05) 0%, transparent 60%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-8 mt-8 sm:mt-0" style={{ background: 'rgba(232,184,75,0.12)', border: `1px solid rgba(232,184,75,0.35)` }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: GOLD }} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase leading-tight" style={{ color: GOLD }}>
              Coming Soon · Founding Members Get Early Access
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[28px] sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            The First Flight Search
            <br />
            <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>That Starts With</span>
            <br />
            Your Points
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Select your credit cards. Enter your balance. We find flights you can actually afford to
            book — and combine points across cards so you never leave value on the table.
          </p>

          <div id="waitlist">
            <WaitlistForm size="large" />
          </div>

          {/* Card badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {CARDS.map((c) => (
              <span
                key={c.name}
                className="text-xs font-bold text-white px-3 py-1.5 rounded-full"
                style={{ backgroundColor: c.bg + 'CC', border: `1px solid ${c.bg}` }}
              >
                {c.name}
              </span>
            ))}
          </div>
          <p className="text-xs mt-3 mb-16 sm:mb-0" style={{ color: 'rgba(255,255,255,0.25)' }}>Chase · Amex · Capital One · Citi · Bilt — more coming</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span className="text-xs">Scroll to learn more</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="py-20 px-5" style={{ background: '#E8E8E8' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>The Problem</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Every other flight search starts with
            <span style={{ color: GOLD }}> the destination.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            You pick where you want to go, search for flights, and then scramble to figure out if your
            points will even cover it. You end up on four different sites, doing mental math,
            and still not sure if you're getting a good deal.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Five steps. Zero confusion.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative flex flex-col">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 h-px z-0" style={{ background: `rgba(232,184,75,0.25)`, width: 'calc(100% - 20px)', left: '60%' }} />
                )}
                <div className="relative z-10 bg-gray-100 rounded-2xl p-5 flex flex-col gap-3 h-full border border-gray-200">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tracking-wider" style={{ background: 'rgba(232,184,75,0.12)', border: `1px solid rgba(232,184,75,0.4)`, color: GOLD }}>
                    {step.n}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMBINING FEATURE ── */}
      <section className="py-20 px-5" style={{ background: `linear-gradient(160deg, ${BLACK} 0%, ${SURFACE} 100%)` }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>The Feature No One Else Has</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Two cards. One trip.
              <br />
              <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Maximum value.</span>
            </h2>
            <p className="text-lg mt-5 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              When Chase UR and Amex MR both transfer to Air Canada Aeroplan, your points
              aren't separate anymore — they're one combined balance. PointsFirst is the only
              tool that shows you this.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <div className="w-full rounded-2xl p-5" style={{ background: '#1A3A8A', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#93C5FD' }}>Chase Ultimate Rewards</p>
              <p className="text-white font-extrabold text-2xl">45,000 pts</p>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>+</div>

            <div className="w-full rounded-2xl p-5" style={{ background: '#007AC0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#BAE6FD' }}>Amex Membership Rewards</p>
              <p className="text-white font-extrabold text-2xl">30,000 pts</p>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>=</div>

            <div className="w-full rounded-2xl p-5" style={{ background: SURFACE, border: `2px solid ${GOLD}` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: GOLD }}>Air Canada Aeroplan</p>
                  <p className="text-white font-extrabold text-2xl">75,000 pts</p>
                </div>
                <div style={{ color: GOLD }}>{ICONS.plane}</div>
              </div>
              <div className="pt-3 flex items-center gap-2" style={{ borderTop: `1px solid rgba(232,184,75,0.3)` }}>
                <div className="flex-shrink-0" style={{ color: '#4ade80' }}>{ICONS.check}</div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Business Class · New York → London</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Example only. Actual award availability and rates vary.
          </p>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ── */}
      <section className="py-20 px-5" style={{ background: '#E8E8E8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Why PointsFirst</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built different. On purpose.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="rounded-2xl border border-gray-300 bg-white p-6 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,184,75,0.1)', color: GOLD }}>
                  {ICONS[d.icon]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{d.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED CARDS ── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: GOLD }}>Supported Programs at Launch</p>
          <div className="flex flex-wrap justify-center gap-4">
            {CARDS.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl px-5 py-3" style={{ background: c.bg, border: `1px solid ${c.bg}` }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
                <span className="text-white font-bold text-sm">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-6">More programs added based on waitlist demand.</p>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-24 px-5 text-center" style={{ background: `linear-gradient(160deg, ${BLACK} 0%, ${SURFACE} 100%)` }} id="cta">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">Be first in line.</h2>
          <p className="text-lg mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Founding members get early access and locked-in pricing — forever.
          </p>
          <p className="text-sm font-semibold mb-10" style={{ color: GOLD }}>
            No credit card required to join the waitlist.
          </p>
          <WaitlistForm size="default" className="max-w-sm mx-auto" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-5" style={{ background: BLACK, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Points<span style={{ color: GOLD }}>First</span>
          </span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 PointsFirst · usepointsfirst.com</p>
          <div className="flex gap-4">
            <a href="#" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>Privacy Policy</a>
            <a href="#" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>Terms</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
