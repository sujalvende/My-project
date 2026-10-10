import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Menu, X, Heart } from 'lucide-react'
import { ButtonLink, Logo, Toasts } from './ui'

const links = [
  { to: '/find-donor', label: 'Find a Donor' },
  { to: '/request-blood', label: 'Request Blood' },
  { to: '/donor', label: 'Become a Donor' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cls = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'text-brand bg-brand-tint'
        : 'text-ink hover:bg-soft hover:text-brand'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-line bg-white/95 shadow-sm backdrop-blur-md'
          : 'bg-white/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
        <Link to="/" aria-label="Aakif home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>
          ))}
          <a
            href="/#about"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-subtle transition-all duration-200 hover:bg-soft hover:text-brand"
          >
            About
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <ButtonLink
            to="/request-blood"
            className="!min-h-10 !rounded-xl !px-4 !font-bold hidden sm:inline-flex"
            style={{ boxShadow: '0 4px 16px rgba(185,28,59,0.22)' }}
          >
            Request Blood
          </ButtonLink>
          <button
            className="-mr-1 rounded-xl p-2 text-ink hover:bg-soft transition-colors md:hidden cursor-pointer"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="anim-rise-sm border-t border-line bg-white px-5 py-3 md:hidden">
          {[{ to: '/', label: 'Home' }, ...links].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                `block rounded-xl px-3.5 py-3 text-base font-semibold transition-colors ${
                  isActive ? 'bg-brand-tint text-brand' : 'hover:bg-soft'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a href="/#about" className="block px-3.5 py-3 text-base text-subtle">About</a>
          <div className="mt-2 pb-1">
            <ButtonLink to="/request-blood" className="w-full !justify-center !rounded-xl !font-bold">
              Request Blood
            </ButtonLink>
          </div>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer id="about" className="border-t border-line" style={{ background: 'linear-gradient(180deg, #f8f7f9 0%, #fff 100%)' }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 text-sm font-bold text-ink">Every drop connects a life.</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
            Aakif helps coordinate blood requests and reach willing volunteer donors. It is not a hospital or blood bank.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-xs text-subtle">
            <span>Made with</span>
            <Heart size={12} className="fill-brand text-brand" aria-hidden />
            <span>for community health</span>
          </div>
        </div>
        <FooterCol title="Aakif" items={[['About', '/#about'], ['Contact', 'mailto:help@aakif.example'], ['Staff sign-in (demo)', '/admin']]} />
        <FooterCol title="Use Aakif" items={[['Find a Donor', '/find-donor'], ['Request Blood', '/request-blood'], ['Become a Donor', '/donor']]} />
        <FooterCol title="Legal" items={[['Privacy', '#'], ['Terms', '#']]} />
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs leading-relaxed text-subtle">
          Prototype for demonstration. All donors, requests, camps and partners shown are fictional sample data. Aakif does not guarantee blood availability, donor compatibility or medical eligibility. In an emergency, contact your hospital or local emergency services immediately.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-subtle">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm font-medium">
        {items.map(([l, h]) => (
          <li key={l}>
            {h.startsWith('/') && !h.includes('#')
              ? <Link className="transition-colors hover:text-brand" to={h}>{l}</Link>
              : <a className="transition-colors hover:text-brand" href={h}>{l}</a>
            }
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const admin = pathname.startsWith('/admin')
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      {!admin && <Header />}
      <main className="flex-1"><Outlet /></main>
      {!admin && <Footer />}
      <Toasts />
    </div>
  )
}
