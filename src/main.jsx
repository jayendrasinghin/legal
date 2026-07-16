import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { bindRouterAnalytics } from './analytics.js'
import './styles.css'
import { router } from './router.jsx'

bindRouterAnalytics(router)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
