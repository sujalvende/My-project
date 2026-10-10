import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CalendarDays, ClipboardList, HeartHandshake, Lock,
  MapPin, Search, ShieldCheck, UserCheck, Phone,
  Users, Droplets, Clock, ArrowRight, MapPinned, Star
} from 'lucide-react'
import { CAMPS, GROUPS, LOCALITIES, fmtDate, type Group } from '../data'
import { ButtonLink, Button, DemoTag, inputCls, BloodChips, Notice } from '../ui'

/* ── Hero visual (SVG network) ───────────────────── */
function HeroVisual() {
  const people: [number, number, boolean][] = [
    [70, 120, false], [400, 90, true], [440, 250, false],
    [380, 400, true], [110, 380, false], [60, 250, false], [250, 40, false],
  ]
  return (
    <div className="relative flex items-center justify-center">
      {/* Soft ambient glow behind SVG — CSS only, no layout impact */}
      <div
        className="absolute inset-0 opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, #b91c3b 0%, transparent 70%)' }}
        aria-hidden
      />

      <svg
        viewBox="0 0 500 500"
        role="img"
        aria-label="Blood donation network connecting a central drop to community donors"
        className="relative h-auto w-full max-w-[480px]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="dropGrad" cx="45%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#e8526e" />
            <stop offset="100%" stopColor="#96152d" />
          </radialGradient>
          {/* Soft glow around the drop */}
          <filter id="dropGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ① Pulsing rings from center — pure SMIL, 0 layout risk */}
        {([0, 1, 2] as const).map((i) => (
          <circle key={i} cx="250" cy="250" r="72" fill="none" stroke="#B91C3B" strokeWidth="1.5">
            <animate attributeName="r"       values="72;210"  dur="2.8s" begin={`${i * 0.93}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0"   dur="2.8s" begin={`${i * 0.93}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ② Static orbit rings */}
        <circle cx="250" cy="250" r="200" fill="none" stroke="#E8EAED" strokeDasharray="5 9"  strokeWidth="1" />
        <circle cx="250" cy="250" r="148" fill="none" stroke="#F0F1F3" strokeDasharray="2 6"  strokeWidth="1" />

        {/* ③ Connector lines — each fades in with a stagger */}
        {people.map(([x, y, on], i) => (
          <line key={i} x1="250" y1="250" x2={x} y2={y}
            stroke={on ? '#B91C3B' : '#DDE0E4'}
            strokeWidth={on ? 1.8 : 1}
            opacity="0"
          >
            <animate attributeName="opacity"
              values={`0;${on ? 0.85 : 0.45}`}
              dur="0.5s"
              begin={`${0.25 + i * 0.1}s`}
              fill="freeze"
            />
          </line>
        ))}

        {/* ④ Central blood drop — gentle breathe via SMIL animateTransform */}
        <g>
          <path
            d="M250 126c38 50 72 88 72 130a72 72 0 1 1-144 0c0-42 34-80 72-130Z"
            fill="url(#dropGrad)"
            filter="url(#dropGlow)"
          >
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1 1; 1.04 1.04; 1 1"
              dur="3.4s"
              additive="sum"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>
          {/* Inner ring + dot on drop */}
          <circle cx="250" cy="268" r="31"   fill="none" stroke="#fff" strokeWidth="4.5" />
          <circle cx="250" cy="268" r="9.5"  fill="#fff" />
        </g>

        {/* ⑤ Donor avatar nodes — staggered opacity fade-in */}
        {people.map(([x, y, on], i) => (
          <g key={i}>
            {/* Node circle */}
            <circle cx={x} cy={y} r={on ? 21 : 15}
              fill={on ? '#fff' : '#F8F9FA'}
              stroke={on ? '#B91C3B' : '#DDE0E4'}
              strokeWidth={on ? 2 : 1.4}
              opacity="0"
            >
              <animate attributeName="opacity" values="0;1" dur="0.45s"
                begin={`${0.45 + i * 0.1}s`} fill="freeze" />
            </circle>
            {/* Head */}
            <circle cx={x} cy={y - 3} r={on ? 5 : 3.5}
              fill={on ? '#B91C3B' : '#9CA3AF'} opacity="0"
            >
              <animate attributeName="opacity" values="0;1" dur="0.45s"
                begin={`${0.45 + i * 0.1}s`} fill="freeze" />
            </circle>
            {/* Shoulders */}
            <path d={`M${x - 8.5} ${y + 9.5}a8.5 7.5 0 0 1 17 0z`}
              fill={on ? '#B91C3B' : '#9CA3AF'} opacity="0"
            >
              <animate attributeName="opacity" values="0;1" dur="0.45s"
                begin={`${0.45 + i * 0.1}s`} fill="freeze" />
            </path>
            {/* Active ping dot on matched nodes */}
            {on && (
              <circle cx={x > 250 ? x + 14 : x - 14} cy={y - 14} r="4.5" fill="#B91C3B" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.3s"
                  begin={`${0.9 + i * 0.1}s`} fill="freeze" />
                <animate attributeName="opacity" values="1;0.25;1" dur="2s"
                  begin={`${1.2 + i * 0.1}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="4.5;5.8;4.5" dur="2s"
                  begin={`${1.2 + i * 0.1}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}

        {/* ⑥ Match card — slides in last */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.55s" begin="1.1s" fill="freeze" />
          <g transform="translate(268 30)">
            <rect width="190" height="54" rx="14" fill="#fff" stroke="#E8EAED" strokeWidth="1.5"
              filter="drop-shadow(0 5px 20px rgba(18,21,30,0.12))" />
            <circle cx="28" cy="27" r="14" fill="#B91C3B" />
            <text x="28" y="32" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#fff">O−</text>
            <text x="51" y="23" fontSize="11" fontWeight="700" fill="#12151e">Match found</text>
            <text x="51" y="38" fontSize="9.5"  fill="#606472">Kothrud · 2.3 km · verified</text>
          </g>
        </g>
      </svg>
    </div>
  )
}

/* ── Stats row ───────────────────────────────────── */

function StatsBar() {
  // NOTE: all figures below are illustrative — this is a prototype with no live data.
  const stats = [
    { icon: Users, value: '2,400+', label: 'Sample registered donors' },
    { icon: Droplets, value: '847', label: 'Sample requests coordinated' },
    { icon: Clock, value: '< 2 hrs', label: 'Illustrative response time' },
    { icon: MapPinned, value: '9', label: 'Supported localities (demo)' },
  ]
  return (
    <section className="relative overflow-hidden" aria-label="Illustrative platform statistics (demo data)">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #12151e 0%, #1e0a10 50%, #12151e 100%)'
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex justify-center pt-4 pb-1">
          <DemoTag>Illustrative figures — not live data</DemoTag>
        </div>
        <div className="grid grid-cols-2 gap-px py-0 md:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-2 px-6 py-8 text-center anim-rise delay-${i * 100 + 100}`}
            >
              <Icon size={22} className="text-brand mb-1" aria-hidden />
              {/* stat-value uses a solid fallback color so reduced-motion users always see text */}
              <p className="stat-shimmer text-3xl font-extrabold tracking-tight" aria-label={value}>{value}</p>
              <p className="text-[13px] font-medium text-white/55 text-wrap-balance">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Main page ───────────────────────────────────── */
export default function Home() {
  const nav = useNavigate()
  const [group, setGroup] = useState<Group | ''>('')
  const [loc, setLoc] = useState('')

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (group) p.set('group', group)
    if (loc) p.set('loc', loc)
    nav(`/find-donor?${p}`)
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative"
        style={{ background: 'linear-gradient(160deg, #fff 0%, #fdf4f6 60%, #fbeef1 100%)' }}
      >
        {/* Background texture blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full opacity-10 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #b91c3b 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-8 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #e8526e 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-28 lg:pt-20">
          {/* Text column — centered on mobile, left-aligned on desktop */}
          <div className="anim-rise text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-tint px-3.5 py-1.5 text-xs font-bold text-brand">
              <span className="size-2 rounded-full bg-brand anim-heartbeat" aria-hidden /> Voluntary donor coordination · Pune
            </span>
            <h1 className="text-[36px] font-black leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
              Find a donor.{' '}
              <span className="text-brand-gradient inline-block">
                Give someone hope.
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-subtle mx-auto max-w-sm lg:max-w-lg lg:text-lg lg:mx-0">
              Connect with willing blood donors and help coordinate blood requests when every moment matters.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <ButtonLink
                to="/request-blood"
                className="!min-h-12 !rounded-2xl !px-7 !text-base !font-bold"
                style={{ boxShadow: '0 8px 32px rgba(185,28,59,0.28)' }}
              >
                Request Blood
              </ButtonLink>
              <ButtonLink
                to="/find-donor"
                variant="secondary"
                className="!min-h-12 !rounded-2xl !px-7 !text-base !font-bold"
              >
                Find a Donor <ArrowRight size={16} className="ml-1" aria-hidden />
              </ButtonLink>
            </div>
            <p className="mt-5 flex items-start justify-center gap-2 text-[13px] text-subtle lg:justify-start">
              <Phone size={14} className="mt-0.5 shrink-0" aria-hidden />
              In a medical emergency, contact your hospital or local emergency services first.
            </p>
          </div>
          {/* SVG visual — hidden on mobile, shown on lg+ only */}
          <div className="hidden lg:block anim-rise delay-200">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ── Quick search ─────────────────────────────── */}
      <section className="mx-auto mt-6 max-w-6xl px-4 relative z-10 sm:px-5 lg:-mt-6" aria-labelledby="qs">
        <form
          onSubmit={go}
          className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:gap-5 sm:rounded-3xl sm:p-6 md:grid-cols-[1.3fr_1fr_auto] md:items-end md:p-8"
          style={{ boxShadow: '0 12px 48px rgb(18 21 30 / 0.10)' }}
        >
          <div>
            <h2 id="qs" className="mb-2.5 text-sm font-bold">Blood group</h2>
            <BloodChips value={group} onChange={setGroup} />
          </div>
          <div>
            <label htmlFor="q-loc" className="mb-2.5 block text-sm font-bold">Locality</label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
              <input
                id="q-loc" list="locs" value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="e.g. Kothrud"
                className={`${inputCls} !pl-10`}
              />
              <datalist id="locs">{Object.keys(LOCALITIES).map((l) => <option key={l} value={l} />)}</datalist>
            </div>
          </div>
          <Button type="submit" className="!min-h-12 md:!px-8 !rounded-xl">
            <Search size={16} aria-hidden /> Search donors
          </Button>
        </form>
      </section>

      {/* ── Stats bar ────────────────────────────────── */}
      <div className="mt-8 lg:mt-16">
        <StatsBar />
      </div>

      {/* ── How it works ─────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="how">
        {/* Section header */}
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-brand">How Aakif works</span>
          <h2 id="how" className="text-4xl font-black tracking-tight">Three steps. One life saved.</h2>
          <p className="mt-4 mx-auto max-w-md text-subtle leading-relaxed">
            Every request is reviewed by a person before donors are contacted. No anonymous requests.
          </p>
        </div>

        {/* Step cards — horizontal zig-zag */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: ClipboardList,
              step: '01',
              title: 'Tell us what you need',
              body: 'Share blood group, units, hospital and when it is needed. We ask only what is necessary.',
              accent: 'from-brand/10 to-brand/5',
            },
            {
              Icon: ShieldCheck,
              step: '02',
              title: 'We verify the request',
              body: 'Authorised staff check details with the hospital before any donor is contacted.',
              accent: 'from-brand/15 to-brand/8',
            },
            {
              Icon: HeartHandshake,
              step: '03',
              title: 'Donors respond',
              body: 'Nearby volunteers who opted in are contacted with consent. Screening happens at the hospital.',
              accent: 'from-brand/20 to-brand/10',
            },
          ].map(({ Icon, step, title, body, accent }, i) => (
            <div
              key={step}
              className={`group relative rounded-3xl bg-gradient-to-br ${accent} border border-brand/10 p-7 hover-lift anim-rise delay-${i * 100 + 100}`}
            >
              {/* Step number watermark */}
              <span
                className="absolute top-5 right-6 text-6xl font-black text-brand/8 select-none leading-none"
                aria-hidden
              >
                {step}
              </span>
              {/* Icon */}
              <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white shadow-card group-hover:bg-brand group-hover:shadow-brand transition-all duration-300">
                <Icon size={24} className="text-brand group-hover:text-white transition-colors duration-300" aria-hidden />
              </div>
              <h3 className="font-bold text-lg text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-subtle">{body}</p>
              {/* Connector dot for desktop */}
              {i < 2 && (
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 hidden size-7 items-center justify-center rounded-full bg-white border-2 border-brand/20 shadow-card md:flex" aria-hidden>
                  <ArrowRight size={12} className="text-brand" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Become a donor ───────────────────────────── */}
      <section
        className="relative py-24"
        style={{ background: 'linear-gradient(160deg, #fbeef1 0%, #fff 60%)' }}
        aria-labelledby="donate"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute right-0 top-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #b91c3b, transparent)' }}
          />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20">
          {/* Testimonial photo */}
          <div className="anim-rise order-2 lg:order-1">
            <div className="relative">
              {/* Decorative frame */}
              <div
                className="absolute -inset-3 rounded-[32px] opacity-30"
                style={{ background: 'linear-gradient(135deg, #b91c3b 0%, transparent 70%)' }}
                aria-hidden
              />
              <div className="relative rounded-3xl overflow-hidden shadow-pop">
                <img
                  src="/donor_testimonial.jpg"
                  alt="A smiling woman after donating blood, holding a red heart pillow, with a bandage on her arm"
                  className="w-full object-cover object-top"
                  style={{ maxHeight: '480px' }}
                  loading="lazy"
                />
                {/* Bottom gradient for quote legibility */}
                <div
                  className="absolute inset-x-0 bottom-0 h-40"
                  style={{ background: 'linear-gradient(to top, rgba(18,21,30,0.72) 0%, transparent 100%)' }}
                  aria-hidden
                />
                {/* Quote overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" aria-hidden />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">"The process was simple and the staff were incredibly kind."</p>
                  <p className="mt-1.5 text-[11px] text-white/65 font-medium">— Priya M., regular donor since 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="anim-rise delay-200 order-1 lg:order-2">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-brand">Donor registration</span>
            <h2 id="donate" className="text-4xl font-black tracking-tight leading-tight">
              Someone may need you today.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-subtle">
              Become a voluntary donor in two minutes. You choose when you are available, and you can pause alerts at any time.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                [UserCheck, 'Share only your name, blood group and general area'],
                [Lock, 'Your phone number is never shown to requesters'],
                [HeartHandshake, 'Registering is not a medical clearance — eligibility is decided at screening'],
              ].map(([I, t], i) => {
                const Ic = I as typeof Search
                return (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand-tint border border-brand/15">
                      <Ic size={15} className="text-brand" aria-hidden />
                    </span>
                    <span className="pt-0.5">{t as string}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/donor"
                className="!min-h-12 !rounded-2xl !px-7 !font-bold"
                style={{ boxShadow: '0 8px 32px rgba(185,28,59,0.24)' }}
              >
                Become a Donor
              </ButtonLink>
              <ButtonLink to="/donor" variant="tertiary" className="!min-h-12">Open donor portal</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upcoming donation camps ───────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="camps">
        {/* Camp image banner */}
        <div className="relative mb-10 rounded-3xl overflow-hidden shadow-pop hover-lift">
          <img
            src="/donation_camp.jpg"
            alt="A busy blood donation camp with nurses helping diverse donors in a community hall"
            className="w-full h-64 object-cover object-center"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(18,21,30,0.65) 0%, rgba(18,21,30,0.1) 100%)' }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center px-8">
            <div>
              <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-white/70">Community drives</span>
              <h2 id="camps" className="text-3xl font-black text-white tracking-tight">Upcoming donation camps</h2>
              <p className="mt-2 max-w-sm text-sm text-white/70">Attend with friends and family. Walk-ins welcome at most camps.</p>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <DemoTag>Sample camps</DemoTag>
          </div>
        </div>

        <ul className="space-y-3">
          {CAMPS.map((c, i) => {
            const pct = Math.round((c.booked / c.capacity) * 100)
            return (
              <li
                key={c.id}
                className={`camp-card flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:gap-6 anim-rise delay-${i * 100 + 100}`}
              >
                {/* Date badge */}
                <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
                  <span className="text-xl font-black leading-none">{new Date(c.date).getDate()}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                    {new Date(c.date).toLocaleString('en-GB', { month: 'short' })}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink truncate">{c.name}</h3>
                  <p className="text-sm text-subtle mt-0.5">{c.place} · {c.time}</p>
                  {/* Capacity bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-subtle tabular-nums">
                      {c.booked}/{c.capacity} spots
                    </span>
                  </div>
                </div>
                <ButtonLink to="/donor" variant="secondary" className="!min-h-10 !rounded-xl shrink-0">
                  <CalendarDays size={15} aria-hidden /> Register interest
                </ButtonLink>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Trust & verification ─────────────────────── */}
      <section
        className="relative overflow-hidden py-24"
        style={{ background: 'linear-gradient(160deg, #12151e 0%, #1a0d13 100%)' }}
        aria-labelledby="trust"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #b91c3b, transparent)' }}
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-brand">Our principles</span>
            <h2 id="trust" className="text-4xl font-black tracking-tight text-white">Trust, privacy and verification</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Reviewed by people', body: 'Authorised staff verify each request with the hospital before donors are contacted. No automated matching.' },
              { title: 'Consent first', body: 'Donors are contacted only through Aakif and only for requests they opt in to. No phone numbers are shown publicly.' },
              { title: 'Honest about limits', body: 'A match is a potential match. Aakif cannot guarantee availability, compatibility or eligibility.' },
            ].map(({ title, body }, i) => (
              <div
                key={title}
                className={`rounded-2xl border border-white/10 bg-white/5 p-6 hover-lift anim-rise delay-${i * 100 + 100}`}
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <div className="mb-4 size-10 rounded-xl bg-brand/20 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-brand" aria-hidden />
                </div>
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Notice tone="info">
              All donors, requests and camps in this prototype are fictional demo data. Aakif shows no live blood-stock information.
            </Notice>
          </div>
        </div>
      </section>
    </>
  )
}
