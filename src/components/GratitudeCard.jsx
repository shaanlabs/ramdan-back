import React from 'react';

const GratitudeCard = ({ gratitude, onChange, isLocked = false }) => {
  const handleChange = (index, value) => {
    const newGratitude = [...gratitude];
    newGratitude[index] = value;
    onChange(newGratitude);
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
          🙏 Three Things I'm Grateful For
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Gratitude {index + 1}
            </label>
            <textarea
              value={gratitude[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder={`I'm grateful for...`}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center italic">
        Daily reflection — not scored, just for your soul ✨
      </p>
      </div>
    </div>
  );
};

export default GratitudeCard;
