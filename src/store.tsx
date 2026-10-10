import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { SEED_REQUESTS, STATUS_LABEL, type BloodRequest, type Status, type Group, type Urgency } from './data'

export type ToastMsg = { id: number; text: string; kind: 'success' | 'info' | 'error' }
export type DonorProfile = {
  name: string
  group: Group
  city: string
  locality: string
  notify: 'sms' | 'email' | 'whatsapp'
  available: boolean
  pausedUntil: string | null
  days: string[]
  consent: boolean
  demo?: boolean
  visible?: boolean
}
export type Activity = { text: string; at: string }

export type NewRequest = {
  name: string; contact: string; group: Group; component: string; units: number
  hospital: string; locality: string; needBy: string; urgency: Urgency; notes: string
}

type Store = {
  requests: BloodRequest[]
  activity: Activity[]
  addRequest: (r: NewRequest) => BloodRequest
  setStatus: (id: string, s: Status, note?: string) => void
  addNote: (id: string, text: string) => void
  toasts: ToastMsg[]
  toast: (text: string, kind?: ToastMsg['kind']) => void
  dismissToast: (id: number) => void
  donor: DonorProfile | null
  setDonor: (d: DonorProfile | null) => void
  contacted: string[]
  requestContact: (donorId: string) => void
  adminIn: boolean
  setAdminIn: (v: boolean) => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}

const now = () => new Date().toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<BloodRequest[]>(SEED_REQUESTS)
  const [activity, setActivity] = useState<Activity[]>([
    { text: 'AKT-24018 verified by Admin (demo)', at: '2026-10-10T08:40:00' },
    { text: 'AKT-24017 moved to Pending Verification', at: '2026-10-10T07:33:00' },
    { text: 'AKT-24015 donors contacted', at: '2026-10-09T19:30:00' },
  ])
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [donor, setDonor] = useState<DonorProfile | null>(null)
  const [contacted, setContacted] = useState<string[]>([])
  const [adminIn, setAdminIn] = useState(false)
  const seq = useRef(24019)
  const tid = useRef(0)

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((text: string, kind: ToastMsg['kind'] = 'success') => {
    const id = ++tid.current
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => dismissToast(id), 7000)
  }, [dismissToast])

  const log = useCallback((text: string) => setActivity((a) => [{ text, at: now() }, ...a].slice(0, 12)), [])

  const setStatus = useCallback((id: string, s: Status, note?: string) => {
    setRequests((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: s, log: [...r.log, { status: s, at: now(), note }] } : r)),
    )
    log(`${id} → ${STATUS_LABEL[s]}`)
  }, [log])

  const addRequest = useCallback((r: NewRequest) => {
    const id = `AKT-${seq.current++}`
    const t = now()
    const req: BloodRequest = { ...r, id, status: 'submitted', createdAt: t, log: [{ status: 'submitted', at: t }], adminNotes: [] }
    setRequests((rs) => [req, ...rs])
    log(`${id} submitted (${r.group}, ${r.units} unit${r.units > 1 ? 's' : ''})`)
    setTimeout(() => setStatus(id, 'pending'), 2500)
    return req
  }, [log, setStatus])

  const addNote = useCallback((id: string, text: string) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, adminNotes: [...r.adminNotes, text] } : r)))
  }, [])

  const requestContact = useCallback((d: string) => setContacted((c) => (c.includes(d) ? c : [...c, d])), [])

  const value = useMemo<Store>(
    () => ({ requests, activity, addRequest, setStatus, addNote, toasts, toast, dismissToast, donor, setDonor, contacted, requestContact, adminIn, setAdminIn }),
    [requests, activity, addRequest, setStatus, addNote, toasts, toast, dismissToast, donor, contacted, requestContact, adminIn],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
