import { useState } from 'react'
import { BellOff, CalendarDays, CheckCircle2, HeartHandshake, MapPin, PencilLine, ShieldCheck, Trash2 } from 'lucide-react'
import { CAMPS, COMPAT, GROUPS, LOCALITIES, distanceKm, fmtDate, matchLocality, type Group } from '../data'
import { useStore, type DonorProfile } from '../store'
import { BloodChips, Button, DemoTag, Empty, Field, GroupTag, Modal, Notice, StatusBadge, UrgencyBadge, inputCls } from '../ui'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors cursor-pointer ${on ? 'bg-ok' : 'bg-[#9ca3af]'}`}>
      <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

function Registration() {
  const { setDonor, toast } = useStore()
  const [f, setF] = useState({ name: '', phone: '', code: '', group: '' as Group | '', city: 'Pune', locality: '', notify: 'sms' as DonorProfile['notify'], days: ['Sat', 'Sun'], consent: false })
  const [sent, setSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [er, setEr] = useState<Record<string, string>>({})
  const up = (k: string, v: unknown) => { setF((p) => ({ ...p, [k]: v })); setEr((e) => ({ ...e, [k]: '' })) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (f.name.trim().length < 2) x.name = 'Enter your name.'
    if (!verified) x.phone = 'Verify your contact first (prototype code: 123456).'
    if (!f.group) x.group = 'Choose your blood group.'
    if (!f.city.trim()) x.city = 'Enter your city.'
    if (!matchLocality(f.locality)) x.locality = `Choose a demo area, e.g. ${Object.keys(LOCALITIES).slice(0, 3).join(', ')}.`
    if (f.days.length === 0) x.days = 'Choose at least one day you can usually help.'
    if (!f.consent) x.consent = 'Consent is required to be contacted about requests.'
    setEr(x)
    if (Object.keys(x).length) return
    setDonor({ name: f.name.trim(), group: f.group as Group, city: f.city, locality: matchLocality(f.locality)!, notify: f.notify, available: true, pausedUntil: null, days: f.days, consent: true, visible: true })
    toast('Welcome to Aakif. Your donor profile is ready.')
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Someone may need you.</h1>
        <p className="mt-3 max-w-md leading-relaxed text-subtle">Register as a voluntary donor in a minute. We contact you only when a verified request nearby matches your blood group, and only if you are available.</p>
        <ol className="mt-8 space-y-5">
          {[['Register', 'Name, blood group, area and a verified contact.'], ['Stay in control', 'Set availability, pause alerts or leave at any time.'], ['Respond if you can', 'Say yes to a request. Screening happens at the hospital or blood bank.']].map(([t, d], i) => (
            <li key={t} className="flex gap-4"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span><div><p className="font-bold">{t}</p><p className="text-sm text-subtle">{d}</p></div></li>
          ))}
        </ol>
        <div className="mt-8"><Notice tone="warn" title="Registration is not medical clearance">Being registered or available does not mean you are eligible to donate. Eligibility is decided by trained staff at screening.</Notice></div>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className="text-subtle">Already registered?</span>
          <Button variant="tertiary" onClick={() => { setDonor({ name: 'Demo Donor', group: 'O+', city: 'Pune', locality: 'Kothrud', notify: 'sms', available: true, pausedUntil: null, days: ['Sat', 'Sun'], consent: true, demo: true, visible: true }); toast('Signed in as demo donor (prototype).', 'info') }}>Sign in as demo donor</Button>
        </div>
      </div>

      <form noValidate onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Donor registration</h2><DemoTag>Prototype sign-up</DemoTag></div>
        <Field required label="Full name" error={er.name} hint="Only your initials are ever shown to requesters.">{(p) => <input {...p} autoComplete="name" value={f.name} onChange={(e) => up('name', e.target.value)} className={inputCls} />}</Field>
        <Field required label="Mobile number" error={er.phone} hint={verified ? 'Verified.' : 'Prototype: any number works, code is 123456.'}>
          {(p) => (
            <div className="flex gap-2">
              <input {...p} type="tel" autoComplete="tel" value={f.phone} onChange={(e) => up('phone', e.target.value)} className={inputCls} disabled={verified} />
              {!verified && <Button type="button" variant="secondary" disabled={f.phone.replace(/\D/g, '').length < 10} onClick={() => { setSent(true); toast('Prototype: code 123456 "sent".', 'info') }}>Send code</Button>}
              {verified && <span className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-ok"><CheckCircle2 size={16} aria-hidden /> Verified</span>}
            </div>
          )}
        </Field>
        {sent && !verified && (
          <Field required label="Verification code" hint="Enter 123456">
            {(p) => (
              <div className="flex gap-2">
                <input {...p} inputMode="numeric" value={f.code} onChange={(e) => up('code', e.target.value)} className={`${inputCls} font-mono tracking-widest`} />
                <Button type="button" variant="secondary" onClick={() => f.code === '123456' ? (setVerified(true), setEr((e) => ({ ...e, phone: '' }))) : toast('Incorrect code. Use 123456 in this prototype.', 'error')}>Verify</Button>
              </div>
            )}
          </Field>
        )}
        <div><p className="mb-1.5 text-sm font-semibold">Blood group <span className="text-brand" aria-hidden>*</span></p><BloodChips value={f.group} onChange={(g) => up('group', g)} error={er.group} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field required label="City" error={er.city}>{(p) => <input {...p} value={f.city} onChange={(e) => up('city', e.target.value)} className={inputCls} />}</Field>
          <Field required label="Locality" error={er.locality} hint="General area only.">{(p) => <><input {...p} list="dl" value={f.locality} onChange={(e) => up('locality', e.target.value)} className={inputCls} /><datalist id="dl">{Object.keys(LOCALITIES).map((l) => <option key={l} value={l} />)}</datalist></>}</Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Preferred notification</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['sms', 'email', 'whatsapp'] as const).map((n) => (
              <label key={n} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold capitalize ${f.notify === n ? 'border-brand bg-brand-tint text-brand' : 'border-line hover:border-ink/40'}`}>
                <input type="radio" name="n" className="sr-only" checked={f.notify === n} onChange={() => up('notify', n)} />{n === 'sms' ? 'SMS' : n}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Days you can usually help <span className="text-brand" aria-hidden>*</span></legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => { const on = f.days.includes(d); return <button type="button" key={d} aria-pressed={on} onClick={() => up('days', on ? f.days.filter((x) => x !== d) : [...f.days, d])} className={`min-h-10 rounded-lg border px-3.5 text-sm font-semibold cursor-pointer ${on ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink/40'}`}>{d}</button> })}
          </div>
          {er.days && <p className="mt-1.5 text-[13px] font-medium text-brand">{er.days}</p>}
        </fieldset>
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-soft p-4 text-sm">
            <input type="checkbox" checked={f.consent} onChange={(e) => up('consent', e.target.checked)} className="mt-0.5 size-5 accent-brand" aria-invalid={!!er.consent} />
            <span>I voluntarily agree to be contacted about relevant blood requests. I understand that registering does not certify me as medically eligible, and I can pause or delete my profile at any time.</span>
          </label>
          {er.consent && <p className="mt-1.5 text-[13px] font-medium text-brand">{er.consent}</p>}
        </div>
        <Button type="submit" className="w-full !min-h-12">Create donor profile</Button>
      </form>
    </div>
  )
}

function Dashboard({ d }: { d: DonorProfile }) {
  const { setDonor, requests, toast } = useStore()
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [draft, setDraft] = useState(d)
  const [helped, setHelped] = useState<string[]>([])
  const paused = !!d.pausedUntil
  const live = d.available && !paused
  const upd = (p: Partial<DonorProfile>) => setDonor({ ...d, ...p })

  const nearby = requests
    .filter((r) => (r.status === 'verified' || r.status === 'contacted') && COMPAT[r.group].includes(d.group))
    .map((r) => ({ r, km: LOCALITIES[r.locality] ? distanceKm(d.locality, r.locality) : null }))
    .sort((a, b) => (a.km ?? 99) - (b.km ?? 99))
  const history = d.demo ? [['12 Mar 2026', 'City Blood Centre camp (sample)'], ['5 Nov 2025', 'Sample General Hospital (sample)']] : []
  const camp = CAMPS[0]

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-subtle">Donor portal {d.demo && <DemoTag>Prototype session</DemoTag>}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Welcome back, {d.name.split(' ')[0]}.</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setDraft(d); setEdit(true) }}><PencilLine size={15} aria-hidden /> Edit profile</Button>
          <Button variant="tertiary" onClick={() => { setDonor(null); toast('Signed out of prototype session.', 'info') }}>Sign out</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className={`rounded-2xl border p-6 ${live ? 'border-ok/40 bg-ok-tint' : 'border-line bg-soft'}`} aria-labelledby="av">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="av" className="text-lg font-bold">{live ? 'You are available' : paused ? 'Alerts paused' : 'You are unavailable'}</h2>
                <p className="mt-1 text-sm text-subtle">{live ? 'You may be contacted about matching verified requests.' : paused ? `No alerts until ${d.pausedUntil}.` : 'You will not appear in searches or receive alerts.'}</p>
              </div>
              <Switch on={d.available} label="Availability" onChange={(v) => { upd({ available: v, pausedUntil: null }); toast(v ? 'You are now marked available.' : 'You are now marked unavailable.', 'info') }} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/10 pt-4">
              <BellOff size={16} className="text-subtle" aria-hidden />
              <label className="text-sm font-semibold" htmlFor="pause">Pause alerts</label>
              <select id="pause" className={`${inputCls} !w-auto !min-h-10`} value={paused ? 'x' : ''} onChange={(e) => { const v = e.target.value; if (!v) return upd({ pausedUntil: null }); const dt = new Date(); dt.setDate(dt.getDate() + Number(v)); upd({ pausedUntil: fmtDate(dt.toISOString()) }); toast(`Alerts paused for ${v} days.`, 'info') }}>
                <option value="">Not paused</option><option value="7">For 7 days</option><option value="30">For 30 days</option><option value="90">For 90 days</option>
                {paused && <option value="x" disabled>Paused until {d.pausedUntil}</option>}
              </select>
            </div>
          </section>

          <Notice tone="info" title="Availability is not eligibility.">Registration shows you want to help. Availability shows you can help right now. Medical eligibility is only decided by qualified staff at screening.</Notice>

          <section aria-labelledby="req">
            <div className="mb-3 flex items-center justify-between"><h2 id="req" className="text-lg font-bold">Nearby requests you may help with</h2><DemoTag /></div>
            {!live ? <Empty icon={<BellOff size={20} />} title="Alerts are off">Turn availability on to see requests that match your blood group.</Empty>
              : nearby.length === 0 ? <Empty icon={<HeartHandshake size={20} />} title="No matching requests right now">We will notify you by {d.notify === 'sms' ? 'SMS' : d.notify} when a verified request needs your group.</Empty> : (
              <ul className="space-y-3">
                {nearby.map(({ r, km }) => (
                  <li key={r.id} className="flex flex-col gap-3 rounded-card border border-line p-4 sm:flex-row sm:items-center">
                    <GroupTag g={r.group} />
                    <div className="flex-1">
                      <p className="font-bold">{r.units} unit{r.units > 1 ? 's' : ''} · {r.component}</p>
                      <p className="text-sm text-subtle">{r.locality}{km !== null && ` · ~${km} km`} · by {fmtDate(r.needBy)}</p>
                      <div className="mt-1 flex items-center gap-3"><UrgencyBadge urgency={r.urgency} /><StatusBadge status={r.status} /></div>
                    </div>
                    <Button variant={helped.includes(r.id) ? 'secondary' : 'primary'} disabled={helped.includes(r.id)} onClick={() => { setHelped([...helped, r.id]); toast('Thank you. Staff will contact you to arrange screening.') }}>{helped.includes(r.id) ? 'Interest shared' : "I'm willing to help"}</Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="hist">
            <h2 id="hist" className="mb-3 text-lg font-bold">Donation history</h2>
            {history.length ? <ul className="divide-y divide-line rounded-card border border-line">{history.map(([a, b]) => <li key={a} className="flex justify-between gap-4 px-4 py-3 text-sm"><span className="font-semibold">{b}</span><span className="text-subtle">{a}</span></li>)}</ul>
              : <p className="rounded-xl bg-soft p-4 text-sm text-subtle">No donations recorded yet. History appears here after a hospital or camp confirms a donation.</p>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line p-5" aria-labelledby="prof">
            <h2 id="prof" className="sr-only">Profile</h2>
            <div className="flex items-center gap-4"><GroupTag g={d.group} size="lg" /><div><p className="font-bold">{d.name}</p><p className="flex items-center gap-1 text-sm text-subtle"><MapPin size={13} aria-hidden /> {d.locality}, {d.city}</p></div></div>
            <dl className="mt-5 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-subtle">Contact</dt><dd className="font-semibold text-ok">Verified (prototype)</dd></div><div className="flex justify-between"><dt className="text-subtle">Usual days</dt><dd className="font-semibold">{d.days.join(', ') || 'Not set'}</dd></div></dl>
          </section>

          <section className="rounded-2xl border border-line p-5">
            <h2 className="flex items-center gap-2 font-bold"><CalendarDays size={17} aria-hidden /> Upcoming camp</h2>
            <p className="mt-3 font-semibold">{camp.name}</p>
            <p className="text-sm text-subtle">{fmtDate(camp.date)} · {camp.time}<br />{camp.place}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => toast('Interest registered for the camp (demo).')}>Register interest</Button>
          </section>

          <section className="rounded-2xl border border-line p-5" aria-labelledby="notif">
            <h2 id="notif" className="font-bold">Notification preference</h2>
            <select aria-label="Notification method" className={`${inputCls} mt-3`} value={d.notify} onChange={(e) => { upd({ notify: e.target.value as DonorProfile['notify'] }); toast('Notification preference saved.') }}>
              <option value="sms">SMS</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option>
            </select>
          </section>

          <section className="rounded-2xl border border-line p-5" aria-labelledby="priv">
            <h2 id="priv" className="flex items-center gap-2 font-bold"><ShieldCheck size={17} aria-hidden /> Privacy and account</h2>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm"><span>Appear in donor searches (initials only)</span><Switch on={d.visible !== false} label="Appear in searches" onChange={(v) => upd({ visible: v })} /></div>
            <Button variant="danger" className="mt-5 w-full" onClick={() => setDel(true)}><Trash2 size={15} aria-hidden /> Delete my profile</Button>
          </section>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit profile" footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={() => { upd({ name: draft.name, group: draft.group, locality: draft.locality, days: draft.days, notify: draft.notify }); setEdit(false); toast('Profile updated.') }}>Save changes</Button></>}>
        <div className="space-y-4 text-ink">
          <Field required label="Name">{(p) => <input {...p} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />}</Field>
          <Field required label="Blood group">{(p) => <select {...p} value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value as Group })} className={inputCls}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select>}</Field>
          <Field required label="Locality">{(p) => <select {...p} value={draft.locality} onChange={(e) => setDraft({ ...draft, locality: e.target.value })} className={inputCls}>{Object.keys(LOCALITIES).map((g) => <option key={g}>{g}</option>)}</select>}</Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Days you can usually help</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => { const on = draft.days.includes(d); return <button type="button" key={d} aria-pressed={on} onClick={() => setDraft({ ...draft, days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d] })} className={`min-h-9 rounded-lg border px-3 text-sm font-semibold cursor-pointer ${on ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink/40'}`}>{d}</button> })}
            </div>
          </fieldset>
          <Field required label="Notification preference">{(p) => <select {...p} value={draft.notify} onChange={(e) => setDraft({ ...draft, notify: e.target.value as DonorProfile['notify'] })} className={inputCls}><option value="sms">SMS</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>}</Field>
        </div>
      </Modal>
      <Modal open={del} alert onClose={() => setDel(false)} title="Delete your donor profile?" footer={<><Button variant="secondary" onClick={() => setDel(false)}>Keep profile</Button><Button onClick={() => { setDel(false); setDonor(null); toast('Profile deleted (demo).', 'info') }}>Delete profile</Button></>}>
        You will stop receiving alerts and will no longer appear in searches. You can register again at any time.
      </Modal>
    </div>
  )
}

export default function DonorPortal() {
  const { donor } = useStore()
  return donor ? <Dashboard d={donor} /> : <Registration />
}
