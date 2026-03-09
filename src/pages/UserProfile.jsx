import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    User, Star, Settings, Languages, Globe,
    ArrowLeft, Calendar, CheckCircle2, MessageSquare,
    Sparkles, Rocket, GraduationCap, Coffee, Ghost, Lock,
    Trophy, Zap, Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/AuthUI'

const ICON_LIST = {
    User, Settings, Languages, MessageSquare, Rocket, GraduationCap, Sparkles, Coffee, Globe, Ghost
}

export default function UserProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ attendance: 0, avgRating: 0, totalRatings: 0, activityRank: null, reputationRank: null })
    const [userRatings, setUserRatings] = useState({}) // session_id -> rating
    const [sharedSessions, setSharedSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [ratingLoading, setRatingLoading] = useState({}) // session_id -> loading state

    useEffect(() => {
        fetchProfileAndStats()
    }, [id, currentUser])

    const fetchProfileAndStats = async () => {
        setLoading(true)
        try {
            // Fetch Profile
            const { data: profileData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()

            if (pError) throw pError
            setProfile(profileData)

            // Fetch Attendance
            const { count: attendanceCount } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('profile_id', id)

            // Fetch Ratings
            const { data: ratingData } = await supabase
                .from('user_ratings')
                .select('rating')
                .eq('to_id', id)

            const total = ratingData?.length || 0
            const avg = total > 0 ? ratingData.reduce((acc, r) => acc + r.rating, 0) / total : 0

            setStats({
                attendance: attendanceCount || 0,
                avgRating: avg.toFixed(1),
                totalRatings: total,
                activityRank: null,
                reputationRank: null
            })

            // Fetch Rankings
            // 1. Activity Rank (Attendance)
            const { data: allAttendance } = await supabase.from('registrations').select('profile_id')
            const attendanceMap = {}
            allAttendance?.forEach(r => attendanceMap[r.profile_id] = (attendanceMap[r.profile_id] || 0) + 1)
            const sortedAttendance = Object.entries(attendanceMap).sort((a, b) => b[1] - a[1])
            const activityRank = sortedAttendance.findIndex(([pid]) => pid === id) + 1

            // 2. Reputation Rank (Ratings with min 5)
            const { data: allRatings } = await supabase.from('user_ratings').select('to_id, rating')
            const ratingMap = {}
            allRatings?.forEach(r => {
                if (!ratingMap[r.to_id]) ratingMap[r.to_id] = { sum: 0, count: 0 }
                ratingMap[r.to_id].sum += r.rating
                ratingMap[r.to_id].count++
            })
            const sortedReputation = Object.entries(ratingMap)
                .filter(([_, data]) => data.count >= 5)
                .map(([pid, data]) => ({ id: pid, avg: data.sum / data.count }))
                .sort((a, b) => b.avg - a.avg)
            const reputationRank = sortedReputation.findIndex(u => u.id === id) + 1

            setStats(prev => ({
                ...prev,
                activityRank: activityRank > 0 ? activityRank : null,
                reputationRank: reputationRank > 0 ? reputationRank : null
            }))


            // Fetch Shared Sessions (if logged in and not looking at own profile)
            if (currentUser && currentUser.id !== id) {
                // 1. Get all session IDs the target user is in
                const { data: targetRegs } = await supabase
                    .from('registrations')
                    .select(`
                        session_id,
                        sessions ( id, title, date, language )
                    `)
                    .eq('profile_id', id)

                if (targetRegs) {
                    const targetSessionIds = targetRegs.map(r => r.session_id)

                    // 2. See which of those the current user is also in
                    const { data: myRegs } = await supabase
                        .from('registrations')
                        .select('session_id')
                        .eq('profile_id', currentUser.id)
                        .in('session_id', targetSessionIds)

                    if (myRegs) {
                        const sharedIds = myRegs.map(r => r.session_id)
                        const filteredShared = targetRegs
                            .filter(r => sharedIds.includes(r.session_id))
                            .map(r => r.sessions)

                        setSharedSessions(filteredShared)

                        // 3. Fetch current user's ratings for these specific shared sessions
                        const { data: myExistingRatings } = await supabase
                            .from('user_ratings')
                            .select('session_id, rating')
                            .eq('from_id', currentUser.id)
                            .eq('to_id', id)
                            .in('session_id', sharedIds)

                        if (myExistingRatings) {
                            const rMap = {}
                            myExistingRatings.forEach(r => rMap[r.session_id] = r.rating)
                            setUserRatings(rMap)
                        }
                    }
                }
            }

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    const handleRate = async (sessionId, rating) => {
        if (!currentUser) {
            navigate('/login')
            return
        }
        if (currentUser.id === id) return

        const session = sharedSessions.find(s => s.id === sessionId)
        if (session) {
            const hoursSinceStart = (new Date() - new Date(session.date)) / (1000 * 60 * 60)
            if (hoursSinceStart > 42) {
                alert('Rating period for this session has expired (42-hour limit).')
                return
            }
        }

        setRatingLoading(prev => ({ ...prev, [sessionId]: true }))
        try {
            const { error } = await supabase
                .from('user_ratings')
                .upsert({
                    from_id: currentUser.id,
                    to_id: id,
                    session_id: sessionId,
                    rating: rating
                }, { onConflict: 'from_id,to_id,session_id' })

            if (error) throw error
            setUserRatings(prev => ({ ...prev, [sessionId]: rating }))
            fetchProfileAndStats() // Refresh average
        } catch (err) {
            alert(err.message)
        } finally {
            setRatingLoading(prev => ({ ...prev, [sessionId]: false }))
        }
    }

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
    if (!profile) return <div className="min-h-screen bg-neutral-950 text-center py-20">User not found.</div>

    const AvatarIcon = ICON_LIST[profile.avatar_icon] || User

    return (
        <div className="py-8 sm:py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    {/* Header Left: Avatar & Rating */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="p-6 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl shadow-indigo-600/10">
                                <AvatarIcon className="w-16 h-16 text-indigo-400" />
                            </div>
                            {profile.role === 'admin' && (
                                <div className="absolute -top-2 -right-2 bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-indigo-400 shadow-xl" title="Administrator">
                                    <Settings className="w-5 h-5" />
                                </div>
                            )}
                            {(profile.role === 'organizer' || profile.role === 'admin') && (
                                <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-xl text-white shadow-xl" title="Verified Organizer">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-1 text-yellow-500">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${stats.avgRating >= star ? 'fill-current' : 'opacity-20'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm font-bold text-white">{stats.avgRating} <span className="text-neutral-500 font-medium">({stats.totalRatings} ratings)</span></p>
                        </div>
                    </div>

                    {/* Header Right: Info & Stats */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">{profile.full_name}</h1>
                            <p className="text-neutral-400 text-lg font-medium">{profile.bio || 'This community member is keeping it mysterious...'}</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Sessions Attended</p>
                                <p className="text-xl font-black text-indigo-400">{stats.attendance}</p>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-2xl">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Community Role</p>
                                <p className="text-xl font-black text-white capitalize">{profile.role}</p>
                            </div>
                            {stats.activityRank && (
                                <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                                    <div>
                                        <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Activity Rank</p>
                                        <p className="text-xl font-black text-white">#{stats.activityRank}</p>
                                    </div>
                                </div>
                            )}
                            {stats.reputationRank && (
                                <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Reputation Rank</p>
                                        <p className="text-xl font-black text-white">#{stats.reputationRank}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {currentUser && currentUser.id !== id && sharedSessions.length > 0 && (
                            <div className="pt-4 space-y-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Rate your interactions</p>
                                    <p className="text-[10px] text-neutral-600">You can rate this member once for each session you attended together.</p>
                                </div>
                                <div className="space-y-4">
                                    {sharedSessions.map(session => {
                                        const hoursSinceStart = (new Date() - new Date(session.date)) / (1000 * 60 * 60)
                                        const isExpired = hoursSinceStart > 42
                                        const isFuture = hoursSinceStart < 0

                                        return (
                                            <div key={session.id} className={`p-4 rounded-2xl border transition-all ${isExpired ? 'bg-neutral-900/20 border-neutral-900' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-bold text-white truncate">{session.title}</h4>
                                                        <p className="text-[10px] text-neutral-500 font-mono">{new Date(session.date).toLocaleDateString()}</p>
                                                    </div>
                                                    {isExpired ? (
                                                        <span className="text-[9px] bg-red-500/10 text-red-500/60 px-2 py-0.5 rounded-full border border-red-500/10 flex items-center gap-1">
                                                            <Lock className="w-3 h-3" /> Expired
                                                        </span>
                                                    ) : isFuture ? (
                                                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/10 flex items-center gap-1">
                                                            Upcoming
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/10 flex items-center gap-1">
                                                            Active Window
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            disabled={ratingLoading[session.id] || isExpired || isFuture}
                                                            onClick={() => handleRate(session.id, star)}
                                                            className={`p-1 transition-all ${!isExpired && !isFuture ? 'hover:scale-125' : 'cursor-not-allowed'} ${userRatings[session.id] >= star ? 'text-yellow-500' : (isExpired || isFuture) ? 'text-neutral-800' : 'text-neutral-700 hover:text-yellow-500/50'}`}
                                                        >
                                                            <Star className={`w-6 h-6 ${userRatings[session.id] >= star ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                    {userRatings[session.id] > 0 && (
                                                        <span className={`text-[10px] font-bold ml-2 ${isExpired ? 'text-neutral-600' : 'text-green-500'}`}>
                                                            {isExpired ? 'Locked' : 'Rated!'}
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpired && !userRatings[session.id] && (
                                                    <p className="text-[10px] text-neutral-600 mt-2 italic">Rating window closed before you could leave a review.</p>
                                                )}
                                                {isFuture && (
                                                    <p className="text-[10px] text-neutral-600 mt-2 italic">Rating opens once the session starts.</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {currentUser && currentUser.id !== id && sharedSessions.length === 0 && (
                            <div className="pt-4 p-6 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-2xl text-center">
                                <p className="text-sm text-neutral-500 italic">Attend a session with {profile.full_name} to leave a rating!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-neutral-900">
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Globe className="w-5 h-5 text-indigo-400" /> Languages Spoken
                        </h2>
                        <div className="space-y-3">
                            {profile.languages_spoken?.map((lang, i) => (
                                <div key={i} className="flex items-center justify-between bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800">
                                    <span className="font-bold text-white">{lang.lang}</span>
                                    <span className="text-xs bg-indigo-600/10 text-indigo-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{lang.level}</span>
                                </div>
                            ))}
                            {(!profile.languages_spoken || profile.languages_spoken.length === 0) && <p className="text-neutral-500 italic">No languages listed yet.</p>}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> Learning Interests
                        </h2>
                        <div className="space-y-3">
                            {profile.languages_to_learn?.map((lang, i) => (
                                <div key={i} className="flex items-center justify-between bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800">
                                    <span className="font-bold text-white">{lang.lang}</span>
                                    <span className="text-xs bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{lang.level}</span>
                                </div>
                            ))}
                            {(!profile.languages_to_learn || profile.languages_to_learn.length === 0) && <p className="text-neutral-500 italic">No learning goals listed yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
