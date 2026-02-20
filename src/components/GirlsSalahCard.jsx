import React from 'react';
import { calculateSalahScore } from '../utils/scoring';

const SalahCard = ({ salah, onChange, isLocked = false }) => {
  const totalScore = calculateSalahScore(salah);
  
  // Calculate Fard completion separately (0-100%)
  const fardCount = [
    salah.fajr,
    salah.dhuhr,
    salah.asr,
    salah.maghrib,
    salah.isha
  ].filter(Boolean).length;
  const fardScore = (fardCount / 5) * 100;

  const handleCheckboxChange = (name, value) => {
    if (!isLocked) {
      onChange({ ...salah, [name]: value });
    }
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
          🕌 Daily Salah Tracking
        </h2>

        {/* Fard Salah Table */}
        <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Fard Prayers</h3>
        <div className="space-y-3">
          {/* Sunnah Rakaat Toggle - Before Fajr */}
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.sunnahFajr === 2}
                onChange={(e) => onChange({ ...salah, sunnahFajr: e.target.checked ? 2 : 0 })}
                disabled={isLocked}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm font-medium text-purple-800">Sunnah fajr (2 Rakaat)</span>
            </label>
          </div>

          {/* Fard Prayers with Sunnah toggles */}
          
          {/* Fajr */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={salah.fajr}
                onChange={(e) => handleCheckboxChange('fajr', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-base font-medium text-gray-800">Fajr</span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {salah.fajr ? '20%' : '0%'}
            </span>
          </div>

          {/* Sunnah Before Dhuhr */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.sunnahBeforeDhuhr > 0}
                  onChange={(e) => onChange({ ...salah, sunnahBeforeDhuhr: e.target.checked ? 4 : 0 })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="ml-2 text-sm font-medium text-purple-800">Sunnah Before Zuhar</span>
              </label>
            </div>
            {salah.sunnahBeforeDhuhr > 0 && (
              <div className="flex gap-3 ml-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahBeforeDhuhr === 2}
                    onChange={() => onChange({ ...salah, sunnahBeforeDhuhr: 2 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">2 Rakaat</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahBeforeDhuhr === 4}
                    onChange={() => onChange({ ...salah, sunnahBeforeDhuhr: 4 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">4 Rakaat</span>
                </label>
              </div>
            )}
          </div>

          {/* Dhuhr */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={salah.dhuhr}
                onChange={(e) => handleCheckboxChange('dhuhr', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-base font-medium text-gray-800">Zuhar
              </span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {salah.dhuhr ? '20%' : '0%'}
            </span>
          </div>

          {/* Sunnah After Dhuhr */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.sunnahAfterDhuhr > 0}
                  onChange={(e) => onChange({ ...salah, sunnahAfterDhuhr: e.target.checked ? 4 : 0 })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="ml-2 text-sm font-medium text-purple-800">Sunnah After Zuhar</span>
              </label>
            </div>
            {salah.sunnahAfterDhuhr > 0 && (
              <div className="flex gap-3 ml-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahAfterDhuhr === 2}
                    onChange={() => onChange({ ...salah, sunnahAfterDhuhr: 2 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">2 Rakaat</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahAfterDhuhr === 4}
                    onChange={() => onChange({ ...salah, sunnahAfterDhuhr: 4 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">4 Rakaat</span>
                </label>
              </div>
            )}
          </div>

          {/* Sunnah Before Asr */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.sunnahBeforeAsr > 0}
                  onChange={(e) => onChange({ ...salah, sunnahBeforeAsr: e.target.checked ? 4 : 0 })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="ml-2 text-sm font-medium text-purple-800">Sunnah Before Asr</span>
              </label>
            </div>
            {salah.sunnahBeforeAsr > 0 && (
              <div className="flex gap-3 ml-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahBeforeAsr === 2}
                    onChange={() => onChange({ ...salah, sunnahBeforeAsr: 2 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">2 Rakaat</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={salah.sunnahBeforeAsr === 4}
                    onChange={() => onChange({ ...salah, sunnahBeforeAsr: 4 })}
                    className="w-3 h-3 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="ml-1 text-xs text-purple-700">4 Rakaat</span>
                </label>
              </div>
            )}
          </div>

          {/* Asr */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={salah.asr}
                onChange={(e) => handleCheckboxChange('asr', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-base font-medium text-gray-800">Asr</span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {salah.asr ? '20%' : '0%'}
            </span>
          </div>

          {/* Sunnah befor Maghrib */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.sunnahBeforeMaghrib === 2}
                onChange={(e) => onChange({ ...salah, sunnahBeforeMaghrib: e.target.checked ? 2 : 0 })}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-purple-800">Sunnah before Maghrib (2 Rakaat)</span>
            </label>
          </div>

          {/* Maghrib */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={salah.maghrib}
                onChange={(e) => handleCheckboxChange('maghrib', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-base font-medium text-gray-800">Maghrib</span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {salah.maghrib ? '20%' : '0%'}
            </span>
          </div>

          {/* Sunnah After Maghrib */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.sunnahAfterMaghrib === 2}
                onChange={(e) => onChange({ ...salah, sunnahAfterMaghrib: e.target.checked ? 2 : 0 })}
                disabled={isLocked}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm font-medium text-purple-800">Sunnah After Maghrib (2 Rakaat)</span>
            </label>
          </div>

          {/* Awwabeen (Nafl after Maghrib) */}
          <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.awwabeen > 0}
                  onChange={(e) => !isLocked && onChange({ 
                    ...salah, 
                    awwabeen: e.target.checked ? 6 : 0 
                  })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-2 focus:ring-pink-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm font-medium text-pink-800">Awwabeen (After Maghrib)</span>
              </label>
            </div>
            {salah.awwabeen > 0 && (
              <div className="flex gap-3 ml-6">
                {[2, 4, 6].map(count => (
                  <label key={count} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={salah.awwabeen === count}
                      onChange={() => !isLocked && onChange({ ...salah, awwabeen: count })}
                      disabled={isLocked}
                      className="w-3 h-3 text-pink-600 focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-1 text-xs text-pink-700">{count} Rakaat</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sunnah Before Isha */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.sunnahBeforeIsha === 2}
                onChange={(e) => onChange({ ...salah, sunnahBeforeIsha: e.target.checked ? 2 : 0 })}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-purple-800">Sunnah Before Isha (2 Rakaat)</span>
            </label>
          </div>

          {/* Isha */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={salah.isha}
                onChange={(e) => handleCheckboxChange('isha', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
              <span className="ml-3 text-base font-medium text-gray-800">Isha</span>
            </label>
            <span className="text-sm font-semibold text-gray-600">
              {salah.isha ? '20%' : '0%'}
            </span>
          </div>

          {/* Sunnah After Isha */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.sunnahAfterIsha === 2}
                onChange={(e) => onChange({ ...salah, sunnahAfterIsha: e.target.checked ? 2 : 0 })}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-purple-800">Sunnah After Isha (2 Rakaat)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Progress Bar for Fard */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Fard Completion</span>
          <span className="text-sm font-bold text-green-600">
            {Math.round(fardScore)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${fardScore}%` }}
          ></div>
        </div>
      </div>

      {/* Extra Salah Section */}
      <div className="border-t border-gray-200 pt-4 md:pt-6">
        <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-4">
          Extra Prayers (Bonus)
        </h3>
        <div className="space-y-4">
          {/* Tahajjud */}
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.tahajjud > 0}
                  onChange={(e) => !isLocked && onChange({ 
                    ...salah, 
                    tahajjud: e.target.checked ? 2 : 0 
                  })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm font-medium text-indigo-800">Tahajjud</span>
              </label>
            </div>
            {salah.tahajjud > 0 && (
              <div className="flex gap-3 ml-6">
                {[2, 4, 6, 8].map(count => (
                  <label key={count} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={salah.tahajjud === count}
                      onChange={() => !isLocked && onChange({ ...salah, tahajjud: count })}
                      disabled={isLocked}
                      className="w-3 h-3 text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-1 text-xs text-indigo-700">{count} Rakaat</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ishraq (Duha) */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={salah.duha > 0}
                  onChange={(e) => !isLocked && onChange({ 
                    ...salah, 
                    duha: e.target.checked ? 2 : 0 
                  })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-2 focus:ring-yellow-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm font-medium text-yellow-800">Ishraq (Duha)</span>
              </label>
            </div>
            {salah.duha > 0 && (
              <div className="flex gap-3 ml-6">
                {[2, 4, 6, 8].map(count => (
                  <label key={count} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={salah.duha === count}
                      onChange={() => !isLocked && onChange({ ...salah, duha: count })}
                      disabled={isLocked}
                      className="w-3 h-3 text-yellow-600 focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-1 text-xs text-yellow-700">{count} Rakaat</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Witr */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={salah.witr}
                onChange={(e) => !isLocked && handleCheckboxChange('witr', e.target.checked)}
                disabled={isLocked}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Witr</span>
            </label>
          </div>
        </div>

        {/* Taraweeh Rakaat Slider */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Taraweeh Rakaat Count
            </label>
            <span className="text-sm font-bold text-emerald-600">
              {salah.taraweeh || 0} Rakaat
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="2"
            value={salah.taraweeh || 0}
            onChange={(e) => onChange({ ...salah, taraweeh: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between mt-1 px-0.5">
            {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(val => (
              <span key={val} className={`text-[10px] ${salah.taraweeh === val ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Total Salah Score */}
      <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-800">
            Total Salah Score 
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {Math.round(totalScore)}%
          </span>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SalahCard;
