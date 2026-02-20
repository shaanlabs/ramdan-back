import React from 'react';
import { calculateDisciplineScore } from '../utils/scoring';

const DisciplineCard = ({ discipline, onChange, isLocked = false }) => {
  const score = calculateDisciplineScore(discipline.screenTime);

  const handleScreenTimeChange = (value) => {
    onChange({ ...discipline, screenTime: parseFloat(value) || 0 });
  };

  const getMessage = () => {
    const time = discipline.screenTime;
    if (time <= 1) return { text: 'Excellent Control! 🌟', color: 'text-green-600', bg: 'bg-green-50' };
    if (time <= 3) return { text: 'Moderate Usage ⚖️', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: 'Too Distracted ⚠️', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getProgressColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const message = getMessage();

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
      {isLocked && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
          🔒 <strong>View Only:</strong> This is a past day. You cannot edit this data.
        </div>
      )}
      
      <div className={isLocked ? "pointer-events-none opacity-60" : ""}>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          📵 Discipline (Screen Time)
        </h2>

        <div className="mb-4 md:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">
          Hours Spent on Screen Today
        </label>
        
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={discipline.screenTime}
          onChange={(e) => handleScreenTimeChange(e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 hr</span>
          <span>1+ hr</span>
          <span>2+ hr</span>
          <span>3+ hr</span>
          <span>4+ hr</span>
          <span>5+ hr</span>
        </div>
      </div>

      {/* Current Value Display */}
      <div className="text-center mb-4 md:mb-6">
        <div className="text-4xl md:text-5xl font-bold text-gray-800">
          {discipline.screenTime} <span className="text-xl md:text-2xl text-gray-600">hours</span>
        </div>
      </div>

      {/* Dynamic Message */}
      <div className={`p-4 rounded-lg mb-6 ${message.bg}`}>
        <p className={`text-center text-lg font-semibold ${message.color}`}>
          {message.text}
        </p>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Discipline Score</span>
          <span className="text-sm font-bold text-emerald-600">
            {score}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DisciplineCard;
