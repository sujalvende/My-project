import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertTriangle, CheckCircle2, Lock, Search, ShieldAlert } from 'lucide-react'
import { STATUS_LABEL, fmtDate, type BloodRequest, type Group, type Status, type Urgency } from '../data'
import { useStore } from '../store'
import { BloodChips, Button, ButtonLink, DemoTag, Field, Modal, Notice, StatusBadge, Timeline, UrgencyBadge, inputCls } from '../ui'

const NEXT: Record<Status, string> = {
  submitted: 'We have received your request. It will move to verification in a moment.',
  pending: 'Aakif staff are verifying the details with the hospital. Keep your phone reachable.',
  verified: 'Your request is verified. We are preparing to reach out to potential donors with their consent.',
  contacted: 'Willing donors have been contacted. A staff member will update you as donors respond.',
  fulfilled: 'This request is closed as fulfilled. Thank you for keeping us informed.',
  cancelled: 'This request was cancelled. You can submit a new request at any time.',
  expired: 'The required-by date has passed, so this request expired. Submit a new request if you still need help.',
}

const today = () => new Date().toISOString().slice(0, 10)

type F = { name: string; contact: string; group: Group | ''; component: string; units: string; hospital: string; locality: string; needBy: string; urgency: Urgency | ''; notes: string; agree: boolean }
const empty: F = { name: '', contact: '', group: '', component: 'Whole blood', units: '1', hospital: '', locality: '', needBy: '', urgency: '', notes: '', agree: false }

function validate(f: F) {
  const e: Partial<Record<keyof F, string>> = {}
  if (f.name.trim().length < 2) e.name = 'Enter your name so staff know who to call.'
  if (!/^(\+?[\d\s-]{10,15}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(f.contact.trim())) e.contact = 'Enter a valid phone number (10+ digits) or email address.'
  if (!f.group) e.group = 'Choose the required blood group.'
  const u = Number(f.units)
  if (!Number.isInteger(u) || u < 1 || u > 10) e.units = 'Enter a whole number from 1 to 10.'
  if (!f.hospital.trim()) e.hospital = 'Enter the hospital or facility name.'
  if (!f.locality.trim()) e.locality = 'Enter the hospital area or city.'
  if (!f.needBy) e.needBy = 'Choose the date blood is needed by.'
  else if (f.needBy < today()) e.needBy = 'Required-by date cannot be in the past.'
  if (!f.urgency) e.urgency = 'Select how urgent this is.'
  if (!f.agree) e.agree = 'Please confirm you have read the privacy note.'
  return e
}

function Tracking({ req }: { req: BloodRequest }) {
  const { setStatus, toast } = useStore()
  const [confirm, setConfirm] = useState(false)
  const closed = ['fulfilled', 'cancelled', 'expired'].includes(req.status)
  return (
    <div className="anim-rise grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Request reference</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{req.id}</p>
            </div>
            <StatusBadge status={req.status} />
          </div>
          <p className="mt-4 rounded-xl bg-soft p-4 text-sm leading-relaxed" aria-live="polite">{NEXT[req.status]}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[['Blood group', req.group], ['Component', req.component], ['Units', String(req.units)], ['Needed by', fmtDate(req.needBy)], ['Hospital', req.hospital], ['Area', req.locality]].map(([k, v]) => (
              <div key={k}><dt className="text-[13px] text-subtle">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
            <div><dt className="text-[13px] text-subtle">Urgency</dt><dd><UrgencyBadge urgency={req.urgency} /></dd></div>
          </dl>
        </div>
        <Notice tone="warn" title="Submitting does not guarantee blood.">Aakif coordinates volunteer donors but cannot promise availability. For emergencies, contact your hospital's blood bank or emergency services now. Questions? Email help@aakif.example.</Notice>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to={`/admin?request=${req.id}`} variant="secondary">View in admin demo</ButtonLink>
          <ButtonLink to="/request-blood" variant="tertiary" reloadDocument={false}>New request</ButtonLink>
          {!closed && <Button variant="danger" onClick={() => setConfirm(true)}>Cancel request</Button>}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-5 text-lg font-bold">Request progress</h2>
        <Timeline req={req} />
        {req.status === 'submitted' && <p className="mt-5 text-xs text-subtle">Demo: status moves automatically in a few seconds. Staff can advance it in the admin demo.</p>}
      </div>
      <Modal open={confirm} alert onClose={() => setConfirm(false)} title="Cancel this request?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Keep request</Button><Button onClick={() => { setStatus(req.id, 'cancelled', 'Cancelled by requester'); setConfirm(false); toast(`${req.id} cancelled.`, 'info') }}>Yes, cancel</Button></>}>
        Donors will no longer be contacted for {req.id}. You can submit a new request later.
      </Modal>
    </div>
  )
}

export default function RequestBlood() {
  const { requests, addRequest, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [f, setF] = useState<F>(empty)
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [submitting, setSubmitting] = useState(false)
  const [lookup, setLookup] = useState('')
  const [lookupErr, setLookupErr] = useState('')
  const id = params.get('id')
  const tracked = id ? requests.find((r) => r.id === id) : undefined
  const set = <K extends keyof F>(k: K, v: F[K]) => { setF((p) => ({ ...p, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er = validate(f)
    setErrors(er)
    if (Object.keys(er).length) {
      toast('Please fix the highlighted fields.', 'error')
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    // Disable button immediately to prevent double-submission
    setSubmitting(true)
    setTimeout(() => {
      const r = addRequest({ name: f.name.trim(), contact: f.contact.trim(), group: f.group as Group, component: f.component, units: Number(f.units), hospital: f.hospital.trim(), locality: f.locality.trim(), needBy: f.needBy, urgency: f.urgency as Urgency, notes: f.notes.trim() })
      setF(empty)
      setParams({ id: r.id })
      toast(`Request ${r.id} submitted.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setSubmitting(false)
    }, 900)
  }

  const doLookup = (e: React.FormEvent) => {
    e.preventDefault()
    const q = lookup.trim().toUpperCase()
    if (!q) return setLookupErr('Enter a request ID such as AKT-24018.')
    if (!requests.some((r) => r.id === q)) return setLookupErr(`No demo request found for ${q}. Try AKT-24018.`)
    setLookupErr(''); setParams({ id: q })
  }

  const count = (keys: (keyof F)[]) => keys.every((k) => (typeof f[k] === 'string' ? (f[k] as string).trim() : f[k]))
  const steps = [
    ['Your details', count(['name', 'contact'])],
    ['Blood needed', count(['group', 'units'])],
    ['Hospital & timing', count(['hospital', 'locality', 'needBy', 'urgency'])],
  ] as const

  if (id) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Link to="/request-blood" className="text-sm font-semibold text-brand hover:underline">← Back to request form</Link>
        {tracked ? (
          <>
            <div className="mb-8 mt-4">
              <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight"><CheckCircle2 className="text-ok" size={32} aria-hidden /> Request received</h1>
              <p className="mt-2 text-subtle">Keep your reference ID. You can track progress here at any time.</p>
            </div>
            <Tracking req={tracked} />
          </>
        ) : (
          <div className="mt-6"><Notice tone="warn" title="Request not found">We could not find {id} in this demo.</Notice></div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Tell us what you need.</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-subtle">Fill in what you know. Staff verify each request with the hospital before any donor is contacted. It takes about two minutes.</p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-tint p-4 text-sm leading-relaxed">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <p><strong>In an emergency, contact your hospital or emergency services first.</strong> Aakif coordinates volunteers and cannot guarantee blood.</p>
          </div>

          {/* Section progress indicator — shows completion, not a wizard */}
          <div className="mt-8" aria-label="Form section completion">
            <ol className="flex gap-2 text-xs font-bold" aria-label="Form sections">
              {steps.map(([t, ok], i) => (
                <li key={t} className="flex-1">
                  <a href={`#step-${i + 1}`} className="block">
                    <div className={`h-1 rounded-full transition-colors ${ok ? 'bg-brand' : 'bg-line'}`} />
                    <p className={`mt-2 ${ok ? 'text-brand font-bold' : 'text-subtle'}`}>
                      {i + 1}. {t}
                      {ok && <span className="sr-only"> (complete)</span>}
                    </p>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-subtle">Progress updates as you fill in each section.</p>
          </div>

            <form noValidate onSubmit={submit} className="mt-6 space-y-10">
              <fieldset className="space-y-5" id="step-1">
                <legend className="mb-4 text-lg font-bold">1. Your details</legend>
                <Field required label="Your name" error={errors.name} hint="The person staff should speak to.">{(p) => <input {...p} autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />}</Field>
                <Field required label="Phone or email" error={errors.contact} hint="Only Aakif staff see this. It is never shown to donors.">{(p) => <input {...p} autoComplete="tel" value={f.contact} onChange={(e) => set('contact', e.target.value)} className={inputCls} />}</Field>
              </fieldset>

              <fieldset className="space-y-5" id="step-2">
                <legend className="mb-4 text-lg font-bold">2. Blood needed</legend>
                <div><p className="mb-1.5 text-sm font-semibold">Required blood group <span className="text-brand" aria-hidden>*</span></p><BloodChips value={f.group} onChange={(g) => set('group', g)} error={errors.group} /></div>
                <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                  <Field required label="Blood component" hint="As written on the doctor's requisition.">{(p) => <select {...p} value={f.component} onChange={(e) => set('component', e.target.value)} className={inputCls}>{['Whole blood', 'Packed red cells', 'Platelets', 'Plasma'].map((c) => <option key={c}>{c}</option>)}</select>}</Field>
                  <Field required label="Units" error={errors.units} hint="1 to 10">{(p) => <input {...p} type="number" inputMode="numeric" min={1} max={10} value={f.units} onChange={(e) => set('units', e.target.value)} className={inputCls} />}</Field>
                </div>
              </fieldset>

              <fieldset className="space-y-5" id="step-3">
                <legend className="mb-4 text-lg font-bold">3. Hospital and timing</legend>
                <Field required label="Hospital or medical facility" error={errors.hospital}>{(p) => <input {...p} value={f.hospital} onChange={(e) => set('hospital', e.target.value)} className={inputCls} />}</Field>
                <Field required label="Hospital locality or address" error={errors.locality} hint="Area or city is enough. No need for a full address.">{(p) => <input {...p} value={f.locality} onChange={(e) => set('locality', e.target.value)} className={inputCls} />}</Field>
                <Field required label="Required by" error={errors.needBy}>{(p) => <input {...p} type="date" min={today()} value={f.needBy} onChange={(e) => set('needBy', e.target.value)} className={inputCls} />}</Field>
                <div role="radiogroup" aria-label="Urgency">
                  <p className="mb-1.5 text-sm font-semibold">Urgency <span className="text-brand" aria-hidden>*</span></p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {([['Critical', 'Within 24 hours'], ['Urgent', 'Within a few days'], ['Planned', 'A week or more']] as [Urgency, string][]).map(([u, d]) => (
                      <button key={u} type="button" role="radio" aria-checked={f.urgency === u} onClick={() => set('urgency', u)} className={`min-h-14 rounded-xl border px-4 py-2 text-left transition-colors cursor-pointer ${f.urgency === u ? 'border-brand bg-brand-tint ring-1 ring-brand' : 'border-line hover:border-ink/40'}`}>
                        <span className="flex items-center gap-2 text-sm font-bold">{u}{f.urgency === u && <CheckCircle2 size={14} className="text-brand" aria-hidden />}</span>
                        <span className="text-[13px] text-subtle">{d}</span>
                      </button>
                    ))}
                  </div>
                  {errors.urgency && <p className="mt-1.5 text-[13px] font-medium text-brand">{errors.urgency}</p>}
                </div>
                <Field label="Additional notes" hint="Anything that helps staff, such as ward or doctor name. Avoid sharing medical history.">{(p) => <textarea {...p} rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} py-3`} />}</Field>
              </fieldset>

              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} aria-invalid={!!errors.agree} className="mt-0.5 size-5 accent-brand" />
                  <span>I understand Aakif uses these details only to verify and coordinate this request, and that submitting does not guarantee blood availability.</span>
                </label>
                {errors.agree && <p className="mt-1.5 text-[13px] font-medium text-brand">{errors.agree}</p>}
              </div>
              {Object.keys(errors).length > 0 && <div role="alert"><Notice tone="warn" title="Some fields need attention">Fix the highlighted fields and submit again.</Notice></div>}
              <Button type="submit" loading={submitting} className="!min-h-13 w-full sm:w-auto sm:!px-10 !text-base">Submit Blood Request</Button>
            </form>
        </div>

        <aside className="space-y-6 lg:pt-2">
          <div className="rounded-2xl border border-line bg-soft p-5">
            <h2 className="flex items-center gap-2 font-bold"><Lock size={16} aria-hidden /> Your privacy</h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">We collect the minimum needed. Contact details are visible only to authorised staff and are not shared with donors.</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <h2 className="font-bold">Track a request</h2>
            <p className="mt-1 text-sm text-subtle">Have a reference ID from your confirmation? Check its progress.</p>
            <form onSubmit={doLookup} className="mt-4 space-y-2" noValidate>
              <Field label="Request ID" error={lookupErr} hint="Format: AKT-NNNNN">{(p) => <input {...p} value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="AKT-24018" className={`${inputCls} font-mono`} />}</Field>
              <Button type="submit" variant="secondary" className="w-full"><Search size={15} aria-hidden /> Look up</Button>
            </form>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-subtle"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden /> Demo only. A real deployment would require sign-in or a one-time code sent to the requester before showing any request.</p>
          </div>
          <DemoTag>Prototype · no data leaves your browser</DemoTag>
        </aside>
      </div>
    </div>
  )
}
