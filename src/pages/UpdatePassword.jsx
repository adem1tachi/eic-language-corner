import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input, Button } from '../components/AuthUI'
import { supabase } from '../lib/supabase'

export default function UpdatePassword() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [done, setDone] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            return setError('Password must be at least 6 characters.')
        }
        if (password !== confirm) {
            return setError('Passwords do not match.')
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setDone(true)
            setTimeout(() => navigate('/'), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-950 relative">
            <button
                onClick={() => navigate('/login')}
                className="absolute top-8 left-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </button>

            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
                        Set New Password
                    </h1>
                    <p className="text-neutral-400 font-medium">
                        Choose a strong new password for your account.
                    </p>
                </div>

                <div className="space-y-6 bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                    {done ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">Password Updated!</p>
                                <p className="text-neutral-400 text-sm mt-1">
                                    Redirecting you to the homepage...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <Input
                                icon={Lock}
                                label="New Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <Input
                                icon={Lock}
                                label="Confirm New Password"
                                type="password"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />

                            <Button type="submit" loading={loading}>
                                Update Password
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
