// Helper function to update global Quran progress
export const updateQuranGlobalState = (allData, dayNumber, updatedDayData) => {
  // Calculate cumulative pages read from all days
  let totalPagesRead = 0;
  let currentPage = 2;
  let khatamCount = 0;

  // Sort day keys to ensure chronological order
  const dayKeys = Object.keys(allData.days).map(Number).sort((a, b) => a - b);
  
  dayKeys.forEach((key) => {
    const day = key === dayNumber ? updatedDayData : allData.days[key];
    if (day.quran && day.quran.startPage && day.quran.endPage) {
      // Calculate pagesRead dynamically
      const pagesRead = day.quran.endPage - day.quran.startPage;
      if (pagesRead > 0) {
        totalPagesRead += pagesRead;
      }
    }
  });

  // Calculate current page and khatam count
  // Each Khatam = 610 pages (page 2 to 612)
  const PAGES_PER_KHATAM = 610;
  
  khatamCount = Math.floor(totalPagesRead / PAGES_PER_KHATAM);
  const pagesInCurrentKhatam = totalPagesRead % PAGES_PER_KHATAM;
  
  // Current page = 2 + remainder (auto-resets to 2 after each Khatam)
  currentPage = 2 + pagesInCurrentKhatam;
  
  // If exactly at or past 612, reset to 2 for next Khatam
  if (currentPage >= 612) {
    currentPage = 2;
  }

  // Update all days with global state
  const updatedDays = { ...allData.days };
  Object.keys(updatedDays).forEach((key) => {
    if (updatedDays[key].quran) {
      updatedDays[key].quran.totalPagesRead = totalPagesRead;
      updatedDays[key].quran.currentPage = currentPage;
      updatedDays[key].quran.khatamCount = khatamCount;
    }
  });

  return {
    ...allData,
    days: updatedDays
  };
};
