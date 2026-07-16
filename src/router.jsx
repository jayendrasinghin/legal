import { Navigate, createBrowserRouter } from 'react-router-dom'
import { PolicyPage } from './views/PolicyPage.jsx'
import { PromoPage } from './views/PromoPage.jsx'
import { SupportInboxPage } from './views/SupportInboxPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/support" replace />,
  },
  {
    path: '/privacy-policy',
    element: <PolicyPage slug="privacy-policy" />,
  },
  {
    path: '/support',
    element: <PromoPage />,
  },
  {
    path: '/support/admin',
    element: <SupportInboxPage />,
  },
  {
    path: '/help',
    element: <PolicyPage slug="support" />,
  },
  {
    path: '/faq',
    element: <PolicyPage slug="faq" />,
  },
])
