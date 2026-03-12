import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Profile from './pages/Profile'
import Polls from './pages/Polls'
import CreatePoll from './pages/CreatePoll'
import PollDetail from './pages/PollDetail'
import Sessions from './pages/Sessions'
import CreateSession from './pages/CreateSession'
import SessionDetail from './pages/SessionDetail'
import UserProfile from './pages/UserProfile'
import Rankings from './pages/Rankings'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import { Languages, Calendar, Users, LogIn, LogOut, User, BarChart2, MessageCircle, Trophy, Menu, X, Home as HomeIcon, AlertCircle } from 'lucide-react'

function ProtectedRoute({ children, roleRequired }) {
    const { user, profile, loading } = useAuth()

    if (loading) return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    const location = useLocation()
    if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

    if (roleRequired && !roleRequired.includes(profile?.role)) {
        return <Navigate to="/" replace />
    }

    return children
}

function Layout() {
    const { user, profile } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const location = useLocation()

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans flex flex-col">
            {/* Global Connectivity Warning */}
            {window.supabase_config_error && (
                <div className="bg-red-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-pulse z-[100]">
                    <AlertCircle className="w-4 h-4" />
                    <span>CRITICAL: Database connection failed. Please check your Netlify Environment Variables.</span>
                </div>
            )}
            {/* Navigation */}
            <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Languages className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 group-hover:rotate-12 transition-transform" />
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-white">EIC Language Corner</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <NavLink to="/" icon={<HomeIcon className="w-4 h-4" />} label="Home" />
                        <NavLink to="/polls" icon={<BarChart2 className="w-4 h-4" />} label="Polls" />
                        <NavLink to="/sessions" icon={<Calendar className="w-4 h-4" />} label="Sessions" />
                        <NavLink to="/rankings" icon={<Trophy className="w-4 h-4" />} label="Rankings" />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Auth Section */}
                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-4 border-r border-neutral-800 pr-2 sm:pr-4">
                                <Link to="/profile" className="flex items-center gap-2 sm:gap-3 hover:bg-neutral-800/50 p-1 rounded-xl transition-all group">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-xs font-bold text-white leading-none group-hover:text-indigo-400">{profile?.full_name?.split(' ')[0] || user.email.split('@')[0]}</p>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <Link to="/login" state={{ from: location.pathname }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 mr-2">
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 md:hidden text-neutral-400 hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-neutral-800 bg-neutral-900 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
                        <MobileNavLink to="/" icon={<HomeIcon className="w-5 h-5" />} label="Home" onClick={() => setIsMenuOpen(false)} />
                        <MobileNavLink to="/polls" icon={<BarChart2 className="w-5 h-5" />} label="Polls" onClick={() => setIsMenuOpen(false)} />
                        <MobileNavLink to="/sessions" icon={<Calendar className="w-5 h-5" />} label="Sessions" onClick={() => setIsMenuOpen(false)} />
                        <MobileNavLink to="/rankings" icon={<Trophy className="w-5 h-5" />} label="Rankings" onClick={() => setIsMenuOpen(false)} />
                        {!user && (
                            <Link
                                to="/login"
                                state={{ from: location.pathname }}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl font-bold"
                            >
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </Link>
                        )}
                    </div>
                )}
            </nav>

            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    )
}

function Footer() {
    return (
        <footer className="border-t border-neutral-900 bg-neutral-950 py-10 mt-auto w-full">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Languages className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold tracking-tight">EIC Language Corner</span>
                </div>
                <p className="text-neutral-500 text-sm font-medium">
                    © 2026 - All Rights Reserved to <a href="https://adem-tachi.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-neutral-300 font-bold hover:text-indigo-400 transition-colors underline decoration-indigo-500/30 underline-offset-4">Adem Tachi</a>
                </p>
                <p className="text-neutral-600 text-[10px] uppercase tracking-[0.2em] mt-2">
                    Learn • Speak • Connect
                </p>
            </div>
        </footer>
    )
}

function Home() {
    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-32 flex flex-col items-center">
                <div className="text-center space-y-6 sm:space-y-8 max-w-4xl">
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-tight bg-gradient-to-r from-white via-white to-neutral-500 bg-clip-text text-transparent">
                        Exchange Languages.<br className="hidden sm:block" />Connect Cultures.
                    </h1>
                    <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Join the EIC Language Corner weekly sessions. Improve your language skills through conversation with fellow students in a premium, student-led environment.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 sm:pt-8 w-full sm:w-auto">
                        <Link to="/sessions" className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-neutral-200 transition-all transform hover:-translate-y-1 text-center">
                            Explore Sessions
                        </Link>
                        <Link to="/rankings" className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 px-10 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all text-neutral-300 text-center flex items-center justify-center gap-2">
                            <Trophy className="w-5 h-5 text-indigo-400" />
                            View Rankings
                        </Link>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-24 sm:mt-32 w-full text-center sm:text-left">
                    <FeatureCard
                        icon={<Calendar className="w-6 h-6 text-indigo-400" />}
                        title="Weekly Sessions"
                        description="Regular exchange sessions scheduled every week for various languages."
                    />
                    <FeatureCard
                        icon={<Users className="w-6 h-6 text-indigo-400" />}
                        title="Student Led"
                        description="Organized by students, for students. A friendly environment for everyone."
                    />
                    <FeatureCard
                        icon={<Languages className="w-6 h-6 text-indigo-400" />}
                        title="Multi-Language"
                        description="English, French, Arabic, and more. Choose what you want to practice."
                        className="sm:col-span-2 lg:col-span-1"
                    />
                </div>

                {/* Telegram Invite Banner */}
                <div className="mt-24 sm:mt-32 w-full">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <MessageCircle className="w-64 h-64 -rotate-12" />
                        </div>
                        <div className="relative z-10 space-y-4 text-center md:text-left">
                            <h2 className="text-3xl sm:text-4xl font-black text-white">Don't Miss any Session!</h2>
                            <p className="text-indigo-100/80 text-lg font-medium max-w-xl">
                                Join our official Telegram channel to receive instant notifications about new sessions, polls, and community updates.
                            </p>
                        </div>
                        <a
                            href="https://t.me/EIC_LC"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black hover:bg-neutral-100 transition-all flex items-center gap-3 shadow-lg hover:-translate-y-1 active:scale-95 whitespace-nowrap"
                        >
                            <MessageCircle className="w-5 h-5 fill-current" />
                            Join Channel
                        </a>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

function FeatureCard({ icon, title, description, className = "" }) {
    return (
        <div className={`p-8 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group ${className}`}>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-neutral-400 leading-relaxed">{description}</p>
        </div>
    )
}

function NavLink({ to, icon, label }) {
    return (
        <Link to={to} className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 p-2">
            {icon}
            <span className="text-sm font-bold tracking-wide">{label}</span>
        </Link>
    )
}

function MobileNavLink({ to, icon, label, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center gap-4 p-4 hover:bg-neutral-800 rounded-2xl transition-colors text-neutral-300 hover:text-white group border border-transparent hover:border-neutral-700"
        >
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-lg font-bold">{label}</span>
        </Link>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="polls" element={<Polls />} />
                        <Route path="polls/create" element={
                            <ProtectedRoute roleRequired={['organizer', 'admin']}>
                                <CreatePoll />
                            </ProtectedRoute>
                        } />
                        <Route path="polls/:id" element={<PollDetail />} />
                        <Route path="sessions" element={<Sessions />} />
                        <Route path="sessions/create" element={
                            <ProtectedRoute roleRequired={['organizer', 'admin']}>
                                <CreateSession />
                            </ProtectedRoute>
                        } />
                        <Route path="sessions/:id" element={<SessionDetail />} />
                        <Route path="profile/:id" element={<UserProfile />} />
                        <Route path="rankings" element={<Rankings />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}
