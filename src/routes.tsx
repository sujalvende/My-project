import { createBrowserRouter } from 'react-router'
import Layout from './Layout'
import Home from './pages/Home'
import FindDonor from './pages/FindDonor'
import RequestBlood from './pages/RequestBlood'
import DonorPortal from './pages/DonorPortal'
import Admin from './pages/Admin'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'find-donor', Component: FindDonor },
      { path: 'request-blood', Component: RequestBlood },
      { path: 'donor', Component: DonorPortal },
      { path: 'admin', Component: Admin },
      { path: '*', Component: Home },
    ],
  },
])
