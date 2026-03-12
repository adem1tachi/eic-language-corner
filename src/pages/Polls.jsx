import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, ListFilter, Calendar, Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Polls() {
    const navigate = useNavigate()
    const { profile, user } = useAuth()
    const [polls, setPolls] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPolls = async () => {
            const { data, error } = await supabase
                .from('polls')
                .select(`
          *,
          organizer:profiles(full_name, avatar_icon)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (!error) setPolls(data)
            setLoading(false)
        }

        fetchPolls()
    }, [])

    return (
        <div className="py-8 sm:py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full gap-6 text-center sm:text-left">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Availability Polls</h1>
                        <p className="text-neutral-400 mt-2 font-medium">Help us schedule the next language corner</p>
                    </div>
                    {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                        <Link
                            to="/polls/create"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Create Poll
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : polls.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 italic">
                        No active polls at the moment.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {polls.map(poll => (
                            <Link
                                key={poll.id}
                                to={`/polls/${poll.id}`}
                                className="group bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-600 transition-all block relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{poll.language}</h3>
                                        <p className="text-neutral-400 text-sm mt-1">Organizer: {poll.organizer?.full_name}</p>
                                        <div className="flex items-center gap-4 mt-4 text-xs font-mono text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(poll.start_date).toLocaleDateString()} - {new Date(poll.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
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
