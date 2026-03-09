import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { Input, Button } from '../components/AuthUI'
import { useAuth } from '../hooks/useAuth'
import { telegramService } from '../lib/telegramService'

export default function SignUp() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await signUp(email, password, fullName)
            if (error) throw error

            // Trigger Welcome Telegram Message (Non-blocking)
            telegramService.sendWelcomeMessage(fullName)

            navigate('/login', { state: { message: 'Account created! Please check your email and log in.' } })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-950 relative">
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </button>

            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">Join the Club</h1>
                    <p className="text-neutral-400 font-medium">Start your language exchange journey today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        icon={User}
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <Input
                        icon={Mail}
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        icon={Lock}
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" loading={loading}>
                        Create Account
                    </Button>

                    <p className="text-center text-sm text-neutral-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
