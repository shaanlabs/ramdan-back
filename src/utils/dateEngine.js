/**
 * Date Engine for Ramadan Tracker
 * 
 * Timezone: Asia/Kolkata (IST)
 * Cutoff: 12:30 AM — if current time < 00:30, treat as previous date
 * Ramadan Day = (appDate - Feb 19, 2026) + 1, clamped 1–30
 */

const RAMADAN_START = new Date('2026-02-19T00:00:00+05:30'); // Day 1 = Feb 19, 2026
const CUTOFF_HOUR = 0;
const CUTOFF_MINUTE = 30;

/**
 * Get the current IST date/time components
 */
function getISTComponents() {
    const now = new Date();
    // Convert to IST using Intl
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    return istDate;
}

/**
 * Get the "app date" considering the 12:30 AM cutoff.
 * If current IST time is before 00:30, the app date is the previous day.
 * Returns a Date object set to midnight of the app date (IST).
 */
export function getAppDate() {
    const ist = getISTComponents();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();

    // If time is before 12:30 AM, use previous day
    if (hours === CUTOFF_HOUR && minutes < CUTOFF_MINUTE) {
        ist.setDate(ist.getDate() - 1);
    }

    // Reset to midnight for clean date comparison
    ist.setHours(0, 0, 0, 0);
    return ist;
}

/**
 * Get the app date as a YYYY-MM-DD string (for database operations)
 */
export function getAppDateString() {
    const appDate = getAppDate();
    const year = appDate.getFullYear();
    const month = String(appDate.getMonth() + 1).padStart(2, '0');
    const day = String(appDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate the Ramadan day number (1-30) from a given date.
 * Ramadan Day = (date - Feb 19, 2026) + 1, clamped between 1 and 30.
 */
export function getRamadanDay(appDate = null) {
    const date = appDate || getAppDate();
    const start = new Date(RAMADAN_START);
    start.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, Math.min(diffDays, 30));
}

/**
 * Get a formatted date string for a given Ramadan day number
 */
export function getDateForRamadanDay(dayNum) {
    const date = new Date(RAMADAN_START);
    date.setDate(date.getDate() + dayNum - 1);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Get the date string (YYYY-MM-DD) for a given Ramadan day number
 */
export function getDateStringForRamadanDay(dayNum) {
    const date = new Date(RAMADAN_START);
    date.setDate(date.getDate() + dayNum - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
