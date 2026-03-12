import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Calendar, Clock, MapPin, Globe, Users, ArrowLeft, CheckCircle2, AlertCircle, Trash2, Lock, Unlock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/AuthUI'
import { telegramService } from '../lib/telegramService'

export default function SessionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, profile } = useAuth()
    const [session, setSession] = useState(null)
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [toggling, setToggling] = useState(false)
    const [error, setError] = useState(null)

    const isRegistered = registrations.some(r => r.profile_id === user?.id)
    const isOrganizer = session?.organizer_id === user?.id || profile?.role === 'admin'

    useEffect(() => {
        fetchSessionDetails()
    }, [id])

    const fetchSessionDetails = async () => {
        const { data: sessionData, error: sError } = await supabase
            .from('sessions')
            .select(`
        *,
        organizer:profiles(full_name, avatar_icon)
      `)
            .eq('id', id)
            .single()

        if (sError) {
            setError('Session not found')
            setLoading(false)
            return
        }

        const { data: regData } = await supabase
            .from('registrations')
            .select(`
        *,
        profile:profiles(id, full_name, avatar_icon)
      `)
            .eq('session_id', id)

        setSession(sessionData)
        setRegistrations(regData || [])
        setLoading(false)
    }

    const handleRegister = async () => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } })
            return
        }

        if (!session.registration_open && !isRegistered) {
            alert('Registration is currently closed for this session.')
            return
        }

        setRegistering(true)
        try {
            if (isRegistered) {
                // Unregister
                const { error } = await supabase
                    .from('registrations')
                    .delete()
                    .eq('session_id', id)
                    .eq('profile_id', user.id)

                if (error) throw error
            } else {
                // Check capacity
                if (registrations.length >= session.max_participants) {
                    throw new Error('This session is full')
                }

                // Register
                const { error } = await supabase
                    .from('registrations')
                    .insert([{ session_id: id, profile_id: user.id }])

                if (error) throw error
            }
            fetchSessionDetails()
        } catch (err) {
            alert(err.message)
        } finally {
            setRegistering(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this session?')) return

        try {
            const { error } = await supabase
                .from('sessions')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error

            // Send Telegram Notification
            const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            await telegramService.sendSessionCancelledNotification(
                session.title,
                session.language,
                sessionDate
            )

            navigate('/sessions')
        } catch (err) {
            alert(err.message)
        }
    }

    const handleToggleRegistration = async () => {
        setToggling(true)
        try {
            const { error } = await supabase
                .from('sessions')
                .update({ registration_open: !session.registration_open })
                .eq('id', id)

            if (error) throw error
            const newStatus = !session.registration_open
            setSession(prev => ({ ...prev, registration_open: newStatus }))

            // Send Telegram Notification
            await telegramService.sendRegistrationToggledNotification(
                session.title,
                newStatus,
                id
            )
        } catch (err) {
            alert(err.message)
        } finally {
            setToggling(true)
            setToggling(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
    if (error || !session) return <div className="min-h-screen bg-neutral-950 text-center py-20">{error || 'Session not found'}</div>

    return (
        <div className="py-8 sm:py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between w-full">
                    <button
                        onClick={() => navigate('/sessions')}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Sessions
                    </button>
                    {isOrganizer && (
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={handleToggleRegistration}
                                disabled={toggling}
                                className={`flex items-center gap-2 text-sm font-bold p-2 px-4 rounded-xl transition-all ${session.registration_open ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}
                            >
                                {session.registration_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {session.registration_open ? 'Registration Open' : 'Registration Closed'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="text-red-500 hover:text-red-400 flex items-center gap-2 text-sm font-bold p-2 px-4 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Session
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8 w-full">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8 text-center sm:text-left flex flex-col items-center sm:items-start">
                        <div className="space-y-4">
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                <span className="bg-indigo-600/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{session.language}</span>
                                {registrations.length >= session.max_participants && !isRegistered && (
                                    <span className="bg-red-500/10 text-red-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Full</span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight text-white">{session.title}</h1>
                            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto sm:mx-0">{session.description || 'No description provided.'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                            <InfoCard icon={Calendar} label="Date" value={new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
                            <InfoCard icon={Clock} label="Time" value={new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
                            <InfoCard icon={MapPin} label="Location" value={session.location} />
                            <InfoCard icon={Users} label="Capacity" value={`${session.max_participants} Max`} />
                        </div>
                    </div>

                    {/* Action Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl space-y-6 shadow-2xl sticky top-24">
                            <div className="text-center space-y-1">
                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Registered Members</p>
                                <p className="text-4xl font-extrabold text-white">{registrations.length} <span className="text-lg text-neutral-600">/ {session.max_participants}</span></p>
                            </div>

                            <Button
                                onClick={handleRegister}
                                loading={registering}
                                disabled={!session.registration_open && !isRegistered}
                                className={`w-full ${isRegistered ? 'bg-neutral-800 hover:bg-neutral-700' : session.registration_open ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-neutral-800 opacity-50 cursor-not-allowed'}`}
                            >
                                {isRegistered ? 'Unregister from Session' : session.registration_open ? 'Join this Session' : 'Registration Closed'}
                            </Button>

                            {isRegistered && (
                                <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    You are registered!
                                </div>
                            )}

                            <div className="pt-6 border-t border-neutral-800">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Who's attending</p>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {registrations.map(reg => (
                                        <Link
                                            key={reg.id}
                                            to={`/profile/${reg.profile_id}`}
                                            className="flex items-center gap-2 group hover:bg-neutral-800/50 p-1.5 rounded-xl transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] text-indigo-400 group-hover:border-indigo-500 transition-all">
                                                {reg.profile?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm text-neutral-300 font-medium group-hover:text-white">{reg.profile?.full_name}</span>
                                            {reg.profile_id === session.organizer_id && (
                                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 rounded-full border border-indigo-500/20">Host</span>
                                            )}
                                        </Link>
                                    ))}
                                    {registrations.length === 0 && <p className="text-xs text-neutral-600 italic">No one yet. Be the first!</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
            </div>
            <p className="font-bold text-white text-sm">{value}</p>
        </div>
    )
}
