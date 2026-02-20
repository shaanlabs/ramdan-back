# Ramadan Spiritual Performance Dashboard 🌙

A beautiful, interactive dashboard to track your spiritual journey during Ramadan. Built with React and Tailwind CSS.

![Dashboard Preview](preview.png)

## ✨ Features

- **📊 Real-time Performance Tracking** - Instant score calculations with weighted metrics
- **🕌 Salah Tracker** - Track all 5 daily prayers plus extra Sunnah prayers
- **📖 Quran Reading** - Monitor daily Quran pages and surah progress
- **📿 Daily Dhikr** - Simple checkboxes for 3 essential adhkar
- **📵 Discipline Monitor** - Track and control screen time
- **🙏 Gratitude Journal** - Reflect on 3 daily blessings
- **❤️ Good Deeds Log** - Record and score your daily good actions
- **📅 30-Day History** - Navigate and review all days of Ramadan
- **💾 Auto-Save** - All data persists in localStorage
- **📱 Fully Responsive** - Works seamlessly on mobile, tablet, and desktop

## 🎯 Scoring System

The dashboard calculates a daily performance score using weighted categories:

- **Salah**: 40% (base 100% for 5 fard prayers + bonus for extra prayers)
- **Quran**: 20% (target: 20 pages/day)
- **Dhikr**: 15% (completion of 3 daily adhkar)
- **Discipline**: 15% (inverse of screen time)
- **Good Deeds**: 10% (points based on deed size)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ramadan-dashboard.git

# Navigate to project directory
cd ramadan-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Built With

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence

## 📂 Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Progress overview & day navigation
│   ├── SalahCard.jsx         # Prayer tracking
│   ├── QuranCard.jsx         # Quran reading tracker
│   ├── DhikrCard.jsx         # Dhikr checkboxes
│   ├── DisciplineCard.jsx    # Screen time slider
│   ├── GratitudeCard.jsx     # Gratitude reflection
│   ├── GoodDeedsCard.jsx     # Good deeds logging
│   └── FinalSummary.jsx      # Score breakdown
├── utils/
│   ├── scoring.js            # Calculation logic
│   └── storage.js            # localStorage helpers
├── App.jsx                   # Main application
└── index.css                 # Tailwind imports
```

## 💡 Usage

1. **Track Daily Activities**: Check off completed prayers, dhikr, and input Quran pages
2. **Log Good Deeds**: Add descriptions and categorize by size (small/medium/big)
3. **Monitor Discipline**: Adjust screen time slider
4. **Reflect**: Write three things you're grateful for
5. **Navigate Days**: Use Prev/Next buttons to view or update any day of Ramadan
6. **View Progress**: Watch your scores update in real-time in the sidebar

## 📱 Responsive Design

- **Mobile** (< 640px): Vertical stacked layout
- **Tablet** (640px - 1024px): Optimized medium-sized interface
- **Desktop** (1024px+): Full side-by-side layout with all features

## 🤲 Duas & Intentions

This project is created with the intention to help Muslims track and improve their spiritual performance during the blessed month of Ramadan. May Allah accept our efforts.

## 📄 License

MIT License - feel free to use this for personal or community purposes.

## 🙏 Acknowledgments

Built with love for the Muslim community during Ramadan 2026.

---

**Note**: All data is stored locally in your browser. No data is sent to any server.
