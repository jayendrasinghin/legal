import { Navigate, createBrowserRouter } from 'react-router-dom'
import { PolicyPage } from './views/PolicyPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/privacy-policy" replace />,
  },
  {
    path: '/privacy-policy',
    element: <PolicyPage slug="privacy-policy" />,
  },
  {
    path: '/support',
    element: <PolicyPage slug="support" />,
  },
  {
    path: '/faq',
    element: <PolicyPage slug="faq" />,
  },
])
