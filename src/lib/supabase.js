import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = '[Supabase] CRITICAL: Missing configuration! Check Netlify Environment Variables.'
    console.error(errorMsg)
    if (typeof window !== 'undefined') {
        // Log to console but don't crash the whole app immediately
        window.supabase_config_error = true
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: false, // Disables all local storage (localStorage/sessionStorage)
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
)

