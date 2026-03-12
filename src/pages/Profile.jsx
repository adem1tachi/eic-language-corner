import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
    User,
    Settings,
    Languages,
    MessageSquare,
    Rocket,
    GraduationCap,
    Sparkles,
    Coffee,
    Globe,
    Ghost,
    CheckCircle2,
    Calendar,
    Plus,
    Minus,
    Save,
    Trash2,
    ChevronRight,
    ArrowLeft,
    Star,
    LogOut
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../components/AuthUI'
import { LANGUAGES } from '../lib/constants'

const ICON_LIST = {
    User, Settings, Languages, MessageSquare, Rocket, GraduationCap, Sparkles, Coffee, Globe, Ghost
}

const LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Fluent', 'Native']

export default function Profile() {
    const navigate = useNavigate()
    const { user, profile, updateProfile, signOut } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [mySessions, setMySessions] = useState([])
    const [fetchingSessions, setFetchingSessions] = useState(true)

    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        avatar_icon: 'User',
        languages_spoken: [],
        languages_to_learn: []
    })

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                avatar_icon: profile.avatar_icon || 'User',
                languages_spoken: profile.languages_spoken || [],
                languages_to_learn: profile.languages_to_learn || []
            })
            fetchMySessions()
        }
    }, [profile])

    const fetchMySessions = async () => {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select(`
                    session_id,
                    sessions (
                        id,
                        title,
                        date,
                        language
                    )
                `)
                .eq('profile_id', user.id)

            if (error) throw error
            setMySessions(data?.map(r => r.sessions) || [])
        } catch (err) {
            console.error('Error fetching sessions:', err)
        } finally {
            setFetchingSessions(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        try {
            await updateProfile(formData)
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    const addLanguage = (listName) => {
        setFormData(prev => ({
            ...prev,
            [listName]: [...prev[listName], { lang: '', level: 'Intermediate' }]
        }))
    }

    const updateLanguage = (listName, index, field, value) => {
        const newList = [...formData[listName]]
        newList[index][field] = value
        setFormData(prev => ({ ...prev, [listName]: newList }))
    }

    const removeLanguage = (listName, index) => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index)
        }))
    }

    const AvatarIcon = ICON_LIST[formData.avatar_icon] || User

    return (
        <div className="py-6 sm:py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8 w-full">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left w-full">
                    <div className="relative shrink-0">
                        <div className="p-4 sm:p-5 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-600/5">
                            <AvatarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                        </div>
                        {profile?.role === 'admin' && (
                            <div className="absolute -top-2 -right-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg text-indigo-400 shadow-xl" title="Administrator">
                                <Settings className="w-3.5 h-3.5" />
                            </div>
                        )}
                        {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                            <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-lg text-white shadow-xl" title="Verified Organizer">
                                <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
                            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent truncate">Your Profile</h1>
                            {profile?.role && (
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${profile.role === 'admin' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : profile.role === 'organizer' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                                    {profile.role}
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-500 font-medium text-sm sm:text-base">Customize how others see you in the community</p>
                    </div>
                </div>

                {message && (
                    <div className={`w-full p-4 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-6 sm:gap-8 w-full">
                    {/* Personal Info */}
                    <div className="space-y-6 bg-neutral-900/40 p-5 sm:p-8 rounded-[2rem] border border-neutral-800 w-full">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" /> Personal Info
                        </h2>

                        <div className="w-full">
                            <Input
                                label="Display Name"
                                icon={User}
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2 w-full">
                            <label className="text-sm font-medium text-neutral-400 ml-1">Short Bio</label>
                            <textarea
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700 min-h-[120px] text-sm"
                                placeholder="Tell us about yourself..."
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-4 w-full">
                            <label className="text-sm font-medium text-neutral-400 ml-1">Choose your Avatar Icon</label>
                            <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-start">
                                {Object.keys(ICON_LIST).map(iconName => {
                                    const IconComp = ICON_LIST[iconName]
                                    return (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, avatar_icon: iconName }))}
                                            className={`p-3 rounded-xl border transition-all flex-shrink-0 ${formData.avatar_icon === iconName ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                                        >
                                            <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-6 bg-neutral-900/40 p-5 sm:p-8 rounded-[2rem] border border-neutral-800 w-full">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-400" /> Languages
                        </h2>

                        <LanguageList
                            title="Languages I Speak"
                            list={formData.languages_spoken}
                            onAdd={() => addLanguage('languages_spoken')}
                            onUpdate={(idx, f, v) => updateLanguage('languages_spoken', idx, f, v)}
                            onRemove={(idx) => removeLanguage('languages_spoken', idx)}
                        />

                        <div className="pt-2">
                            <LanguageList
                                title="Languages I'm Learning"
                                list={formData.languages_to_learn}
                                onAdd={() => addLanguage('languages_to_learn')}
                                onUpdate={(idx, f, v) => updateLanguage('languages_to_learn', idx, f, v)}
                                onRemove={(idx) => removeLanguage('languages_to_learn', idx)}
                            />
                        </div>
                    </div>

                    {/* Participation History (Full Width) */}
                    <div className="lg:col-span-2 space-y-6 bg-neutral-900/40 p-5 sm:p-8 rounded-[2rem] border border-neutral-800 w-full">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-400" /> Sessions I've Joined
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {fetchingSessions ? (
                                <div className="col-span-full py-8 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : mySessions.length > 0 ? (
                                mySessions.map(session => (
                                    <Link
                                        key={session.id}
                                        to={`/sessions/${session.id}`}
                                        className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl hover:border-indigo-500/50 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">{session.language}</span>
                                            <span className="text-[10px] text-neutral-600 font-mono">{new Date(session.date).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{session.title}</h4>
                                    </Link>
                                ))
                            ) : (
                                <p className="col-span-full py-8 text-center text-neutral-600 italic">You haven't joined any sessions yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-4 py-4">
                        <div className="w-full sm:w-64 order-2 sm:order-1">
                            <button
                                type="button"
                                onClick={() => {
                                    signOut()
                                    navigate('/')
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all active:scale-95"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                        <div className="w-full sm:w-64 order-1 sm:order-2">
                            <Button type="submit" loading={loading} className="shadow-xl shadow-indigo-600/10 w-full">
                                <Save className="w-5 h-5 mr-2" /> Save Changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

function LanguageList({ title, list, onAdd, onUpdate, onRemove }) {
    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{title}</h3>
                <button
                    type="button"
                    onClick={onAdd}
                    className="p-1 text-indigo-400 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                {list.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full">
                        <div className="relative flex-[2] min-w-[150px] w-full">
                            <select
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
                                value={item.lang}
                                onChange={(e) => onUpdate(idx, 'lang', e.target.value)}
                            >
                                <option value="" disabled>Select language</option>
                                {LANGUAGES.map(lang => (
                                    <option key={lang} value={lang} className="bg-neutral-900 text-white">{lang}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                            </div>
                        </div>
                        <div className="relative flex-1 min-w-[120px] w-full">
                            <select
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none"
                                value={item.level}
                                onChange={(e) => onUpdate(idx, 'level', e.target.value)}
                            >
                                {LEVELS.map(L => <option key={L} value={L}>{L}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="p-2 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {list.length === 0 && (
                    <p className="text-center py-4 text-xs text-neutral-600 italic font-medium">None added yet.</p>
                )}
            </div>
        </div>
    )
}
