import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (err) {
            console.error('Error fetching profile:', err.message)
            setProfile(null)
        }
    }

    useEffect(() => {
        let isMounted = true
        // Safe timeout to prevent "infinite black screen" if Supabase hangs
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('[Auth] Startup timeout reached. Forcing loading to false.')
                setLoading(false)
            }
        }, 5000)

        // Check initial session
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error

                const currentUser = session?.user ?? null
                if (isMounted) setUser(currentUser)

                if (currentUser && isMounted) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('[Auth] Initialization error:', err.message)
            } finally {
                if (isMounted) {
                    setLoading(false)
                    clearTimeout(timeoutId)
                }
            }
        }

        initSession()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                const currentUser = session?.user ?? null
                if (isMounted) setUser(currentUser)

                if (currentUser && isMounted) {
                    await fetchProfile(currentUser.id)
                } else if (isMounted) {
                    setProfile(null)
                }
            } catch (err) {
                console.error('[Auth] State change error:', err.message)
            } finally {
                if (isMounted) setLoading(false)
            }
        })

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [])

    const signUp = async (email, password, fullName) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })
            return { data, error }
        } catch (err) {
            return { data: null, error: err }
        }
    }

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password })
    }

    const signOut = () => {
        // Clear potential stuck data on sign out
        setProfile(null)
        setUser(null)
        return supabase.auth.signOut()
    }

    const updateProfile = async (updates) => {
        if (!user) throw new Error('No user logged in')
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single()

            if (error) throw error
            setProfile(data)
            return { data, error }
        } catch (err) {
            console.error('[Auth] Update profile error:', err.message)
            throw err
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
            {loading ? (
                <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-neutral-500 font-medium animate-pulse">Initializing EIC Language Corner...</p>
                </div>
            ) : children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
