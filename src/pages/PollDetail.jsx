import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Clock, Info, Check, Save, ArrowLeft, BarChart3, Users, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/AuthUI'
import { telegramService } from '../lib/telegramService'

export default function PollDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, profile } = useAuth()
    const [poll, setPoll] = useState(null)
    const isOrganizer = poll?.organizer_id === user?.id || profile?.role === 'admin'
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedSlots, setSelectedSlots] = useState([])
    const [results, setResults] = useState({})
    const [totalRespondents, setTotalRespondents] = useState(0)

    // 1.5h logic: 10:00 to 22:00 start times (last ends at 23:30 or 23:00)
    const TIMES = [
        '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30', '22:00'
    ]

    const getDatesInRange = (start, end) => {
        const dates = []
        let current = new Date(start)
        const last = new Date(end)
        while (current <= last) {
            dates.push(new Date(current).toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
        }
        return dates
    }

    useEffect(() => {
        const fetchPollAndResults = async () => {
            // Fetch Poll
            const { data: pollData } = await supabase
                .from('polls')
                .select('*')
                .eq('id', id)
                .single()

            if (pollData) setPoll(pollData)

            // Fetch User's current response
            if (user) {
                const { data: userResp } = await supabase
                    .from('poll_responses')
                    .select('selected_slots')
                    .eq('poll_id', id)
                    .eq('user_id', user.id)
                    .single()

                if (userResp) setSelectedSlots(userResp.selected_slots)
            }

            // Fetch All results
            const { data: allResps } = await supabase
                .from('poll_responses')
                .select('selected_slots')
                .eq('poll_id', id)

            if (allResps) {
                const counts = {}
                allResps.forEach(resp => {
                    resp.selected_slots.forEach(slot => {
                        counts[slot] = (counts[slot] || 0) + 1
                    })
                })
                setResults(counts)
                setTotalRespondents(allResps.length)
            }

            setLoading(false)
        }

        fetchPollAndResults()
    }, [id, user])

    const toggleSlot = (date, time) => {
        const slotId = `${date}_${time}`
        setSelectedSlots(prev =>
            prev.includes(slotId) ? prev.filter(s => s !== slotId) : [...prev, slotId]
        )
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this poll?')) return
        try {
            const { error } = await supabase
                .from('polls')
                .update({ is_active: false })
                .eq('id', id)
            if (error) throw error

            // Send Telegram Notification
            await telegramService.sendPollClosedNotification(poll.language)

            navigate('/polls')
        } catch (err) {
            alert(err.message)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('poll_responses')
                .upsert({
                    poll_id: id,
                    user_id: user.id,
                    selected_slots: selectedSlots
                }, { onConflict: 'poll_id,user_id' })

            if (error) throw error
            window.location.reload() // Refresh to see updated results
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
    if (!poll) return <div className="min-h-screen bg-neutral-950 text-center py-20">Poll not found.</div>

    const dates = getDatesInRange(poll.start_date, poll.end_date)

    return (
        <div className="py-8 sm:py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                <button
                    onClick={() => navigate('/polls')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Polls
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full gap-6 border-b border-neutral-900 pb-8 text-center sm:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                            <span className="bg-indigo-600/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block">{poll.language}</span>
                            {isOrganizer && (
                                <button
                                    onClick={handleDelete}
                                    className="text-red-500 hover:text-red-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete Poll
                                </button>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white">Availability Check</h1>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-neutral-500 text-sm font-medium">
                            <span className="flex items-center gap-2 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800"><BarChart3 className="w-4 h-4 text-indigo-500" /> {totalRespondents} Respondents</span>
                        </div>
                    </div>

                    {user && (
                        <div className="w-full sm:w-auto">
                            <Button onClick={handleSave} loading={saving} className="shadow-xl shadow-indigo-600/20">
                                <Save className="w-5 h-5 mr-3" /> Save My Availability
                            </Button>
                        </div>
                    )}

                    {!user && (
                        <div className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                            <p className="text-xs text-neutral-400 font-medium text-center sm:text-left">
                                You must sign in to save your availability for this poll.
                            </p>
                            <Link
                                to="/login"
                                state={{ from: location.pathname }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                            >
                                Sign In to Vote
                            </Link>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-collapse border-separate border-spacing-2">
                        <thead>
                            <tr>
                                <th className="p-4 text-left text-neutral-500 font-bold border-b border-neutral-800 italic">Day / Time</th>
                                {TIMES.map(time => (
                                    <th key={time} className="p-4 text-center min-w-[120px] bg-neutral-900/50 rounded-t-2xl border-x border-t border-neutral-800">
                                        <span className="block text-sm font-bold text-white">{time}</span>
                                        <span className="block text-[10px] text-neutral-500 uppercase mt-1">1.5h Slot</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dates.map(date => (
                                <tr key={date}>
                                    <td className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                                        <span className="block font-bold text-white whitespace-nowrap">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    </td>
                                    {TIMES.map(time => {
                                        const slotId = `${date}_${time}`
                                        const count = results[slotId] || 0
                                        const isSelected = selectedSlots.includes(slotId)
                                        const intensity = count > 0 ? Math.min(count * 20, 100) : 0

                                        return (
                                            <td
                                                key={time}
                                                onClick={() => user && toggleSlot(date, time)}
                                                className={`p-4 border border-neutral-800 rounded-2xl cursor-pointer transition-all relative group overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900/30 text-neutral-500 hover:border-neutral-600'}`}
                                            >
                                                {/* Heatmap intensity bar */}
                                                {!isSelected && count > 0 && (
                                                    <div className="absolute inset-0 bg-indigo-500 opacity-[0.05]" style={{ opacity: intensity / 1000 + 0.05 }}></div>
                                                )}

                                                <div className="relative flex flex-col items-center justify-center gap-1">
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-neutral-400'}`}>{count}</span>
                                                    <Users className={`w-3 h-3 ${isSelected ? 'text-white/50' : 'text-neutral-600'}`} />
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl flex items-center gap-4 text-sm text-neutral-400">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                    <p>Click on the time slots where you are available. Numbers indicate how many people total are free at that time.</p>
                </div>
            </div>
        </div>
    )
}
