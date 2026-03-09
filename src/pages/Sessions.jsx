import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Calendar, MapPin, Globe, Users, ChevronRight, Search, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Sessions() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select(`
          *,
          organizer:profiles(full_name, avatar_icon),
          registrations(id)
        `)
                .eq('is_active', true)
                .order('date', { ascending: true })

            if (!error) setSessions(data)
            setLoading(false)
        }

        fetchSessions()
    }, [])

    const filteredSessions = sessions.filter(s =>
        s.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="py-8 sm:py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight">Language Sessions</h1>
                        <p className="text-neutral-400 font-medium">Join a weekly session and start talking</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search languages or sessions..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                            <Link
                                to="/sessions/create"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" /> Host Session
                            </Link>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 italic">
                        No sessions found. {searchTerm && "Try a different search term."}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredSessions.map(session => (
                            <Link
                                key={session.id}
                                to={`/sessions/${session.id}`}
                                className="group bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all flex flex-col gap-6 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="bg-indigo-600/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{session.language}</span>
                                        <h3 className="text-xl font-bold mt-2 leading-tight">{session.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-500 uppercase font-mono">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-sm font-bold text-white">{new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                        <span>{session.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                        <span>{session.registrations?.length || 0} / {session.max_participants} Participants</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-neutral-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] text-indigo-400">
                                            {session.organizer?.full_name?.charAt(0) || 'O'}
                                        </div>
                                        <span className="text-xs text-neutral-500">By {session.organizer?.full_name || 'Organizer'}</span>
                                    </div>
                                    <div className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
