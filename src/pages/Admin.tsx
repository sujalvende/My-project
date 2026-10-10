import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BarChart3, CalendarDays, ClipboardList, Droplets, LayoutDashboard, LockKeyhole, LogOut, Menu, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { CAMPS, DONORS, GROUPS, LOCALITIES, STATUS_LABEL, findMatches, fmtDate, type BloodRequest, type Status, type Urgency } from '../data'
import { useStore } from '../store'
import { Button, DemoTag, Drawer, Empty, Field, GroupTag, Modal, Notice, Pagination, StatusBadge, Timeline, UrgencyBadge, inputCls, DropMark } from '../ui'

type View = 'overview' | 'requests' | 'donors' | 'camps' | 'reports' | 'settings'
const NAV: [View, string, typeof Search][] = [
  ['overview', 'Overview', LayoutDashboard], ['requests', 'Blood Requests', ClipboardList], ['donors', 'Donors', Users],
  ['camps', 'Camps', CalendarDays], ['reports', 'Reports', BarChart3], ['settings', 'Settings', Settings],
]
const isOpen = (s: Status) => !['fulfilled', 'cancelled', 'expired'].includes(s)
const matchesFor = (r: BloodRequest) => findMatches({ group: r.group, origin: r.locality in LOCALITIES ? r.locality : 'Shivajinagar', maxKm: null, availableOnly: true, compatible: false })

function Login() {
  const { setAdminIn, toast } = useStore()
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-card">
        <div className="flex items-center gap-2"><DropMark /><span className="text-lg font-extrabold">Aakif Staff</span></div>
        <h1 className="mt-6 text-2xl font-extrabold">Sign in</h1>
        <p className="mt-1 text-sm text-subtle">Authorised staff only.</p>
        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); setAdminIn(true); toast('Signed in as Admin (prototype).', 'info') }}>
          <Field required label="Work email">{(p) => <input {...p} type="email" defaultValue="admin@aakif.example" className={inputCls} />}</Field>
          <Field required label="Password">{(p) => <input {...p} type="password" defaultValue="prototype-demo" className={inputCls} />}</Field>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
        <div className="mt-5"><Notice tone="warn" title="Prototype sign-in"><span>No real authentication. A production deployment must require verified staff accounts, role-based access and multi-factor sign-in. <Link to="/" className="font-bold text-brand underline">Back to site</Link></span></Notice></div>
      </div>
    </div>
  )
}

type Act = { to: Status; label: string; primary?: boolean; danger?: boolean }
function actionsFor(s: Status): Act[] {
  const a: Act[] = []
  if (s === 'submitted') a.push({ to: 'pending', label: 'Start verification', primary: true })
  if (s === 'pending') a.push({ to: 'verified', label: 'Verify request', primary: true })
  if (s === 'verified') a.push({ to: 'contacted', label: 'Mark donors contacted', primary: true })
  if (s === 'contacted') a.push({ to: 'fulfilled', label: 'Mark fulfilled', primary: true })
  if (isOpen(s)) a.push({ to: 'cancelled', label: 'Cancel request', danger: true }, { to: 'expired', label: 'Mark expired', danger: true })
  return a
}

function RequestPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const { requests, setStatus, addNote, toast, contacted, requestContact } = useStore()
  const r = requests.find((x) => x.id === id)
  const [pending, setPending] = useState<Act | null>(null)
  const [checks, setChecks] = useState([false, false])
  const [note, setNote] = useState('')
  if (!r) return null
  const matches = matchesFor(r).slice(0, 4)
  const acts = actionsFor(r.status)
  const needsChecks = pending?.to === 'verified'
  const canConfirm = !needsChecks || checks.every(Boolean)

  return (
    <Drawer open onClose={onClose} title={r.id} subtitle={<div className="flex items-center gap-3"><StatusBadge status={r.status} /><UrgencyBadge urgency={r.urgency} /></div>}>
      <div className="space-y-8">
        <section aria-labelledby="sum">
          <h3 id="sum" className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Request summary</h3>
          <div className="flex items-start gap-4 rounded-xl bg-soft p-4">
            <GroupTag g={r.group} size="lg" />
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[['Need', `${r.units} × ${r.component}`], ['Needed by', fmtDate(r.needBy)], ['Hospital', r.hospital], ['Area', r.locality], ['Requester', r.name], ['Contact', r.contact]].map(([k, v]) => <div key={k}><dt className="text-xs text-subtle">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>)}
            </dl>
          </div>
          {r.notes && <p className="mt-3 text-sm text-subtle"><strong className="text-ink">Requester notes:</strong> {r.notes}</p>}
        </section>

        <section aria-labelledby="stat">
          <h3 id="stat" className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Verification and status</h3>
          {(r.status === 'pending' || r.status === 'submitted') && (
            <fieldset className="mb-4 space-y-2 rounded-xl border border-line p-4">
              <legend className="px-1 text-sm font-bold">Verification checklist</legend>
              {['Hospital confirmed the requisition', 'Requester reached on the given contact'].map((t, i) => (
                <label key={t} className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="size-4.5 accent-brand" checked={checks[i]} onChange={(e) => setChecks(checks.map((c, j) => (j === i ? e.target.checked : c)))} />{t}</label>
              ))}
            </fieldset>
          )}
          {acts.length ? (
            <div className="flex flex-wrap gap-2">{acts.map((a) => <Button key={a.to} variant={a.primary ? 'primary' : a.danger ? 'danger' : 'secondary'} onClick={() => setPending(a)}>{a.label}</Button>)}</div>
          ) : <p className="text-sm text-subtle">This request is closed. No further status changes are available.</p>}
          <div className="mt-6"><Timeline req={r} /></div>
        </section>

        <section aria-labelledby="mt">
          <div className="mb-3 flex items-center justify-between"><h3 id="mt" className="text-sm font-bold uppercase tracking-wider text-subtle">Potential donor matches</h3><DemoTag /></div>
          {matches.length === 0 ? <p className="rounded-xl bg-soft p-4 text-sm text-subtle">No available donors with {r.group} nearby. Consider widening to compatible groups or contacting a blood bank.</p> : (
            <ul className="space-y-3">
              {matches.map((m) => (
                <li key={m.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-3">
                    <GroupTag g={m.group} size="sm" />
                    <div className="flex-1 text-sm"><p className="font-bold">{m.initials} · {m.locality} · ~{m.km} km</p></div>
                    <Button variant="secondary" className="!min-h-9 !px-3 !text-[13px]" disabled={contacted.includes(m.id) || !['verified', 'contacted'].includes(r.status)} onClick={() => { requestContact(m.id); toast(`Consent-based contact sent to donor ${m.initials}.`) }}>{contacted.includes(m.id) ? 'Contacted' : 'Contact'}</Button>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-subtle">{m.reason}</p>
                </li>
              ))}
            </ul>
          )}
          {!['verified', 'contacted'].includes(r.status) && matches.length > 0 && <p className="mt-2 text-xs text-subtle">Donors can be contacted once the request is verified.</p>}
        </section>

        <section aria-labelledby="nt">
          <h3 id="nt" className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Administrative notes</h3>
          {r.adminNotes.length > 0 && <ul className="mb-3 space-y-2">{r.adminNotes.map((n, i) => <li key={i} className="rounded-lg bg-soft px-3 py-2 text-sm">{n}</li>)}</ul>}
          <div className="flex gap-2">
            <input aria-label="Add a note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" className={inputCls} />
            <Button variant="secondary" disabled={!note.trim()} onClick={() => { addNote(r.id, note.trim()); setNote(''); toast('Note added.') }}>Add</Button>
          </div>
        </section>
      </div>

      <Modal open={!!pending} alert onClose={() => setPending(null)} title={pending ? `${pending.label}?` : ''}
        footer={<><Button variant="secondary" onClick={() => setPending(null)}>Go back</Button><Button disabled={!canConfirm} onClick={() => { if (!pending) return; setStatus(r.id, pending.to, `Admin: ${pending.label}`); toast(`${r.id} is now ${STATUS_LABEL[pending.to]}. Requester tracking updated.`); setPending(null); setChecks([false, false]) }}>Confirm</Button></>}>
        {pending && <p>{r.id} will change from <strong className="text-ink">{STATUS_LABEL[r.status]}</strong> to <strong className="text-ink">{STATUS_LABEL[pending.to]}</strong>. {pending.danger ? 'Donors will no longer be contacted. This cannot be undone.' : 'The requester will see the new status in tracking.'}</p>}
        {needsChecks && !checks.every(Boolean) && <p className="mt-3 font-semibold text-warn">Complete both checklist items before verifying.</p>}
      </Modal>
    </Drawer>
  )
}

function RequestsTable({ compact }: { compact?: boolean }) {
  const { requests } = useStore()
  const [, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const [ur, setUr] = useState('all')
  const [page, setPage] = useState(1)
  const per = 6
  const list = useMemo(() => requests.filter((r) => (st === 'all' || r.status === st) && (ur === 'all' || r.urgency === ur) && `${r.id} ${r.hospital} ${r.locality} ${r.group}`.toLowerCase().includes(q.toLowerCase())), [requests, q, st, ur])
  const pages = Math.max(1, Math.ceil(list.length / per))
  const cur = Math.min(page, pages)
  const rows = list.slice((cur - 1) * per, cur * per)
  const open = (id: string) => setParams({ request: id })
  void compact
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden /><input aria-label="Search requests" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search ID, hospital, locality" className={`${inputCls} !pl-10`} /></div>
        <select aria-label="Filter by status" value={st} onChange={(e) => { setSt(e.target.value); setPage(1) }} className={`${inputCls} md:!w-52`}><option value="all">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Filter by urgency" value={ur} onChange={(e) => { setUr(e.target.value); setPage(1) }} className={`${inputCls} md:!w-40`}><option value="all">All urgency</option>{(['Critical', 'Urgent', 'Planned'] as Urgency[]).map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      {rows.length === 0 ? <Empty icon={<Search size={20} />} title="No requests match" action={<Button variant="secondary" onClick={() => { setQ(''); setSt('all'); setUr('all') }}>Clear filters</Button>}>Adjust the search or filters.</Empty> : (
        <>
          <div className="hidden overflow-hidden rounded-card border border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wider text-subtle"><tr>{['Request', 'Group', 'Units', 'Locality', 'Urgency', 'Submitted', 'Status', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-soft/70">
                    <td className="px-4 py-3 font-mono text-[13px] font-bold">{r.id}</td>
                    <td className="px-4 py-3"><GroupTag g={r.group} size="sm" /></td>
                    <td className="px-4 py-3">{r.units}</td>
                    <td className="px-4 py-3"><span className="block max-w-[170px] truncate font-medium">{r.hospital}</span><span className="text-xs text-subtle">{r.locality}</span></td>
                    <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-subtle">{fmtDate(r.createdAt, true)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right"><Button variant="secondary" className="!min-h-9 !px-3" onClick={() => open(r.id)} aria-label={`Open ${r.id}`}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id}><button onClick={() => open(r.id)} className="flex w-full items-center gap-3 rounded-card border border-line p-4 text-left cursor-pointer hover:bg-soft">
                <GroupTag g={r.group} /><div className="min-w-0 flex-1"><p className="font-mono text-[13px] font-bold">{r.id} · {r.units}u</p><p className="truncate text-sm text-subtle">{r.hospital}, {r.locality}</p><div className="mt-1.5 flex flex-wrap items-center gap-2"><UrgencyBadge urgency={r.urgency} /><StatusBadge status={r.status} /></div></div>
              </button></li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-4"><Pagination page={cur} pages={pages} onChange={setPage} /></div>
    </div>
  )
}

function Overview({ go }: { go: (v: View) => void }) {
  const { requests, activity } = useStore()
  const [, setParams] = useSearchParams()
  const awaiting = requests.filter((r) => r.status === 'submitted' || r.status === 'pending')
  const active = requests.filter((r) => isOpen(r.status))
  const verifiedMatches = requests.filter((r) => r.status === 'verified' || r.status === 'contacted').reduce((n, r) => n + matchesFor(r).length, 0)
  const closed = requests.filter((r) => !isOpen(r.status))
  const tiles: [string, number, string][] = [['Awaiting verification', awaiting.length, 'text-warn'], ['Active requests', active.length, 'text-brand'], ['Potential donor matches (verified requests)', verifiedMatches, 'text-ink'], ['Closed requests', closed.length, 'text-subtle']]
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(([l, n, c]) => <div key={l} className="rounded-card border border-line p-4"><p className={`text-3xl font-extrabold ${c}`}>{n}</p><p className="mt-1 text-[13px] leading-snug text-subtle">{l}</p></div>)}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-bold">Awaiting verification</h2>
          {awaiting.length === 0 ? <Empty icon={<ShieldCheck size={20} />} title="All caught up">No requests are waiting for verification.</Empty> : (
            <ul className="divide-y divide-line rounded-card border border-line">
              {awaiting.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-4"><GroupTag g={r.group} size="sm" /><div className="min-w-0 flex-1"><p className="font-mono text-[13px] font-bold">{r.id}</p><p className="truncate text-sm text-subtle">{r.hospital}, {r.locality}</p></div><UrgencyBadge urgency={r.urgency} /><Button className="!min-h-9" onClick={() => setParams({ request: r.id })}>Review</Button></li>
              ))}
            </ul>
          )}
          <Button variant="tertiary" className="mt-2" onClick={() => go('requests')}>All requests →</Button>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent activity</h2>
          <ul className="space-y-3 border-l-2 border-line pl-4">
            {activity.slice(0, 7).map((a, i) => <li key={i} className="relative text-sm"><span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-brand" aria-hidden />{a.text}<span className="block text-xs text-subtle">{fmtDate(a.at, true)}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}

function DonorsView() {
  const [g, setG] = useState('all')
  const list = DONORS.filter((d) => g === 'all' || d.group === g)
  return (
    <div>
      <div className="mb-4 flex items-center gap-3"><select aria-label="Filter by blood group" value={g} onChange={(e) => setG(e.target.value)} className={`${inputCls} !w-44`}><option value="all">All groups</option>{GROUPS.map((x) => <option key={x}>{x}</option>)}</select><DemoTag>Fictional donors</DemoTag></div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-soft text-xs uppercase tracking-wider text-subtle"><tr>{['Donor', 'Group', 'Locality', 'Availability', 'Last donation'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{list.map((d) => <tr key={d.id}><td className="px-4 py-3 font-semibold">{d.initials} <span className="font-mono text-xs text-subtle">{d.id}</span></td><td className="px-4 py-3"><GroupTag g={d.group} size="sm" /></td><td className="px-4 py-3">{d.locality}</td><td className="px-4 py-3"><span className={`font-bold ${d.available ? 'text-ok' : 'text-subtle'}`}>{d.available ? '● Available' : '○ Unavailable'}</span></td><td className="px-4 py-3 text-subtle">{d.lastDonation}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function Camps() {
  return (
    <div className="space-y-4">
      <DemoTag>Sample camps</DemoTag>
      {CAMPS.map((c) => (
        <div key={c.id} className="rounded-card border border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{c.name}</h3><p className="text-sm text-subtle">{fmtDate(c.date)} · {c.time} · {c.place}</p><p className="text-xs text-subtle">{c.partner}</p></div><span className="text-sm font-bold">{c.booked} / {c.capacity} slots</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={c.booked} aria-valuemax={c.capacity} aria-label={`${c.name} slots booked`}><div className="h-full rounded-full bg-brand" style={{ width: `${(c.booked / c.capacity) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function Reports() {
  const { requests } = useStore()
  const counts = (Object.keys(STATUS_LABEL) as Status[]).map((s) => [s, requests.filter((r) => r.status === s).length] as const)
  const max = Math.max(1, ...counts.map((c) => c[1]))
  const week = [4, 7, 5, 9, 6, 8, 5]
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section><h2 className="mb-1 text-lg font-bold">Requests by status</h2><p className="mb-4 text-sm text-subtle">Live from this prototype session.</p>
        <ul className="space-y-3">{counts.map(([s, n]) => <li key={s} className="flex items-center gap-3 text-sm"><span className="w-40 shrink-0 font-medium">{STATUS_LABEL[s]}</span><div className="h-6 flex-1 rounded bg-soft"><div className="h-full rounded bg-brand" style={{ width: `${(n / max) * 100}%`, minWidth: n ? 6 : 0 }} /></div><span className="w-6 text-right font-bold">{n}</span></li>)}</ul>
      </section>
      <section><div className="mb-1 flex items-center gap-3"><h2 className="text-lg font-bold">Requests received per day</h2><DemoTag>Seeded demo</DemoTag></div><p className="mb-4 text-sm text-subtle">Illustrative values. No real outcomes are reported.</p>
        <div className="flex h-44 items-end gap-3" role="img" aria-label={`Seeded daily request counts: ${week.join(', ')}`}>{week.map((n, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs font-bold">{n}</span><div className="w-full rounded-t bg-ink" style={{ height: `${n * 14}px` }} /><span className="text-xs text-subtle">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span></div>)}</div>
      </section>
    </div>
  )
}

function SettingsView() {
  const { setAdminIn, toast } = useStore()
  return (
    <div className="max-w-2xl space-y-6">
      <Notice tone="warn" title="Access control (design note)">This area is not public in a real deployment. It requires staff accounts, role-based permissions (Admin, Verifier, Viewer), multi-factor sign-in and audit logs. The sign-in here is a simulation.</Notice>
      <div className="divide-y divide-line rounded-card border border-line text-sm">
        {[['Signed in as', 'admin@aakif.example (prototype)'], ['Role', 'Admin (simulated)'], ['Multi-factor', 'Required in production'], ['Audit log', 'Recent activity on Overview (demo)']].map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-3"><span className="text-subtle">{k}</span><span className="font-semibold">{v}</span></div>)}
      </div>
      <Button variant="secondary" onClick={() => { setAdminIn(false); toast('Signed out.', 'info') }}><LogOut size={15} aria-hidden /> Sign out</Button>
    </div>
  )
}

export default function Admin() {
  const { adminIn, setAdminIn, requests } = useStore()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>(params.get('request') ? 'overview' : 'overview')
  const [menu, setMenu] = useState(false)
  if (!adminIn) return <Login />
  const sel = params.get('request')
  const close = () => setParams({})
  const awaiting = requests.filter((r) => r.status === 'submitted' || r.status === 'pending').length
  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map(([k, l, I]) => (
        <button key={k} onClick={() => { setView(k); setMenu(false) }} aria-current={view === k ? 'page' : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold cursor-pointer ${view === k ? 'bg-brand-tint text-brand' : 'text-ink hover:bg-soft'}`}>
          <I size={17} aria-hidden /> {l}{k === 'requests' && awaiting > 0 && <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{awaiting}</span>}
        </button>
      ))}
    </nav>
  )
  const title = NAV.find((n) => n[0] === view)![1]
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-line bg-white p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2 pt-1"><DropMark /><span className="font-extrabold">Aakif <span className="text-subtle">Staff</span></span></Link>
        {nav}
        <div className="mt-auto space-y-3">
          <p className="flex items-start gap-2 rounded-xl bg-soft p-3 text-xs leading-relaxed text-subtle"><LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden /> Prototype session. Real access needs staff authentication.</p>
          <Button variant="tertiary" className="w-full !justify-start" onClick={() => setAdminIn(false)}><LogOut size={15} aria-hidden /> Sign out</Button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
          <span className="flex items-center gap-2 font-extrabold"><DropMark size={24} /> {title}</span>
          <button className="-mr-2 p-2 cursor-pointer" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && <div className="anim-rise border-b border-line bg-white p-3 md:hidden">{nav}<Link to="/" className="mt-2 block px-3 py-3 text-sm font-semibold text-subtle">← Public site</Link></div>}
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight"><Droplets className="hidden text-brand md:block" size={22} aria-hidden /> {title}</h1><DemoTag>Prototype · sample data</DemoTag></div>
          {view === 'overview' && <Overview go={setView} />}
          {view === 'requests' && <RequestsTable />}
          {view === 'donors' && <DonorsView />}
          {view === 'camps' && <Camps />}
          {view === 'reports' && <Reports />}
          {view === 'settings' && <SettingsView />}
        </div>
      </div>
      {sel && <RequestPanel id={sel} onClose={close} />}
    </div>
  )
}
