import React from 'react';
import { calculateDhikrScore } from '../utils/scoring';

const DhikrCard = ({ dhikr, onChange, isLocked = false }) => {
  const score = calculateDhikrScore(dhikr);

  const handleCheckboxChange = (name, value) => {
    // When checked, set to target (300), when unchecked set to 0
    onChange({ ...dhikr, [name]: value ? 400 : 0 });
  };

  const getProgressColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const dhikrItems = [
    { name: 'subhanallah', label: 'سبحان اللہ، الحمدللہ، لا الٰہ الا اللہ، اللہ اکبر(100)' },
    { name: 'daroodh', label: 'درود شریف (100+)' },
    { name: 'allahuAkbar', label: 'استغفراللہ (100+)' },
    { name: 'alhamdulillah', label: 'دعا (10+ منٹ)' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
      {isLocked && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
          🔒 <strong>View Only:</strong> This is a past day. You cannot edit this data.
        </div>
      )}
      
      <div className={isLocked ? "pointer-events-none opacity-60" : ""}>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          📿 Daily Dhikr
        </h2>

        <div className="space-y-3 mb-4 md:mb-6">
        {dhikrItems.map(({ name, label }) => (
          <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={dhikr[name] >= 300}
                onChange={(e) => handleCheckboxChange(name, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-sm md:text-base font-medium text-gray-800">{label}</span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {dhikr[name] >= 300 ? '100%' : '0%'}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Dhikr Completion</span>
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

export default DhikrCard;
