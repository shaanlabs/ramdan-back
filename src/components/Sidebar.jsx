import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getDateForRamadanDay } from '../utils/dateEngine';

const Sidebar = ({ currentDay, scores, onDayChange, ramadanDay }) => {
  const { profile, signOut } = useAuth();

  // Current Ramadan day (from context, not hardcoded)
  const actualCurrentDay = ramadanDay;

  // Check if selected day is locked
  const isLocked = currentDay < actualCurrentDay;

  // Format date for display
  const displayDate = getDateForRamadanDay(currentDay);

  const getProgressColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const circumference = 2 * Math.PI * 70;
  const progress = circumference - (scores.final / 100) * circumference;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="lg:col-span-3 bg-gradient-to-b from-emerald-50 to-teal-50 p-4 md:p-6 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-gray-200">
      {/* User Profile Section */}
      {profile && (
        <div className="mb-4 p-3 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${profile.gender === 'girl' ? 'bg-pink-100' : 'bg-blue-100'
              }`}>
              {profile.gender === 'girl' ? '🧕' : '🕌'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500">{profile.stream} • Y{profile.year} • S{profile.section}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Top Section - Day Info */}
      <div className="text-center mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
          Ramadan Day {currentDay}
        </h1>
        <p className="text-xs md:text-sm text-gray-600">{displayDate}</p>

        {/* Lock indicator */}
        {isLocked && (
          <div className="mt-2 inline-flex items-center px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
            🔒 Locked (View Only)
          </div>
        )}
        {currentDay === actualCurrentDay && (
          <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 rounded text-xs text-green-700">
            📍 Today - Active
          </div>
        )}
        {currentDay > actualCurrentDay && (
          <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-100 rounded text-xs text-blue-700">
            🔮 Future Day
          </div>
        )}
      </div>

      {/* Circular Progress Ring */}
      <div className="flex flex-col items-center mb-6 md:mb-10">
        <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
            <circle
              cx="88" cy="88" r="70"
              stroke="#fbbf24"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-600">
              {scores.final}%
            </span>
            <span className="text-xs text-gray-600 mt-1">Today's Score</span>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="hidden md:block space-y-4 mb-6 md:mb-8">
        {['salah', 'quran', 'dhikr', 'discipline'].map((item) => (
          <div key={item}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {item === 'salah' ? '🕌 Salah' :
                  item === 'quran' ? '📖 Quran' :
                    item === 'dhikr' ? '📿 Dhikr' : '📵 Discipline'}
              </span>
              <span className={`text-sm font-bold ${getProgressColor(scores[item])}`}>
                {scores[item]}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getBarColor(scores[item])}`}
                style={{ width: `${scores[item]}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Day Navigator */}
      <div className="border-t border-gray-300 pt-4 md:pt-6">
        <p className="text-xs text-gray-600 text-center mb-2 md:mb-3">
          Today is Day {actualCurrentDay}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onDayChange(currentDay - 1)}
            disabled={currentDay <= 1}
            className="px-2 md:px-3 py-1.5 md:py-2 bg-white rounded-lg shadow-sm text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <span className="text-xs md:text-sm font-bold text-gray-800">
            Day {currentDay}
          </span>
          <button
            onClick={() => onDayChange(currentDay + 1)}
            disabled={currentDay >= 30 || currentDay >= actualCurrentDay}
            className="px-2 md:px-3 py-1.5 md:py-2 bg-white rounded-lg shadow-sm text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;