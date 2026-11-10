import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles/global.css'
import App from './App'
import { initAnalytics, withoutRef } from './lib/analytics'

initAnalytics() // visitor stats — live site only (see lib/analytics.js)
// the ?ref= tag has been read by now; don't leave it in the address bar to be copied on
const clean = withoutRef(window.location)
if (clean) window.history.replaceState(window.history.state, '', clean)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
