import React from 'react';
import { calculateGoodDeedsScore } from '../utils/scoring';

const GoodDeedsCard = ({ goodDeeds, onChange, isLocked = false }) => {
  const score = calculateGoodDeedsScore(goodDeeds);

  const handleDeedChange = (index, value) => {
    const newDeeds = [...goodDeeds];
    newDeeds[index] = value;
    onChange(newDeeds);
  };

  const getProgressColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
      {isLocked && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
          🔒 <strong>View Only:</strong> This is a past day. You cannot edit this data.
        </div>
      )}
      
      <div className={isLocked ? "pointer-events-none opacity-60" : ""}>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          ❤️ Today's Good Deeds
        </h2>

        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        {goodDeeds.map((deed, index) => (
          <div key={index} className="p-2 md:p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={deed}
              onChange={(e) => handleDeedChange(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base"
              placeholder={`Good deed #${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Good Deeds Score</span>
          <span className="text-sm font-bold text-emerald-600">
            {score}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          ></div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default GoodDeedsCard;
