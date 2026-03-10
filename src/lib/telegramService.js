/**
 * Service to handle Telegram notifications.
 * Uses Telegram Bot API to send messages to a specific group or channel.
 */
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

export const telegramService = {
    async sendMessage(text) {
        if (!BOT_TOKEN || !CHAT_ID) {
            console.warn('[Telegram Service] Missing Bot Token or Chat ID. Logging message instead:')
            console.log(`%c[Telegram Simulation] ${text}`, 'color: #0088cc; font-weight: bold;')
            return
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text,
                    parse_mode: 'HTML'
                })
            })

            if (!response.ok) throw new Error('Telegram API error')
            console.log('[Telegram Service] Message sent successfully!')
        } catch (error) {
            console.error('[Telegram Service] Failed to send message:', error)
        }
    },

    async sendWelcomeMessage(name) {
        const text = `🌟 <b>New Member Joined!</b>\n\nWelcome to the community, <b>${name}</b>! We're excited to have you with us. 🚀`
        return this.sendMessage(text)
    },

    async sendNewPollNotification(language, startDate, endDate, id) {
        const url = `${window.location.origin}/polls/${id}`
        const text = `📊 <b>New Availability Poll!</b>\n\nA new poll has been created for <b>${language}</b>.\n\n📅 <b>Period:</b> ${startDate} to ${endDate}\n\n👉 <a href="${url}">Vote now in the app!</a>`
        return this.sendMessage(text)
    },

    async sendNewSessionNotification(title, language, date, location, id) {
        const url = `${window.location.origin}/sessions/${id}`
        const text = `🗓️ <b>New Session Scheduled!</b>\n\n<b>${title}</b>\n🌍 <b>Language:</b> ${language}\n⏰ <b>Date:</b> ${date}\n📍 <b>Location:</b> ${location}\n\n👋 <b>Confirm your attendance here:</b>\n👉 <a href="${url}">View Session & Confirm</a>\n\nSee you there! 🔥`
        return this.sendMessage(text)
    },

    async sendSessionCancelledNotification(title, language, date) {
        const text = `❌ <b>Session Cancelled</b>\n\n<b>${title}</b> (${language})\n📅 <b>Was scheduled for:</b> ${date}\n\nWe apologize for the inconvenience. Stay tuned for future sessions! 🙏`
        return this.sendMessage(text)
    },

    async sendRegistrationToggledNotification(title, isOpen, id) {
        const url = `${window.location.origin}/sessions/${id}`
        const status = isOpen ? '🔓 <b>Registration Resumed!</b>' : '🔒 <b>Registration Closed</b>'
        const action = isOpen ? 'You can now join the session again!' : 'Registration for this session is currently closed.'
        const text = `${status}\n\n<b>${title}</b>\n${action}\n\n👉 <a href="${url}">View Session Details</a>`
        return this.sendMessage(text)
    },

    async sendPollClosedNotification(language) {
        const text = `🏁 <b>Selection Time Ended!</b>\n\nThe availability poll for <b>${language}</b> is now closed. 📊\n\nThank you for voting! A session will be scheduled soon based on the results. Stay tuned! ⏳`
        return this.sendMessage(text)
    }
}
