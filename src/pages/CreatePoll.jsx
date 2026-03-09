import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Languages, ArrowLeft, Save } from 'lucide-react'
import { Button, Input, Select } from '../components/AuthUI'
import { LANGUAGES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { telegramService } from '../lib/telegramService'

export default function CreatePoll() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        language: '',
        start_date: '',
        end_date: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase
                .from('polls')
                .insert([{
                    ...formData,
                    organizer_id: user.id
                }])
                .select()

            if (error) throw error

            // Trigger Telegram Notification (Non-blocking)
            if (data && data[0]) {
                telegramService.sendNewPollNotification(
                    formData.language,
                    formData.start_date,
                    formData.end_date,
                    data[0].id
                )
            }

            navigate('/polls')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="py-8 sm:py-16 px-4">
            <div className="w-full max-w-md mx-auto space-y-8 flex flex-col">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">Create Availability Poll</h1>
                    <p className="text-neutral-400 text-sm">Find the best time for the next session</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm italic">
                            {error}
                        </div>
                    )}

                    <Select
                        label="Language"
                        icon={Languages}
                        options={LANGUAGES}
                        placeholder="Choose a language"
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        required
                    />

                    <Input
                        label="Start Date"
                        icon={Calendar}
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                    />

                    <Input
                        label="End Date"
                        icon={Calendar}
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                    />

                    <Button type="submit" loading={loading}>
                        <Save className="w-5 h-5 mr-2" /> Start Polling
                    </Button>
                </form>
            </div>
        </div>
    )
}
