// localStorage key
const STORAGE_KEY = 'ramadan_tracker_2026';

// Get empty day structure
export const getEmptyDayData = () => ({
  date: new Date().toISOString().split('T')[0],
  salah: {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    tahajjud: 0,
    duha: 0,
    taraweeh: 0,
    witr: false,
    sunnahFajr: 0,         // 0 or 2
    sunnahBeforeDhuhr: 0,  // 0, 2, or 4
    sunnahAfterDhuhr: 0,   // 0, 2, or 4
    sunnahBeforeAsr: 0,    // 0, 2, or 4
    sunnahBeforeMaghrib: 0,// 0 or 2
    sunnahAfterMaghrib: 0, // 0 or 2
    sunnahBeforeIsha: 0,   // 0 or 2
    sunnahAfterIsha: 0,    // 0 or 2
    awwabeen: 0            // 0, 2, 4, or 6
  },
  quran: {
    startPage: 0,        // Daily start page (2-612)
    endPage: 0,          // Daily end page (2-612)
    totalPagesRead: 0,   // Cumulative total across all days (global)
    currentPage: 2,      // Current position in Quran (2-612, global)
    khatamCount: 0       // Number of completions (global)
  },
  dhikr: {
    subhanallah: 0,
    alhamdulillah: 0,
    allahuAkbar: 0
  },
  discipline: {
    screenTime: 0
  },
  gratitude: ['', '', ''],
  goodDeeds: ['', '', '', '', '']
});

// Initialize storage structure
const initializeStorage = () => {
  const data = {
    ramadanYear: 2026,
    currentDay: 1,
    days: {
      '1': getEmptyDayData()
    }
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
};

// Load all data from localStorage
export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initializeStorage();
    }
    
    const data = JSON.parse(stored);
    
    // Migrate old good deeds format (objects) to new format (strings)
    if (data.days) {
      Object.keys(data.days).forEach(dayKey => {
        const day = data.days[dayKey];
        
        // Migrate good deeds
        if (day.goodDeeds && day.goodDeeds.length > 0) {
          if (typeof day.goodDeeds[0] === 'object' && day.goodDeeds[0].description !== undefined) {
            day.goodDeeds = day.goodDeeds.map(deed => deed.description || '');
          }
        }
        
        // Migrate old quran format to new format
        if (day.quran && day.quran.pages !== undefined) {
          day.quran = {
            startPage: 0,
            endPage: 0,
            pagesRead: day.quran.pages || 0,
            totalPagesRead: day.quran.pages || 0,
            currentPage: 2,
            khatamCount: 0
          };
        }
      });
      // Save migrated data
      saveData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return initializeStorage();
  }
};

// Save all data to localStorage
export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Get data for a specific day
export const getDayData = (allData, dayNumber) => {
  if (!allData.days[dayNumber]) {
    allData.days[dayNumber] = getEmptyDayData();
  }
  return allData.days[dayNumber];
};

// Update data for a specific day
export const updateDayData = (allData, dayNumber, updatedDayData) => {
  const newData = {
    ...allData,
    days: {
      ...allData.days,
      [dayNumber]: updatedDayData
    }
  };
  saveData(newData);
  return newData;
};
