import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SalahCard from '../components/BoysSalahCard';
import QuranCard from '../components/QuranCard';
import DhikrCard from '../components/DhikrCard';
import DisciplineCard from '../components/DisciplineCard';
import GratitudeCard from '../components/GratitudeCard';
import GoodDeedsCard from '../components/GoodDeedsCard';
import FinalSummary from '../components/FinalSummary';
import Footer from '../components/Footer';
import { loadData, getDayData, updateDayData } from '../utils/storage';
import { updateQuranGlobalState } from '../utils/quranState';
import { calculateFinalScore } from '../utils/scoring';
import { Link } from 'react-router-dom';

function Boys() {
  const [allData, setAllData] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [dayData, setDayData] = useState(null);
  const [scores, setScores] = useState({
    salah: 0,
    quran: 0,
    dhikr: 0,
    discipline: 0,
    goodDeeds: 0,
    final: 0
  });

  // Initialize data on mount
  useEffect(() => {
    const data = loadData();
    setAllData(data);
    setCurrentDay(data.currentDay);
    const currentDayData = getDayData(data, data.currentDay);
    setDayData(currentDayData);
  }, []);

  // Recalculate scores whenever dayData changes
  useEffect(() => {
    if (dayData) {
      const newScores = calculateFinalScore(dayData);
      setScores(newScores);
    }
  }, [dayData]);

  // Handle day change
  const handleDayChange = (newDay) => {
    if (newDay < 1 || newDay > 30) return;
    
    const newDayData = getDayData(allData, newDay);
    setCurrentDay(newDay);
    setDayData(newDayData);
    
    // Update current day in storage
    const updatedAllData = { ...allData, currentDay: newDay };
    setAllData(updatedAllData);
  };

  // Generic update function
  const updateField = (field, value) => {
    const updatedDayData = { ...dayData, [field]: value };
    setDayData(updatedDayData);
    
    // Save to localStorage
    let updatedAllData = updateDayData(allData, currentDay, updatedDayData);
    
    // If updating Quran, sync global state across all days
    if (field === 'quran') {
      updatedAllData = updateQuranGlobalState(updatedAllData, currentDay, updatedDayData);
      // Re-fetch current day data with updated global state
      const refreshedDayData = updatedAllData.days[currentDay];
      setDayData(refreshedDayData);
    }
    
    setAllData(updatedAllData);
  };

  if (!dayData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-2xl font-bold text-gray-700">Loading...</div>
      </div>
    );
  }

  // Calculate isLocked - same logic as Sidebar
  const RAMADAN_START = new Date('2026-02-01');
  const today = new Date();
  const diffTime = today - RAMADAN_START;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const actualCurrentDay = Math.max(1, Math.min(diffDays, 30));
  const isLocked = currentDay < actualCurrentDay;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-screen bg-blue-50">
      {/* Sidebar */}
      <Sidebar
        currentDay={currentDay}
        scores={scores}
        onDayChange={handleDayChange}
        allData={allData}
      />

      {/* Main Content */}
      <div className="lg:col-span-9 space-y-6 md:space-y-8 p-4 md:p-6 lg:p-10">
        {/* Navigation Switcher */}
        <div className="flex justify-end mb-4">
           <Link to="/girls" className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium text-sm flex items-center gap-2">
             <span>Switch to Girls View 🧕</span>
           </Link>
        </div>

        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-400">
           <h2 className="text-lg font-bold text-blue-700">🕌 Boys Dashboard</h2>
           <p className="text-gray-600 text-sm">Stay consistent and maximize your rewards.</p>
        </div>

        <SalahCard
          salah={dayData.salah}
          onChange={(value) => updateField('salah', value)}
          isLocked={isLocked}
        />

        <QuranCard
          quran={dayData.quran}
          onChange={(value) => updateField('quran', value)}
          currentDay={currentDay}
          allData={allData}
          isLocked={isLocked}
        />

        <DhikrCard
          dhikr={dayData.dhikr}
          onChange={(value) => updateField('dhikr', value)}
          isLocked={isLocked}
        />

        <DisciplineCard
          discipline={dayData.discipline}
          onChange={(value) => updateField('discipline', value)}
          isLocked={isLocked}
        />

        <GratitudeCard
          gratitude={dayData.gratitude}
          onChange={(value) => updateField('gratitude', value)}
          isLocked={isLocked}
        />

        <GoodDeedsCard
          goodDeeds={dayData.goodDeeds}
          onChange={(value) => updateField('goodDeeds', value)}
          isLocked={isLocked}
        />

        <FinalSummary scores={scores} />
        
        <Footer />
      </div>
    </div>
  );
}

export default Boys;
