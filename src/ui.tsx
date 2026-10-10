import { useEffect, useId, useRef, useCallback, type ButtonHTMLAttributes, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, X, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { FLOW, GROUPS, STATUS_LABEL, fmtDate, type BloodRequest, type Group, type Status, type Urgency } from './data'
import { useStore } from './store'

export function DropMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2.5c4.6 6 9 10.6 9 16a9 9 0 1 1-18 0c0-5.4 4.4-10 9-16Z" fill="#B91C3B" />
      <circle cx="16" cy="19.5" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16" cy="19.5" r="1.3" fill="#fff" />
    </svg>
  )
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <DropMark />
      <span className={`text-[19px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>Aakif</span>
    </span>
  )
}

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger'
const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150 min-h-11 px-5 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer'
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-deep',
  secondary: 'bg-white text-ink border border-line hover:border-ink/40 hover:bg-soft',
  tertiary: 'text-brand hover:bg-brand-tint px-3',
  danger: 'bg-white text-brand border border-brand/40 hover:bg-brand-tint',
}
export const btn = (v: Variant = 'primary', extra = '') => `${base} ${variants[v]} ${extra}`

export function Button({ variant = 'primary', loading, children, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={btn(variant, className)}>
      {loading && <Loader2 size={16} className="animate-[spin_.8s_linear_infinite]" aria-hidden />}
      {children}
    </button>
  )
}
export function ButtonLink({ variant = 'primary', className = '', ...p }: LinkProps & { variant?: Variant }) {
  return <Link {...p} className={btn(variant, className)} />
}

export const inputCls =
  'w-full min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-subtle/70 transition-colors hover:border-ink/30 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-brand aria-[invalid=true]:bg-brand-tint/40'

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; required?: boolean; children: (p: { id: string; 'aria-describedby': string; 'aria-invalid': boolean }) => ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-brand" aria-hidden> *</span> : <span className="ml-1 font-normal text-subtle">(optional)</span>}
      </label>
      {children({ id, 'aria-describedby': `${id}-d`, 'aria-invalid': !!error })}
      <p id={`${id}-d`} className={`mt-1.5 flex items-start gap-1.5 text-[13px] ${error ? 'font-medium text-brand' : 'text-subtle'}`}>
        {error && <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden />}
        {error ?? hint}
      </p>
    </div>
  )
}

export function BloodChips({ value, onChange, label = 'Blood group', error }: { value: Group | ''; onChange: (g: Group) => void; label?: string; error?: string }) {
  const groupRef = useRef<HTMLDivElement>(null)

  const handleKey = useCallback((e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const btns = groupRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
    if (!btns) return
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      ? (idx + 1) % btns.length
      : (idx - 1 + btns.length) % btns.length
    btns[next].focus()
    onChange(GROUPS[next])
  }, [onChange])

  return (
    <div role="radiogroup" aria-label={label}>
      <div ref={groupRef} className="grid grid-cols-4 gap-2">
        {GROUPS.map((g, idx) => {
          const on = value === g
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on || (!value && idx === 0) ? 0 : -1}
              onClick={() => onChange(g)}
              onKeyDown={(e) => handleKey(e, idx)}
              className={`min-h-11 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand/50 hover:bg-brand-tint'}`}
            >
              {on && <Check size={13} className="mr-1 inline -mt-0.5" aria-hidden />}
              {g}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-brand">
          <XCircle size={14} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

const statusStyle: Record<Status, string> = {
  submitted: 'bg-soft text-ink border-line',
  pending: 'bg-warn-tint text-warn border-warn/30',
  verified: 'bg-ok-tint text-ok border-ok/30',
  contacted: 'bg-brand-tint text-brand-deep border-brand/30',
  fulfilled: 'bg-ok text-white border-ok',
  cancelled: 'bg-soft text-subtle border-line',
  expired: 'bg-soft text-subtle border-line',
}
const statusIcon: Record<Status, ReactNode> = {
  submitted: <Clock size={12} />,
  pending: <Clock size={12} />,
  verified: <CheckCircle2 size={12} />,
  contacted: <Info size={12} />,
  fulfilled: <Check size={12} />,
  cancelled: <X size={12} />,
  expired: <AlertTriangle size={12} />,
}
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[status]}`}>
      {statusIcon[status]}
      {STATUS_LABEL[status]}
    </span>
  )
}
export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const s = urgency === 'Critical' ? 'text-brand' : urgency === 'Urgent' ? 'text-warn' : 'text-subtle'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${s}`}>
      <span className={`size-2 ${urgency === 'Critical' ? 'rounded-full bg-brand' : urgency === 'Urgent' ? 'rotate-45 bg-warn' : 'rounded-sm border border-subtle'}`} aria-hidden />
      {urgency}
    </span>
  )
}

export function GroupTag({ g, size = 'md' }: { g: Group; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'size-14 text-lg' : size === 'sm' ? 'size-8 text-xs' : 'size-11 text-sm'
  return <span className={`inline-flex ${s} shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand-tint font-extrabold text-brand`}>{g}</span>
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm font-medium text-subtle">
      <Loader2 className="animate-[spin_.8s_linear_infinite] text-brand" size={20} aria-hidden /> {label}…
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-soft px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-card">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-subtle">{children}</div>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children: ReactNode }) {
  const t = { info: 'bg-soft border-line text-ink', warn: 'bg-warn-tint border-warn/30 text-ink', ok: 'bg-ok-tint border-ok/30 text-ink' }[tone]
  const Icon = tone === 'warn' ? AlertTriangle : tone === 'ok' ? CheckCircle2 : Info
  const c = tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-subtle'
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${t}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${c}`} aria-hidden />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? 'text-subtle' : ''}>{children}</div>
      </div>
    </div>
  )
}

export function DemoTag({ children = 'Demo data' }: { children?: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-subtle">{children}</span>
}

function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev }
  }, [onClose])
}

export function Modal({ open, onClose, title, children, footer, alert }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; alert?: boolean }) {
  if (!open) return null
  return <ModalInner onClose={onClose} title={title} footer={footer} alert={alert}>{children}</ModalInner>
}
function ModalInner({ onClose, title, children, footer, alert }: { onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; alert?: boolean }) {
  useEsc(onClose)
  const ref = useRef<HTMLDivElement>(null)
  const tid = useId()
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={tid} className="anim-rise max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-pop outline-none sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id={tid} className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-m-2 rounded-lg p-2 text-subtle hover:bg-soft cursor-pointer"><X size={18} /></button>
        </div>
        <div className="mt-3 text-sm leading-relaxed text-subtle">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode }) {
  if (!open) return null
  return <DrawerInner onClose={onClose} title={title} subtitle={subtitle}>{children}</DrawerInner>
}
function DrawerInner({ onClose, title, subtitle, children }: { onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode }) {
  useEsc(onClose)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 z-[60] bg-ink/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="anim-slide absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-pop outline-none">
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 className="text-lg font-extrabold">{title}</h2>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close panel" className="-m-2 rounded-lg p-2 text-subtle hover:bg-soft cursor-pointer"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="anim-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-pop">
          {t.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#4ade80]" aria-hidden /> : t.kind === 'error' ? <XCircle size={18} className="mt-0.5 shrink-0 text-[#fda4af]" aria-hidden /> : <Info size={18} className="mt-0.5 shrink-0" aria-hidden />}
          <span className="flex-1">{t.text}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-white/70 hover:text-white cursor-pointer"><X size={16} /></button>
        </div>
      ))}
    </div>
  )
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
      <span className="text-subtle">Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" className="!min-h-9 !px-3" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></Button>
        <Button variant="secondary" className="!min-h-9 !px-3" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></Button>
      </div>
    </nav>
  )
}

export function Timeline({ req }: { req: BloodRequest }) {
  const terminal = req.status === 'cancelled' || req.status === 'expired'
  const reached = (s: Status) => req.log.find((l) => l.status === s)
  const idx = FLOW.indexOf(req.status)
  const steps: { s: Status; label: string }[] = FLOW.slice(0, 4).map((s) => ({ s, label: STATUS_LABEL[s] }))
  steps.push(terminal ? { s: req.status, label: STATUS_LABEL[req.status] } : { s: 'fulfilled', label: 'Fulfilled / Closed' })
  return (
    <ol className="relative">
      {steps.map((st, i) => {
        const entry = reached(st.s)
        const done = !!entry
        const current = terminal ? i === steps.length - 1 : i === idx
        const last = i === steps.length - 1
        return (
          <li key={st.s} className="relative flex gap-4 pb-6 last:pb-0" aria-current={current ? 'step' : undefined}>
            {!last && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${done && !current ? 'bg-brand' : 'bg-line'}`} aria-hidden />}
            <span className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${terminal && last ? 'border-subtle bg-subtle text-white' : done ? 'border-brand bg-brand text-white' : 'border-line bg-white text-subtle'} ${current && !terminal ? 'ring-4 ring-brand/15' : ''}`}>
              {terminal && last ? <X size={14} /> : done ? <Check size={14} /> : i + 1}
            </span>
            <div className="-mt-0.5">
              <p className={`text-sm font-bold ${done || current ? 'text-ink' : 'text-subtle'}`}>
                {st.label}
                {current && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Current</span>}
              </p>
              <p className="text-[13px] text-subtle">{entry ? fmtDate(entry.at, true) : 'Not reached yet'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
