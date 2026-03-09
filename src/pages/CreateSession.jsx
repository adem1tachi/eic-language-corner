import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Globe, Save, ArrowLeft, Type, Users } from 'lucide-react'
import { Button, Input, Select } from '../components/AuthUI'
import { LANGUAGES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { telegramService } from '../lib/telegramService'

export default function CreateSession() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        language: '',
        max_participants: 20
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Combine date and time
            const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString()

            const { data, error } = await supabase
                .from('sessions')
                .insert([{
                    title: formData.title,
                    description: formData.description,
                    date: dateTime,
                    location: formData.location,
                    language: formData.language,
                    max_participants: formData.max_participants,
                    organizer_id: user.id
                }])
                .select()

            if (error) throw error

            // Trigger Telegram Notification (Non-blocking)
            if (data && data[0]) {
                telegramService.sendNewSessionNotification(
                    formData.title,
                    formData.language,
                    new Date(dateTime).toLocaleString(),
                    formData.location,
                    data[0].id
                )
            }

            navigate('/sessions')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="py-8 sm:py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8 flex flex-col items-center sm:items-stretch">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="text-center sm:text-left w-full">
                    <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent italic">Host a New Session</h1>
                    <p className="text-neutral-400 mt-2 text-sm sm:text-base">Schedule the next encounter for the community</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-8 md:p-12 rounded-[2rem] space-y-8 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm italic">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Input
                                label="Session Title"
                                icon={Type}
                                placeholder="e.g. Weekly English Conversation"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                            />
                        </div>

                        <Select
                            label="Language"
                            icon={Globe}
                            options={LANGUAGES}
                            placeholder="Choose a language"
                            value={formData.language}
                            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                            required
                        />

                        <Input
                            label="Max Participants"
                            icon={Users}
                            type="number"
                            value={formData.max_participants}
                            onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                            required
                        />

                        <Input
                            label="Date"
                            icon={Calendar}
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />

                        <Input
                            label="Time"
                            icon={Clock}
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                            required
                        />

                        <div className="md:col-span-2">
                            <Input
                                label="Location"
                                icon={MapPin}
                                placeholder="e.g. Room 402 or Online"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-neutral-400 ml-1">Session Description</label>
                            <textarea
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700 min-h-[120px]"
                                placeholder="What will this session be about?"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" loading={loading}>
                            <Save className="w-5 h-5 mr-3" /> Create Session
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
