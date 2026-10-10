export const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export type Group = (typeof GROUPS)[number]

export type Status = 'submitted' | 'pending' | 'verified' | 'contacted' | 'fulfilled' | 'cancelled' | 'expired'
export type Urgency = 'Critical' | 'Urgent' | 'Planned'

export const STATUS_LABEL: Record<Status, string> = {
  submitted: 'Submitted',
  pending: 'Pending Verification',
  verified: 'Verified',
  contacted: 'Donors Contacted',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  expired: 'Expired',
}
export const FLOW: Status[] = ['submitted', 'pending', 'verified', 'contacted', 'fulfilled']

export type LogEntry = { status: Status; at: string; note?: string }
export type BloodRequest = {
  id: string
  name: string
  contact: string
  group: Group
  component: string
  units: number
  hospital: string
  locality: string
  needBy: string
  urgency: Urgency
  notes: string
  status: Status
  createdAt: string
  log: LogEntry[]
  adminNotes: string[]
}

export const LOCALITIES: Record<string, [number, number]> = {
  Shivajinagar: [0, 0],
  Kothrud: [-5, -3],
  Aundh: [-4, 4],
  Baner: [-5.5, 6],
  Wakad: [-10, 6],
  'Viman Nagar': [7, 4],
  Kharadi: [10, 5],
  Hadapsar: [9, -5],
  Kondhwa: [5, -8],
}

export type Donor = {
  id: string
  initials: string
  group: Group
  locality: string
  available: boolean
  confirmed: string
  lastDonation: string
}

export const DONORS: Donor[] = [
  { id: 'D01', initials: 'A. K.', group: 'O+', locality: 'Kothrud', available: true, confirmed: 'today, 9:10', lastDonation: '5 months ago' },
  { id: 'D02', initials: 'R. S.', group: 'O+', locality: 'Aundh', available: true, confirmed: 'yesterday', lastDonation: '8 months ago' },
  { id: 'D03', initials: 'M. P.', group: 'O-', locality: 'Baner', available: true, confirmed: 'today, 7:40', lastDonation: '6 months ago' },
  { id: 'D04', initials: 'S. D.', group: 'B+', locality: 'Viman Nagar', available: true, confirmed: 'today, 8:25', lastDonation: '4 months ago' },
  { id: 'D05', initials: 'N. J.', group: 'B+', locality: 'Kharadi', available: false, confirmed: '3 days ago', lastDonation: '2 months ago' },
  { id: 'D06', initials: 'T. G.', group: 'A+', locality: 'Shivajinagar', available: true, confirmed: 'today, 6:55', lastDonation: '9 months ago' },
  { id: 'D07', initials: 'P. V.', group: 'A+', locality: 'Hadapsar', available: true, confirmed: 'yesterday', lastDonation: '7 months ago' },
  { id: 'D08', initials: 'K. M.', group: 'A-', locality: 'Kothrud', available: true, confirmed: 'today, 10:02', lastDonation: '11 months ago' },
  { id: 'D09', initials: 'V. R.', group: 'AB+', locality: 'Wakad', available: true, confirmed: 'yesterday', lastDonation: '6 months ago' },
  { id: 'D10', initials: 'H. L.', group: 'AB+', locality: 'Baner', available: true, confirmed: 'today, 8:00', lastDonation: '5 months ago' },
  { id: 'D11', initials: 'J. C.', group: 'B-', locality: 'Kondhwa', available: true, confirmed: '2 days ago', lastDonation: '10 months ago' },
  { id: 'D12', initials: 'D. N.', group: 'AB-', locality: 'Aundh', available: false, confirmed: '5 days ago', lastDonation: '3 months ago' },
  { id: 'D13', initials: 'S. B.', group: 'O+', locality: 'Hadapsar', available: true, confirmed: 'today, 9:45', lastDonation: '12 months ago' },
  { id: 'D14', initials: 'F. Q.', group: 'O-', locality: 'Viman Nagar', available: false, confirmed: '4 days ago', lastDonation: '1 month ago' },
  { id: 'D15', initials: 'L. T.', group: 'A+', locality: 'Wakad', available: true, confirmed: 'yesterday', lastDonation: '8 months ago' },
]

export const COMPAT: Record<Group, Group[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': [...GROUPS],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
}

export function matchLocality(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  return Object.keys(LOCALITIES).find((l) => l.toLowerCase().includes(t) || t.includes(l.toLowerCase())) ?? null
}

export function distanceKm(a: string, b: string) {
  const [x1, y1] = LOCALITIES[a]
  const [x2, y2] = LOCALITIES[b]
  return Math.round(Math.hypot(x1 - x2, y1 - y2) * 10) / 10
}

export type Match = Donor & { km: number; reason: string; exact: boolean }

export function findMatches(o: {
  group: Group
  origin: string
  maxKm: number | null
  availableOnly: boolean
  compatible: boolean
}): Match[] {
  const allowed = o.compatible ? COMPAT[o.group] : [o.group]
  return DONORS.filter((d) => allowed.includes(d.group) && (!o.availableOnly || d.available))
    .map((d) => {
      const km = distanceKm(o.origin, d.locality)
      const exact = d.group === o.group
      const reason = exact
        ? `Same blood group (${d.group}) · ${d.available ? 'confirmed available' : 'currently unavailable'} · about ${km} km away`
        : `${d.group} is often compatible with ${o.group} red cells · about ${km} km away · a clinician must confirm`
      return { ...d, km, reason, exact }
    })
    .filter((d) => o.maxKm === null || d.km <= o.maxKm)
    .sort((a, b) => Number(b.exact) - Number(a.exact) || a.km - b.km)
}

export const CAMPS = [
  { id: 'C1', name: 'Kothrud Community Camp', place: 'Kothrud Community Hall', date: '2026-10-18', time: '9:00 am – 2:00 pm', partner: 'Sample partner: City Blood Centre', booked: 42, capacity: 80 },
  { id: 'C2', name: 'Baner Campus Drive', place: 'Baner Science College', date: '2026-10-25', time: '10:00 am – 4:00 pm', partner: 'Sample partner: Sahyadri Blood Bank', booked: 66, capacity: 120 },
  { id: 'C3', name: 'Hadapsar Neighbourhood Camp', place: 'Hadapsar Library Grounds', date: '2026-11-02', time: '8:30 am – 1:00 pm', partner: 'Sample partner: City Blood Centre', booked: 9, capacity: 60 },
]

export function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso)
  if (isNaN(+d)) return iso
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const L = (status: Status, at: string, note?: string): LogEntry => ({ status, at, note })
const mk = (r: Omit<BloodRequest, 'adminNotes' | 'log'> & { path: [Status, string][] }): BloodRequest => {
  const { path, ...rest } = r
  return { ...rest, log: path.map(([s, a]) => L(s, a)), adminNotes: [] }
}

export const SEED_REQUESTS: BloodRequest[] = [
  mk({ id: 'AKT-24018', name: 'Demo Requester One', contact: 'demo1@example.com', group: 'O-', component: 'Packed red cells', units: 2, hospital: 'Sample General Hospital', locality: 'Kothrud', needBy: '2026-10-11', urgency: 'Critical', notes: 'Surgery scheduled tomorrow morning.', status: 'verified', createdAt: '2026-10-10T08:12:00', path: [['submitted', '2026-10-10T08:12:00'], ['pending', '2026-10-10T08:14:00'], ['verified', '2026-10-10T08:40:00']] }),
  mk({ id: 'AKT-24017', name: 'Demo Requester Two', contact: '+91 90000 00002', group: 'B+', component: 'Whole blood', units: 1, hospital: 'Riverside Medical Centre', locality: 'Viman Nagar', needBy: '2026-10-12', urgency: 'Urgent', notes: '', status: 'pending', createdAt: '2026-10-10T07:30:00', path: [['submitted', '2026-10-10T07:30:00'], ['pending', '2026-10-10T07:33:00']] }),
  mk({ id: 'AKT-24015', name: 'Demo Requester Three', contact: 'demo3@example.com', group: 'A+', component: 'Platelets', units: 3, hospital: 'Sample Oncology Institute', locality: 'Shivajinagar', needBy: '2026-10-13', urgency: 'Urgent', notes: 'Recurring need over one week.', status: 'contacted', createdAt: '2026-10-09T18:05:00', path: [['submitted', '2026-10-09T18:05:00'], ['pending', '2026-10-09T18:08:00'], ['verified', '2026-10-09T19:00:00'], ['contacted', '2026-10-09T19:30:00']] }),
  mk({ id: 'AKT-24012', name: 'Demo Requester Four', contact: '+91 90000 00004', group: 'AB-', component: 'Plasma', units: 1, hospital: 'Lakeview Hospital', locality: 'Aundh', needBy: '2026-10-14', urgency: 'Planned', notes: '', status: 'pending', createdAt: '2026-10-09T14:20:00', path: [['submitted', '2026-10-09T14:20:00'], ['pending', '2026-10-09T14:22:00']] }),
  mk({ id: 'AKT-24009', name: 'Demo Requester Five', contact: 'demo5@example.com', group: 'O+', component: 'Packed red cells', units: 2, hospital: 'Sample General Hospital', locality: 'Hadapsar', needBy: '2026-10-09', urgency: 'Urgent', notes: '', status: 'fulfilled', createdAt: '2026-10-07T10:00:00', path: [['submitted', '2026-10-07T10:00:00'], ['pending', '2026-10-07T10:02:00'], ['verified', '2026-10-07T10:45:00'], ['contacted', '2026-10-07T11:10:00'], ['fulfilled', '2026-10-08T16:00:00']] }),
  mk({ id: 'AKT-24006', name: 'Demo Requester Six', contact: '+91 90000 00006', group: 'A-', component: 'Whole blood', units: 1, hospital: 'Riverside Medical Centre', locality: 'Kothrud', needBy: '2026-10-05', urgency: 'Planned', notes: '', status: 'expired', createdAt: '2026-10-03T09:00:00', path: [['submitted', '2026-10-03T09:00:00'], ['pending', '2026-10-03T09:03:00'], ['expired', '2026-10-06T00:00:00']] }),
  mk({ id: 'AKT-24004', name: 'Demo Requester Seven', contact: 'demo7@example.com', group: 'B-', component: 'Whole blood', units: 2, hospital: 'Lakeview Hospital', locality: 'Kondhwa', needBy: '2026-10-08', urgency: 'Urgent', notes: 'Requester arranged blood elsewhere.', status: 'cancelled', createdAt: '2026-10-02T12:00:00', path: [['submitted', '2026-10-02T12:00:00'], ['pending', '2026-10-02T12:04:00'], ['verified', '2026-10-02T12:50:00'], ['cancelled', '2026-10-03T08:00:00']] }),
]
