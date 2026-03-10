import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input, Button } from '../components/AuthUI'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sent, setSent] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`
            })
            if (error) throw error
            setSent(true)
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
                        Forgot Password?
                    </h1>
                    <p className="text-neutral-400 font-medium">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                <div className="space-y-6 bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                    {sent ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">Check your inbox!</p>
                                <p className="text-neutral-400 text-sm mt-1">
                                    We sent a password reset link to <span className="text-indigo-400 font-semibold">{email}</span>.
                                </p>
                            </div>
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm mt-2">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <Input
                                icon={Mail}
                                label="Email Address"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Button type="submit" loading={loading}>
                                Send Reset Link
                            </Button>

                            <p className="text-center text-sm text-neutral-400">
                                Remember your password?{' '}
                                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                                    Sign In
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
