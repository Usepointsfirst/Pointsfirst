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
  { n: '01', emoji: '💳', title: 'Pick Your Cards',    desc: 'Select which credit cards you hold. Chase, Amex, Capital One, Citi, Bilt — we support all the major programs.' },
  { n: '02', emoji: '💰', title: 'Enter Your Points',  desc: 'Tell us your balance for each card. Enter a partial amount or your full balance — your call.' },
  { n: '03', emoji: '📅', title: 'Choose Your Dates',  desc: 'Select travel dates or compare multiple date ranges side-by-side to find the best window.' },
  { n: '04', emoji: '✈️', title: 'See Your Options',   desc: 'We surface flights you can actually afford with your points, including how to combine across cards for maximum value.' },
  { n: '05', emoji: '🎯', title: 'Book It',            desc: 'We show you exactly where and how to book — through your card portal or directly with the airline. We get out of the way.' },
]

const DIFFERENTIATORS = [
  { icon: '💳', title: 'Points First. Always.',    desc: 'Every other tool starts with a destination and hopes your points work out. We start with your cards.' },
  { icon: '🔗', title: 'Combine Across Cards',     desc: 'Have Chase and Amex? We find flights where both cards transfer to the same airline and show you the combined math.' },
  { icon: '📊', title: 'Real Prices. All Fees.',   desc: 'No hidden surprises. Every result includes taxes, carrier fees, and surcharges — the actual number you pay.' },
  { icon: '⚡', title: 'Transfer Bonus Alerts',    desc: 'Cards run 20-40% transfer bonuses a few times a year. We track them so you never miss a chance to stretch your points further.' },
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
        <div className="flex items-center gap-3 rounded-2xl px-6 py-4" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#86efac' }}>You're on the list!</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.7)' }}>We'll email you the moment we launch.</p>
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
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8" style={{ background: 'rgba(232,184,75,0.12)', border: `1px solid rgba(232,184,75,0.35)` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: GOLD }}>
              Coming Soon · Founding Members Get Early Access
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
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
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Chase · Amex · Capital One · Citi · Bilt — more coming</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span className="text-xs">Scroll to learn more</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>The Problem</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            Every other flight search starts with
            <span className="text-gray-400"> the destination.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            You pick where you want to go, search for flights, and then scramble to figure out if your
            points will even cover it. You end up on four different sites, doing mental math,
            and still not sure if you're getting a good deal.
          </p>
          <div className="flex items-center justify-center gap-4 text-lg font-bold">
            <span className="text-red-400 line-through opacity-60">Destination first</span>
            <span className="text-gray-300 text-2xl">→</span>
            <span style={{ color: GOLD }}>Points first</span>
          </div>
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
                <div className="relative z-10 bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 h-full border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{step.emoji}</span>
                    <span className="text-xs font-black tracking-widest" style={{ color: GOLD }}>{step.n}</span>
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
            <div className="w-full rounded-2xl p-5 flex items-center justify-between" style={{ background: '#1A3A8A', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#93C5FD' }}>Chase Ultimate Rewards</p>
                <p className="text-white font-extrabold text-2xl mt-1">45,000 pts</p>
              </div>
              <span className="text-3xl">💳</span>
            </div>

            <div className="font-black text-2xl" style={{ color: 'rgba(255,255,255,0.35)' }}>+</div>

            <div className="w-full rounded-2xl p-5 flex items-center justify-between" style={{ background: '#007AC0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#BAE6FD' }}>Amex Membership Rewards</p>
                <p className="text-white font-extrabold text-2xl mt-1">30,000 pts</p>
              </div>
              <span className="text-3xl">💳</span>
            </div>

            <div className="font-black text-2xl" style={{ color: 'rgba(255,255,255,0.35)' }}>=</div>

            <div className="w-full rounded-2xl p-5" style={{ background: SURFACE, border: `2px solid ${GOLD}` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: GOLD }}>Air Canada Aeroplan</p>
                  <p className="text-white font-extrabold text-2xl mt-1">75,000 pts</p>
                </div>
                <span className="text-3xl">✈️</span>
              </div>
              <div className="pt-3 flex items-center gap-2" style={{ borderTop: `1px solid rgba(232,184,75,0.3)` }}>
                <span className="font-bold text-sm" style={{ color: '#4ade80' }}>✅</span>
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
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Why PointsFirst</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built different. On purpose.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex gap-4">
                <span className="text-3xl flex-shrink-0">{d.icon}</span>
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
      <section className="py-16 px-5 bg-gray-50">
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
