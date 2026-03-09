import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { Input, Button } from '../components/AuthUI'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [successMessage, setSuccessMessage] = useState(location.state?.message || null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await signIn(email, password)
            if (error) throw error
            navigate('/')
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
                    <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">Welcome Back</h1>
                    <p className="text-neutral-400 font-medium">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {successMessage && !error && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm italic">
                            {successMessage}
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
                        Sign In
                    </Button>

                    <p className="text-center text-sm text-neutral-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
