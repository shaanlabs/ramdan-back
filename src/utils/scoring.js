// Scoring weights for final performance calculation
export const WEIGHTS = {
  salah: 0.40,      // 40%
  quran: 0.20,      // 20%
  dhikr: 0.15,      // 15%
  discipline: 0.15, // 15%
  goodDeeds: 0.10   // 10%
  // gratitude: no weight (reflection only)
};

// Daily targets
export const TARGETS = {
  quranPages: 20,
  dhikr: {
    subhanallah: 300,
    alhamdulillah: 300,
    allahuAkbar: 300,
    daroodh: 100
  },
  maxScreenTime: 5 // hours
};

// Good deed points
export const DEED_POINTS = {
  small: 5,
  medium: 10,
  big: 20
};

// Calculate Salah score (0-100% max)
export const calculateSalahScore = (salah) => {
  // Calculate Fard score based on type
  // Takbir-e-Ula = 20, Jamaat = 15, Ada = 5
  // Boolean true (Girls/Legacy) = 20 (Full points)
  const getPrayerPoints = (val) => {
    if (val === true) return 20;
    if (val === 'takbir') return 20;
    if (val === 'jamaat') return 15;
    if (val === 'ada') return 5;
    return 0;
  };

  const fardPoints = [
    salah.fajr,
    salah.dhuhr,
    salah.asr,
    salah.maghrib,
    salah.isha
  ].reduce((sum, val) => sum + getPrayerPoints(val), 0);

  // Fard prayers = 50% of Total Score
  // fardPoints (0-100) maps to 50% max
  const fardValues = fardPoints; // Keep raw 0-100 for display logic if needed
  const fardPercentage = fardPoints * 0.5; // Scale to 50% weight

  // Extra salah bonuses (adjusted to max 50% total)
  let bonus = 0;

  // Proportional bonus based on Rakaat counts
  // Tahajjud: Target 4 rakaat for full 12% bonus
  const tahajjudBonus = Math.min((salah.tahajjud || 0) / 4 * 12, 12);
  bonus += tahajjudBonus;

  // Ishraq/Duha: Target 4 rakaat for full 8% bonus
  const duhaBonus = Math.min((salah.duha || 0) / 4 * 8, 8);
  bonus += duhaBonus;

  // Awwabeen: Target 6 rakaat for full 6% bonus
  const awwabeenBonus = Math.min((salah.awwabeen || 0) / 6 * 6, 6);
  bonus += awwabeenBonus;

  // Taraweeh bonus (up to 10% for 20 rakaat, adjusted down from 12%)
  const taraweehBonus = Math.min((salah.taraweeh || 0) / 20 * 10, 10);
  bonus += taraweehBonus;

  if (salah.witr) bonus += 4;  // 4%

  // All Sunnah prayers combined (up to 14% for all)
  // Fajr (2) + before Dhuhr (4) + after Dhuhr (4) + before Asr (4) + after Maghrib (2) + before Isha (2) + after Isha (2) = 20 rakaat max
  const totalSunnah = (salah.sunnahFajr || 0) +
    (salah.sunnahBeforeDhuhr || 0) +
    (salah.sunnahAfterDhuhr || 0) +
    (salah.sunnahBeforeAsr || 0) +
    (salah.sunnahBeforeMaghrib || 0) +
    (salah.sunnahAfterMaghrib || 0) +
    (salah.sunnahBeforeIsha || 0) +
    (salah.sunnahAfterIsha || 0);
  const sunnahBonus = Math.min(totalSunnah / 22 * 14, 14);
  bonus += sunnahBonus;

  // Total bonuses: 12+8+6+10+4+14 = 54% (capped at 50% max)
  // Total = Fard (Weighted 50%) + Bonuses (max 50%) = 100% max
  return Math.min(fardPercentage + bonus, 100);
};

// Calculate Quran score (0-100%)
export const calculateQuranScore = (quran) => {
  const pages = quran.pagesRead || 0;
  // Prevent negative scores (when backward reading)
  const positivePages = Math.max(pages, 0);
  return Math.min((positivePages / TARGETS.quranPages) * 100, 100);
};

// Calculate Dhikr score (0-100%)
export const calculateDhikrScore = (dhikr) => {
  const subhanallahPercent = Math.min((dhikr.subhanallah || 0) / TARGETS.dhikr.subhanallah, 1);
  const alhamdulillahPercent = Math.min((dhikr.alhamdulillah || 0) / TARGETS.dhikr.alhamdulillah, 1);
  const allahuAkbarPercent = Math.min((dhikr.allahuAkbar || 0) / TARGETS.dhikr.allahuAkbar, 1);
  const daroodhPercent = Math.min((dhikr.daroodh || 0) / TARGETS.dhikr.daroodh, 1);

  return ((subhanallahPercent + alhamdulillahPercent + allahuAkbarPercent + daroodhPercent) / 4) * 100;  // ✅ Divided by 4
};


// Calculate Discipline score (0-100%)
export const calculateDisciplineScore = (screenTime) => {
  if (screenTime <= 1) return 100;
  if (screenTime <= 2) return 85;
  if (screenTime <= 3) return 70;
  if (screenTime <= 4) return 50;
  return 25;
};

// Calculate Good Deeds score (0-100%)
export const calculateGoodDeedsScore = (goodDeeds) => {
  const totalPoints = goodDeeds.reduce((sum, deed) => {
    // Each good deed with content = 20 points
    if (deed && deed.trim()) return sum + 20;
    return sum;
  }, 0);

  // Max possible: 5 deeds = 100 points
  return Math.min((totalPoints / 100) * 100, 100);
};

// Calculate final weighted score
export const calculateFinalScore = (dailyData) => {
  const salahScore = calculateSalahScore(dailyData.salah);
  const quranScore = calculateQuranScore(dailyData.quran);
  const dhikrScore = calculateDhikrScore(dailyData.dhikr);
  const disciplineScore = calculateDisciplineScore(dailyData.discipline.screenTime);
  const goodDeedsScore = dailyData.goodDeeds && dailyData.goodDeeds.length > 0
    ? calculateGoodDeedsScore(dailyData.goodDeeds)
    : 0;

  const finalScore =
    salahScore * WEIGHTS.salah +
    quranScore * WEIGHTS.quran +
    dhikrScore * WEIGHTS.dhikr +
    disciplineScore * WEIGHTS.discipline +
    goodDeedsScore * WEIGHTS.goodDeeds;

  return {
    salah: Math.round(salahScore),
    quran: Math.round(quranScore),
    dhikr: Math.round(dhikrScore),
    discipline: Math.round(disciplineScore),
    goodDeeds: Math.round(goodDeedsScore),
    final: Math.round(finalScore)
  };
};
