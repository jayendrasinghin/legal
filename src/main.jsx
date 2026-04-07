import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE_SHORT } from '../appMeta.js'
import './styles.css'
import { router } from './router.jsx'

document.title = `${APP_NAME} | seoi.in`
let metaDesc = document.querySelector('meta[name="description"]')
if (!metaDesc) {
  metaDesc = document.createElement('meta')
  metaDesc.setAttribute('name', 'description')
  document.head.appendChild(metaDesc)
}
metaDesc.setAttribute('content', APP_TAGLINE_SHORT)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
