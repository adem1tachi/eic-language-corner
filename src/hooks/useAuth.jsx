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
        // Check initial session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) await fetchProfile(currentUser.id)
            setLoading(false)
        }

        initSession()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                await fetchProfile(currentUser.id)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        // Supabase trigger should ideally create the profile, 
        // but for simplicity without DB triggers yet, we could do it here or assume a trigger exists.
        // In a real app, a DB function + trigger is best.
        return { data, error }
    }

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password })
    }

    const signOut = () => {
        return supabase.auth.signOut()
    }

    const updateProfile = async (updates) => {
        if (!user) throw new Error('No user logged in')
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date()
            })
            .eq('id', user.id)
            .select()
            .single()

        if (error) throw error
        setProfile(data)
        return { data, error }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
