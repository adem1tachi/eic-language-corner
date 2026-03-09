import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Trophy, Users, Calendar, BarChart2, Globe, Sparkles,
    TrendingUp, Award, Zap, Heart, User, Star, Settings,
    MessageSquare, Rocket, GraduationCap, Coffee, Ghost, Lock
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const ICON_LIST = {
    User, Settings, Languages: Globe, MessageSquare, Rocket, GraduationCap, Sparkles, Coffee, Globe, Ghost
}

export default function Rankings() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSessions: 0,
        totalPolls: 0,
        totalLanguages: 0
    })
    const [activeMembers, setActiveMembers] = useState([])
    const [topRated, setTopRated] = useState([])
    const [spokenLangs, setSpokenLangs] = useState([])
    const [wantedLangs, setWantedLangs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAllRankings()
    }, [])

    const fetchAllRankings = async () => {
        setLoading(true)
        try {
            // 1. Platform Statistics
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
            const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_active', true)
            const { count: pollCount } = await supabase.from('polls').select('*', { count: 'exact', head: true }).eq('is_active', true)

            // 2. Aggregate Languages (all users)
            const { data: allProfiles } = await supabase.from('profiles').select('languages_spoken, languages_to_learn')

            const spokenMap = {}
            const wantedMap = {}
            const uniqueLangs = new Set()

            allProfiles?.forEach(p => {
                p.languages_spoken?.forEach(l => {
                    spokenMap[l.lang] = (spokenMap[l.lang] || 0) + 1
                    uniqueLangs.add(l.lang)
                })
                p.languages_to_learn?.forEach(l => {
                    wantedMap[l.lang] = (wantedMap[l.lang] || 0) + 1
                    uniqueLangs.add(l.lang)
                })
            })

            const sortedSpoken = Object.entries(spokenMap).map(([lang, count]) => ({ lang, count })).sort((a, b) => b.count - a.count).slice(0, 10)
            const sortedWanted = Object.entries(wantedMap).map(([lang, count]) => ({ lang, count })).sort((a, b) => b.count - a.count).slice(0, 10)

            setStats({
                totalUsers: userCount || 0,
                totalSessions: sessionCount || 0,
                totalPolls: pollCount || 0,
                totalLanguages: uniqueLangs.size
            })
            setSpokenLangs(sortedSpoken)
            setWantedLangs(sortedWanted)

            // 3. Most Active Members (Top 10 by attendance)
            // We'll aggregate counts from registrations
            const { data: attendanceData } = await supabase
                .from('registrations')
                .select('profile_id, profiles(full_name, avatar_icon)')

            const attendanceMap = {}
            attendanceData?.forEach(r => {
                if (!attendanceMap[r.profile_id]) {
                    attendanceMap[r.profile_id] = {
                        id: r.profile_id,
                        name: r.profiles.full_name,
                        avatar: r.profiles.avatar_icon,
                        count: 0
                    }
                }
                attendanceMap[r.profile_id].count++
            })
            const sortedActive = Object.values(attendanceMap).sort((a, b) => b.count - a.count).slice(0, 10)
            setActiveMembers(sortedActive)

            // 4. Top Rated Members (Min 5 ratings)
            const { data: ratingData } = await supabase
                .from('user_ratings')
                .select('to_id, rating, profiles:to_id(full_name, avatar_icon)')

            const ratingMap = {}
            ratingData?.forEach(r => {
                if (!ratingMap[r.to_id]) {
                    ratingMap[r.to_id] = {
                        id: r.to_id,
                        name: r.profiles.full_name,
                        avatar: r.profiles.avatar_icon,
                        sum: 0,
                        count: 0
                    }
                }
                ratingMap[r.to_id].sum += r.rating
                ratingMap[r.to_id].count++
            })
            const sortedTopRated = Object.values(ratingMap)
                .filter(u => u.count >= 5)
                .map(u => ({ ...u, avg: (u.sum / u.count).toFixed(1) }))
                .sort((a, b) => b.avg - a.avg || b.count - a.count)
                .slice(0, 10)
            setTopRated(sortedTopRated)

        } catch (err) {
            console.error('Error fetching rankings:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>

    return (
        <div className="py-12 sm:py-20 px-4 max-w-7xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white">Rankings & Statistics</h1>
                <p className="text-neutral-500 text-lg max-w-2xl mx-auto italic font-medium">Celebrating our community's growth and individual achievements.</p>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <StatCard icon={<Users />} label="Total Users" value={stats.totalUsers} color="text-indigo-400" />
                <StatCard icon={<Calendar />} label="Active Sessions" value={stats.totalSessions} color="text-emerald-400" />
                <StatCard icon={<BarChart2 />} label="Active Polls" value={stats.totalPolls} color="text-amber-400" />
                <StatCard icon={<Globe />} label="Total Languages" value={stats.totalLanguages} color="text-rose-400" />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 pt-8">
                {/* Most Active */}
                <RankingList
                    title="Most Active Members"
                    icon={<Zap className="w-6 h-6 text-yellow-500" />}
                    items={activeMembers}
                    type="attendance"
                />

                {/* Top Rated */}
                <RankingList
                    title="Top Rated Members"
                    icon={<Award className="w-6 h-6 text-indigo-500" />}
                    items={topRated}
                    type="rating"
                    subtitle="Minimum 5 ratings required"
                />

                {/* Spoken Languages */}
                <LanguageRanking
                    title="Most Spoken Languages"
                    icon={<Globe className="w-6 h-6 text-emerald-500" />}
                    items={spokenLangs}
                    label="Speakers"
                />

                {/* Wanted Languages */}
                <LanguageRanking
                    title="Most Wanted to Learn"
                    icon={<Sparkles className="w-6 h-6 text-rose-500" />}
                    items={wantedLangs}
                    label="Learners"
                />
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] text-center space-y-2 hover:border-neutral-700 transition-colors group">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${color}`}>
                {icon}
            </div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
    )
}

function RankingList({ title, icon, items, type, subtitle }) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-800 rounded-2xl">
                    {icon}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white">{title}</h2>
                    {subtitle && <p className="text-xs text-neutral-500 font-medium">{subtitle}</p>}
                </div>
            </div>
            <div className="space-y-3">
                {items.length > 0 ? items.map((user, index) => {
                    const AvatarIcon = ICON_LIST[user.avatar] || User
                    return (
                        <Link
                            key={user.id}
                            to={`/profile/${user.id}`}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-800/50 transition-all border border-transparent hover:border-neutral-700 group"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-black w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-neutral-400' : index === 2 ? 'text-amber-700' : 'text-neutral-600'}`}>
                                    #{index + 1}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 text-neutral-400 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-colors">
                                    <AvatarIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{user.name}</span>
                            </div>
                            <div className="text-right">
                                {type === 'attendance' ? (
                                    <p className="text-lg font-black text-white">{user.count} <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest ml-1">sessions</span></p>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                        <p className="text-lg font-black text-white">{user.avg}</p>
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                }) : (
                    <p className="text-center py-10 text-neutral-600 italic">No data available yet.</p>
                )}
            </div>
        </div>
    )
}

function LanguageRanking({ title, icon, items, label }) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-800 rounded-2xl">
                    {icon}
                </div>
                <h2 className="text-2xl font-black text-white">{title}</h2>
            </div>

            <div className="space-y-4">
                {items.length > 0 ? items.map((item, index) => (
                    <div key={item.lang} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-white">{item.lang}</span>
                            <span className="text-neutral-500">{item.count} {label}</span>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${index === 0 ? 'bg-indigo-500' : index === 1 ? 'bg-indigo-600' : 'bg-indigo-700'}`}
                                style={{ width: `${(item.count / items[0].count) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-10 text-neutral-600 italic">No language data found.</p>
                )}
            </div>
        </div>
    )
}
