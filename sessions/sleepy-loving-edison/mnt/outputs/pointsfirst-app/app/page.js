'use client'

import { useState } from 'react'

const CARDS = [
  { name: 'Chase UR',    bg: '#1A3A8A', label: 'Chase Ultimate Rewards' },
  { name: 'Amex MR',    bg: '#007AC0', label: 'Amex Membership Rewards' },
  { name: 'Cap One',    bg: '#C41E3A', label: 'Capital One Miles' },
  { name: 'Citi TY',    bg: '#003B6A', label: 'Citi ThankYou Points' },
  { name: 'Bilt',       bg: '#1C1C1C', label: 'Bilt Rewards' },
]

const STEPS = [
  {
    n: '01',
    emoji: '💳',
    title: 'Pick Your Cards',
    desc: 'Select which credit cards you hold. Chase, Amex, Capital One, Citi, Bilt — we support all the major programs.',
  },
  {
    n: '02',
    emoji: '💰',
    title: 'Enter Your Points',
    desc: 'Tell us your balance for each card. Enter a partial amount or your full balance — your call.',
  },
  {
    n: '03',
    emoji: '📅',
    title: 'Choose Your Dates',
    desc: 'Select travel dates or compare multiple date ranges side-by-side to find the best window.',
  },
  {
    n: '04',
    emoji: '✈️',
    title: 'See Your Options',
    desc: 'We surface flights you can actually afford with your points, including how to combine across cards for maximum value.',
  },
  {
    n: '05',
    emoji: '🎯',
    title: 'Book It',
    desc: "We show you exactly where and how to book — through your card portal or directly with the airline. We get out of the way.",
  },
]

const DIFFERENTIATORS = [
  {
    icon: '💳',
    title: 'Points First. Always.',
    desc: 'Every other tool starts with a destination and hopes your points work out. We start with your cards.',
  },
  {
    icon: '🔗',
    title: 'Combine Across Cards',
    desc: 'Have Chase and Amex? We find flights where both cards transfer to the same airline and show you the combined math.',
  },
  {
    icon: '📊',
    title: 'Real Prices. All Fees.',
    desc: 'No hidden surprises. Every result includes taxes, carrier fees, and surcharges — the actual number you pay.',
  },
  {
    icon: '⚡',
    title: 'Transfer Bonus Alerts',
    desc: 'Cards run 20-40% transfer bonuses a few times a year. We track them so you never miss a chance to stretch your points further.',
  },
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="flex items-center gap-3 bg-green-500/20 border border-green-400/40 rounded-2xl px-6 py-4">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-green-300 font-bold text-sm">You're on the list!</p>
            <p className="text-green-400/80 text-xs mt-0.5">We'll email you the moment we launch.</p>
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
          className={`flex-1 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all ${
            isLarge ? 'px-5 py-4 text-base' : 'px-4 py-3 text-sm'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`rounded-xl font-bold bg-blue-500 hover:bg-blue-400 active:scale-95 text-white transition-all disabled:opacity-60 whitespace-nowrap ${
            isLarge ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm'
          }`}
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-xs text-center mt-2">Something went wrong. Try again.</p>
      )}
      <p className="text-white/40 text-xs text-center mt-3">
        Free to join · No spam · Unsubscribe anytime
      </p>
    </form>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-pf-navy/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-tight">
            Points<span className="text-blue-400">First</span>
          </span>
          <a
            href="#waitlist"
            className="text-sm font-semibold bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative pt-14 min-h-screen flex flex-col items-center justify-center px-5 text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1A3A8A 60%, #0F2461 100%)' }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-semibold tracking-wide uppercase">
              Coming Soon · Founding Members Get Early Access
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            The First Flight Search
            <br />
            <span className="text-gradient">That Starts With</span>
            <br />
            Your Points
          </h1>

          {/* Subheadline */}
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Select your credit cards. Enter your balance. We find flights you can actually afford to
            book — and combine points across cards so you never leave value on the table.
          </p>

          {/* Form */}
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
          <p className="text-white/30 text-xs mt-3">Chase · Amex · Capital One · Citi · Bilt — more coming</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
          <span className="text-xs">Scroll to learn more</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">The Problem</p>
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
            <span className="text-blue-600">Points first</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Five steps. Zero confusion.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative flex flex-col">
                {/* Connector line (desktop only) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+0px)] w-full h-px bg-blue-100 z-0" style={{ width: 'calc(100% - 20px)', left: '60%' }} />
                )}
                <div className="relative z-10 bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 h-full border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{step.emoji}</span>
                    <span className="text-xs font-black text-blue-400 tracking-widest">{step.n}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMBINING FEATURE ────────────────────────────── */}
      <section
        className="py-20 px-5"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0F2461 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">The Feature No One Else Has</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Two cards. One trip.
              <br />
              <span className="text-gradient">Maximum value.</span>
            </h2>
            <p className="text-white/60 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
              When Chase UR and Amex MR both transfer to Air Canada Aeroplan, your points
              aren't separate anymore — they're one combined balance. PointsFirst is the only
              tool that shows you this.
            </p>
          </div>

          {/* Visual example */}
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            {/* Card 1 */}
            <div
              className="w-full rounded-2xl p-5 flex items-center justify-between"
              style={{ background: '#1A3A8A', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">Chase Ultimate Rewards</p>
                <p className="text-white font-extrabold text-2xl mt-1">45,000 pts</p>
              </div>
              <span className="text-3xl">💳</span>
            </div>

            <div className="text-white/40 font-black text-2xl">+</div>

            {/* Card 2 */}
            <div
              className="w-full rounded-2xl p-5 flex items-center justify-between"
              style={{ background: '#007AC0', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Amex Membership Rewards</p>
                <p className="text-white font-extrabold text-2xl mt-1">30,000 pts</p>
              </div>
              <span className="text-3xl">💳</span>
            </div>

            <div className="text-white/40 font-black text-2xl">=</div>

            {/* Result */}
            <div className="w-full rounded-2xl p-5 bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/40">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Air Canada Aeroplan</p>
                  <p className="text-white font-extrabold text-2xl mt-1">75,000 pts</p>
                </div>
                <span className="text-3xl">✈️</span>
              </div>
              <div className="border-t border-blue-400/30 pt-3 flex items-center gap-2">
                <span className="text-green-400 font-bold text-sm">✅</span>
                <p className="text-white/90 text-sm font-semibold">
                  Business Class · New York → London
                </p>
              </div>
            </div>
          </div>

          <p className="text-white/30 text-xs text-center mt-6">
            Example only. Actual award availability and rates vary.
          </p>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ──────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Why PointsFirst</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built different. On purpose.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex gap-4"
              >
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

      {/* ── SUPPORTED CARDS ──────────────────────────────── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-8">Supported Programs at Launch</p>
          <div className="flex flex-wrap justify-center gap-4">
            {CARDS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-xl px-5 py-3"
                style={{ background: c.bg, border: `1px solid ${c.bg}` }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
                <span className="text-white font-bold text-sm">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-6">More programs added based on waitlist demand.</p>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section
        className="py-24 px-5 text-center"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1A3A8A 100%)' }}
        id="cta"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Be first in line.
          </h2>
          <p className="text-white/60 text-lg mb-3">
            Founding members get early access and locked-in pricing — forever.
          </p>
          <p className="text-blue-400 font-semibold text-sm mb-10">
            No credit card required to join the waitlist.
          </p>
          <WaitlistForm size="default" className="max-w-sm mx-auto" />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="py-8 px-5 bg-pf-navy border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white/50 text-sm font-bold">
            Points<span className="text-blue-400">First</span>
          </span>
          <p className="text-white/30 text-xs">
            © 2026 PointsFirst · usepointsfirst.com
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}
