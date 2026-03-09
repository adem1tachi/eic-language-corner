# 🌍 EIC Language Corner

A premium, modern web platform designed for university clubs to organize and manage weekly language exchange sessions. Built with a focus on student engagement, real-time notifications, and community rankings.

![Project Preview](https://raw.githubusercontent.com/adem-tachi/eic-language-corner/main/preview.png) *(Note: Add your own preview image link here)*

## ✨ Key Features

- **🔐 Secure Authentication**: Handled by Supabase Auth with custom profile synchronization.
- **🗓️ Session Management**: Organizers can create, manage, and schedule weekly exchange sessions.
- **📊 Availability Polls**: Determine the best time for sessions through interactive member voting.
- **📱 Telegram Integration**: Real-time community alerts for new sessions and polls via Telegram Bot API.
- **🏆 Ranking & Stats**: Gamified experience with activity and reputation ranks based on attendance and peer ratings.
- **⭐ Session-based Ratings**: Members can rate their interaction with others after attending the same session.
- **📱 Mobile First**: Fully responsive design optimized for various screen sizes using Tailwind CSS.
- **♻️ Soft Delete System**: Manage content safely without losing historical data.

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, Lucide React (Icons).
- **Backend/Database**: Supabase (PostgreSQL), Row Level Security (RLS).
- **Communication**: Telegram Bot API.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/eic-language-corner.git
cd eic-language-corner
npm install
```

### 2. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/full_setup.sql` and run it. This will set up all tables, triggers, and security policies in one go.

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_bot_token (Optional)
VITE_TELEGRAM_CHAT_ID=your_chat_id (Optional)
```

### 4. Run Locally
```bash
npm run dev
```

## 📜 Project Structure

- `src/lib/telegramService.js`: Handles all bot communications.
- `src/lib/supabase.js`: Supabase client configuration.
- `supabase/full_setup.sql`: The unified database entry point.
- `src/pages/`: Contains all main views (Rankings, Sessions, Polls, Profile).

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests to improve the platform.

## 📄 License
This project is licensed under the MIT License.

---
Created with ❤️ by [Adem Tachi](https://adem-tachi.netlify.app/)
