import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BadgeCheck, MapPin, RotateCcw, Search, SearchX, Send } from 'lucide-react'
import { LOCALITIES, findMatches, matchLocality, type Group, type Match } from '../data'
import { useStore } from '../store'
import { BloodChips, Button, ButtonLink, DemoTag, Empty, Field, GroupTag, Modal, Notice, Spinner, inputCls } from '../ui'

type Errors = { group?: string; loc?: string }

export default function FindDonor() {
  const [params] = useSearchParams()
  const { contacted, requestContact, toast } = useStore()
  const initGroup = (params.get('group') as Group) || ''
  const [group, setGroup] = useState<Group | ''>(initGroup)
  const [loc, setLoc] = useState(params.get('loc') ?? '')
  const [dist, setDist] = useState('any')
  const [availOnly, setAvailOnly] = useState(true)
  const [compat, setCompat] = useState(false)
  const [sort, setSort] = useState('nearest')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Match[] | null>(null)
  const [origin, setOrigin] = useState('Shivajinagar')
  const [target, setTarget] = useState<Match | null>(null)
  const [consent, setConsent] = useState(false)
  const timer = useRef<number>(0)

  const run = (g = group, l = loc, c = compat, a = availOnly, d = dist) => {
    const e: Errors = {}
    if (!g) e.group = 'Choose the blood group you are looking for.'
    const m = matchLocality(l)
    if (l.trim() && !m) e.loc = `No demo area matches "${l}". Try ${Object.keys(LOCALITIES).slice(0, 3).join(', ')}.`
    setErrors(e)
    if (e.group || e.loc) return
    const o = m ?? 'Shivajinagar'
    setOrigin(o)
    setLoading(true)
    setResults(null)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setResults(findMatches({ group: g as Group, origin: o, maxKm: d === 'any' ? null : Number(d), availableOnly: a, compatible: c }))
      setLoading(false)
    }, 700)
  }
  useEffect(() => {
    if (initGroup) run()
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = () => {
    setGroup(''); setLoc(''); setDist('any'); setAvailOnly(true); setCompat(false); setErrors({}); setResults(null); setSort('nearest')
  }
  const shown = results && [...results].sort((a, b) => (sort === 'nearest' ? Number(b.exact) - Number(a.exact) || a.km - b.km : Number(b.available) - Number(a.available) || a.km - b.km))

  const send = () => {
    if (!target) return
    requestContact(target.id)
    toast(`Contact request sent to donor ${target.initials}. They will choose whether to reply.`)
    setTarget(null); setConsent(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight">Find a blood donor.</h1>
        <p className="mt-3 leading-relaxed text-subtle">Search volunteer donors who have confirmed availability. Results are potential matches only. A hospital or blood bank confirms medical suitability.</p>
      </div>

      <form noValidate onSubmit={(e) => { e.preventDefault(); run() }} className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold">Blood group <span className="text-brand" aria-hidden>*</span></p>
            <BloodChips value={group} onChange={setGroup} error={errors.group} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City or locality" hint="Demo area: Pune. Leave empty for city centre." error={errors.loc}>
              {(p) => (
                <div className="relative">
                  <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
                  <input {...p} list="areas" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Baner" className={`${inputCls} !pl-10`} />
                  <datalist id="areas">{Object.keys(LOCALITIES).map((l) => <option key={l} value={l} />)}</datalist>
                </div>
              )}
            </Field>
            <Field label="Distance" hint="Approximate, from the area centre.">
              {(p) => (
                <select {...p} value={dist} onChange={(e) => setDist(e.target.value)} className={inputCls}>
                  <option value="any">Any distance</option><option value="5">Within 5 km</option><option value="10">Within 10 km</option><option value="20">Within 20 km</option>
                </select>
              )}
            </Field>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex min-h-6 cursor-pointer items-center gap-2.5 text-sm font-medium"><input type="checkbox" checked={availOnly} onChange={(e) => setAvailOnly(e.target.checked)} className="size-4.5 accent-brand" /> Only donors who confirmed availability</label>
            <label className="flex min-h-6 cursor-pointer items-center gap-2.5 text-sm font-medium"><input type="checkbox" checked={compat} onChange={(e) => setCompat(e.target.checked)} className="size-4.5 accent-brand" /> Include commonly compatible groups</label>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="tertiary" onClick={reset}><RotateCcw size={15} aria-hidden /> Clear filters</Button>
            <Button type="submit" loading={loading} className="flex-1 lg:flex-none lg:!px-8"><Search size={16} aria-hidden /> Search</Button>
          </div>
        </div>
      </form>

      <section className="mt-8" aria-live="polite" aria-busy={loading}>
        {loading && <Spinner label="Searching demo donors" />}
        {!loading && !results && (
          <p className="rounded-xl bg-soft px-5 py-10 text-center text-sm text-subtle">Choose a blood group and press Search to see potential matches.</p>
        )}
        {shown && !loading && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{shown.length} potential {shown.length === 1 ? 'match' : 'matches'}</h2>
                <DemoTag>Demo data</DemoTag>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-subtle">Sort
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputCls} !min-h-10 !w-auto !py-0`} aria-label="Sort results">
                  <option value="nearest">Nearest first</option><option value="avail">Available first</option>
                </select>
              </label>
            </div>
            <p className="mb-4 text-[13px] text-subtle">Filtered by blood group{availOnly ? ' and confirmed availability' : ''}, then ranked by approximate distance from {origin}. Exact locations are never shown.</p>
            {shown.length === 0 ? (
              <Empty icon={<SearchX size={22} />} title="No potential donors found" action={<><Button variant="secondary" onClick={() => { setCompat(true); setAvailOnly(false); setDist('any'); run(group, loc, true, false, 'any') }}>Widen the search</Button><ButtonLink to="/request-blood">Submit a blood request</ButtonLink></>}>
                Try a wider distance or include compatible groups. If it is urgent, contact an authorised blood bank or your hospital directly. They hold screened stock, which volunteer donors cannot replace.
              </Empty>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {shown.map((d) => {
                  const sent = contacted.includes(d.id)
                  return (
                    <li key={d.id} className="anim-rise flex flex-col gap-4 rounded-card border border-line bg-white p-5 transition-shadow hover:shadow-card">
                      <div className="flex items-center gap-4">
                        <GroupTag g={d.group} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">Donor {d.initials} <span className="text-xs font-medium text-subtle">(fictional)</span></p>
                          <p className="flex items-center gap-1 text-sm text-subtle"><MapPin size={13} aria-hidden /> {d.locality} · ~{d.km} km</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${d.available ? 'bg-ok-tint text-ok' : 'bg-soft text-subtle'}`}>
                          {d.available && <BadgeCheck size={13} aria-hidden />}{d.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="rounded-lg bg-soft px-3 py-2 text-[13px] leading-relaxed text-subtle"><span className="font-bold text-ink">Why this match: </span>{d.reason}. Confirmed {d.confirmed}.</p>
                      <Button
                        variant={sent ? 'secondary' : 'primary'}
                        disabled={sent || !d.available}
                        onClick={() => setTarget(d)}
                        className="self-start"
                        aria-disabled={sent || !d.available}
                        aria-label={sent ? 'Contact request already sent' : !d.available ? `Donor ${d.initials} is not accepting requests right now` : `Request contact with donor ${d.initials}`}
                      >
                        <Send size={15} aria-hidden />
                        {sent ? 'Contact request sent' : d.available ? 'Request contact' : 'Not accepting requests'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>

      <div className="mt-10"><Notice tone="warn" title="Need blood urgently?">Call your hospital's blood bank or emergency services. <Link to="/request-blood" className="font-bold text-brand underline">Submit a request</Link> so Aakif staff can help coordinate. A match is not a guarantee of compatibility, eligibility or availability.</Notice></div>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Request contact with donor ${target?.initials ?? ''}`}
        footer={<><Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button><Button disabled={!consent} onClick={send}>Send request</Button></>}>
        <p>Aakif passes your request to the donor. They decide whether to respond. Their phone number and exact location are never shared with you.</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-ink">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4.5 accent-brand" />
          <span className="text-sm">I understand this is a potential match only, and that medical suitability will be confirmed by a hospital or blood bank.</span>
        </label>
      </Modal>
    </div>
  )
}
