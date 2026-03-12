import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/index.css'

// Silent Auto-Recovery Script for Netlify "Black Screen" issue
// If a fatal crash occurs during the first 5 seconds, clear cache and reload once.
const STARTUP_THRESHOLD = 5000
const startTime = Date.now()

const handleFatalError = (event) => {
    const elapsed = Date.now() - startTime
    const isStartupCrash = elapsed < STARTUP_THRESHOLD
    const hasAttemptedRecovery = sessionStorage.getItem('recovery_attempted')

    if (isStartupCrash && !hasAttemptedRecovery) {
        console.error('[Fatal Error] Startup crash detected. Attempting auto-recovery...')
        sessionStorage.setItem('recovery_attempted', 'true')

        // Clear all Supabase related items (or just everything for total safety)
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                localStorage.removeItem(key)
            }
        })

        setTimeout(() => window.location.reload(), 100)
    }
}

window.addEventListener('error', handleFatalError)
window.addEventListener('unhandledrejection', handleFatalError)

// Clear recovery flag if app stays stable for 10 seconds
setTimeout(() => {
    sessionStorage.removeItem('recovery_attempted')
}, 10000)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
