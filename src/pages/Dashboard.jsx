import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import BoysSalahCard from '../components/BoysSalahCard';
import GirlsSalahCard from '../components/GirlsSalahCard';
import QuranCard from '../components/QuranCard';
import DhikrCard from '../components/DhikrCard';
import DisciplineCard from '../components/DisciplineCard';
import GratitudeCard from '../components/GratitudeCard';
import GoodDeedsCard from '../components/GoodDeedsCard';
import FinalSummary from '../components/FinalSummary';
import Leaderboard from '../components/Leaderboard';
import Footer from '../components/Footer';

import { getOrCreateDailyRecord, fetchDailyRecord, getTodayDailyId, updateFinalScore } from '../services/daily';
import { fetchSalah, upsertSalah, dbToFrontendSalahBoys, dbToFrontendSalahGirls, getDefaultSalah } from '../services/salah';
import { fetchQuran, upsertQuran, dbToFrontendQuran, getDefaultQuran } from '../services/quran';
import { fetchDhikr, upsertDhikr, dbToFrontendDhikr, getDefaultDhikr } from '../services/dhikr';
import { fetchDiscipline, upsertDiscipline, dbToFrontendDiscipline } from '../services/discipline';
import { fetchReflections, upsertReflections, dbToFrontendReflections, getDefaultReflections } from '../services/reflections';
import { upsertDailyScores } from '../services/scores';
import { calculateFinalScore } from '../utils/scoring';
import { getDateStringForRamadanDay } from '../utils/dateEngine';

function Dashboard() {
    const { user, profile, ramadanDay, appDate, dailyId, loadDailyRecord, dailyRecord } = useAuth();

    const [currentDay, setCurrentDay] = useState(ramadanDay);
    const [currentDailyId, setCurrentDailyId] = useState(dailyId);
    const [currentRecord, setCurrentRecord] = useState(dailyRecord);
    const [salah, setSalah] = useState(getDefaultSalah());
    const [quran, setQuran] = useState(getDefaultQuran());
    const [dhikr, setDhikr] = useState(getDefaultDhikr());
    const [discipline, setDiscipline] = useState({ screenTime: 0 });
    const [reflections, setReflections] = useState(getDefaultReflections());
    const [scores, setScores] = useState({
        salah: 0, quran: 0, dhikr: 0, discipline: 0, goodDeeds: 0, final: 0,
    });
    const [dataLoading, setDataLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Debounce timer refs
    const salahTimer = useRef(null);
    const quranTimer = useRef(null);
    const scoreTimer = useRef(null);
    const dhikrTimer = useRef(null);
    const disciplineTimer = useRef(null);
    const reflectionsTimer = useRef(null);
    const scoresTimer = useRef(null);

    const isBoy = profile?.gender === 'boy';
    const isAdmin = user?.email?.toLowerCase() === 'itsshanukz897@gmail.com';
    const isLocked = currentRecord?.locked === true || currentDay < ramadanDay;

    // ── Auto-load on EVERY mount/refresh — never depends on AuthContext dailyId ──
    // This guarantees data survives 1000+ refreshes.
    useEffect(() => {
        if (!profile) return; // Wait for profile to be ready

        const loadData = async () => {
            setDataLoading(true);
            try {
                // Always fetch fresh daily record directly from Supabase
                const record = await getOrCreateDailyRecord(appDate, ramadanDay);
                if (!record) {
                    setDataLoading(false);
                    return;
                }

                setCurrentDailyId(record.id);
                setCurrentRecord(record);
                setCurrentDay(ramadanDay);
                await loadModuleData(record.id);
            } catch (err) {
                console.error('[Dashboard] Failed to load daily record:', err);
                setDataLoading(false);
            }
        };

        loadData();
    }, [profile, appDate, ramadanDay]); // Re-runs if profile or date changes


    // Load all module data for a given daily_id
    async function loadModuleData(dId) {
        // GUARD: never query Supabase with undefined/null — causes 400 errors
        if (!dId) {
            console.warn('[Dashboard] loadModuleData called with no dailyId — skipping');
            setDataLoading(false);
            return;
        }

        setDataLoading(true);
        try {
            const [salahData, quranData, dhikrData, disciplineData, reflectionsData] = await Promise.all([
                fetchSalah(dId),
                fetchQuran(dId),
                fetchDhikr(dId),
                fetchDiscipline(dId),
                fetchReflections(dId),
            ]);

            const frontendSalah = isBoy
                ? dbToFrontendSalahBoys(salahData)
                : dbToFrontendSalahGirls(salahData);
            const frontendQuran = dbToFrontendQuran(quranData);
            const frontendDhikr = dbToFrontendDhikr(dhikrData);
            const frontendDiscipline = dbToFrontendDiscipline(disciplineData);
            const frontendReflections = dbToFrontendReflections(reflectionsData);

            setSalah(frontendSalah);
            setQuran(frontendQuran);
            setDhikr(frontendDhikr);
            setDiscipline(frontendDiscipline);
            setReflections(frontendReflections);
        } catch (error) {
            console.error('Error loading module data:', error);
        } finally {
            setDataLoading(false);
        }
    }

    // Recalculate scores when data changes and persist them to daily_ramadan_tracker
    useEffect(() => {
        const dayData = {
            salah,
            quran,
            dhikr,
            discipline,
            goodDeeds: reflections.goodDeeds,
        };
        const newScores = calculateFinalScore(dayData);
        setScores(newScores);


    // Persist final_score to DB whenever scores change (debounced 600ms)
    // Only save for today's active day — locked/past days are read-only
    useEffect(() => {
        if (isLocked) return; // don't overwrite locked past-day scores
        if (!currentDailyId) return;
        if (dataLoading) return; // don't save stale zeros during load

        if (scoreTimer.current) clearTimeout(scoreTimer.current);
        scoreTimer.current = setTimeout(() => {
            updateFinalScore(currentDailyId, scores.final);
        }, 600);

        return () => clearTimeout(scoreTimer.current);
    }, [scores.final, currentDailyId, isLocked, dataLoading]);
    
        // Persist aggregate scores only when we have a daily record and the day is editable
        if (!currentDailyId || isLocked) return;

        debouncedSave(
            scoresTimer,
            () => upsertDailyScores(currentDailyId, newScores),
            600
        );
    }, [salah, quran, dhikr, discipline, reflections, currentDailyId, isLocked]);

    // Day change handler
    const handleDayChange = async (newDay) => {
        if (newDay < 1 || newDay > 30 || newDay > ramadanDay) return;

        setCurrentDay(newDay);
        setDataLoading(true);

        try {
            const dateStr = getDateStringForRamadanDay(newDay);
            const record = await getOrCreateDailyRecord(dateStr, newDay);
            if (record) {
                setCurrentDailyId(record.id);
                setCurrentRecord(record);
                await loadModuleData(record.id);
            }
        } catch (error) {
            console.error('Error changing day:', error);
            setDataLoading(false);
        }
    };

    // Immediate save (for checkboxes — no delay)
    // Falls back to fetching a fresh dailyId if state is stale/null
    const immediateSave = async (saveFn) => {
        try {
            let dId = currentDailyId;
            if (!dId) {
                // State not hydrated yet — fetch fresh from DB
                dId = await getTodayDailyId(appDate);
                if (dId) setCurrentDailyId(dId);
            }
            if (!dId) {
                console.warn('[Dashboard] immediateSave: no dailyId available, skipping save');
                return;
            }
            await saveFn(dId);
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    // Debounced save (for text/number inputs — 400ms)
    const debouncedSave = (timerRef, saveFn, delay = 400) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            try {
                await saveFn();
            } catch (error) {
                console.error('Error saving:', error);
            }
        }, delay);
    };

    // Salah change handler — immediate save (checkboxes must never be lost)
    const handleSalahChange = (newSalah) => {
        if (isLocked) return;
        setSalah(newSalah);
        immediateSave((dId) => upsertSalah(dId || currentDailyId, newSalah));
    };

    // Quran change handler
    const handleQuranChange = (newQuran) => {
        if (isLocked) return;
        setQuran(newQuran);
        debouncedSave(quranTimer, () => upsertQuran(currentDailyId, newQuran));
    };

    // Dhikr change handler — immediate save
    const handleDhikrChange = (newDhikr) => {
        if (isLocked) return;
        setDhikr(newDhikr);
        immediateSave((dId) => upsertDhikr(dId || currentDailyId, newDhikr));
    };

    // Discipline change handler
    const handleDisciplineChange = (newDiscipline) => {
        if (isLocked) return;
        setDiscipline(newDiscipline);
        debouncedSave(disciplineTimer, () =>
            upsertDiscipline(currentDailyId, newDiscipline.screenTime)
        );
    };

    // Reflections change handler (gratitude + good deeds)
    const handleReflectionsChange = (newReflections) => {
        if (isLocked) return;
        setReflections(newReflections);
        debouncedSave(reflectionsTimer, () =>
            upsertReflections(currentDailyId, newReflections)
            , 600);
    };

    const handleGratitudeChange = (newGratitude) => {
        handleReflectionsChange({ ...reflections, gratitude: newGratitude });
    };

    const handleGoodDeedsChange = (newGoodDeeds) => {
        handleReflectionsChange({ ...reflections, goodDeeds: newGoodDeeds });
    };

    // Loading state
    if (!profile || dataLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isBoy ? 'bg-blue-50' : 'bg-pink-50'}`}>
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading your tracker...</p>
                </div>
            </div>
        );
    }

    const SalahCard = isBoy ? BoysSalahCard : GirlsSalahCard;
    const bgColor = isBoy ? 'bg-blue-50' : 'bg-pink-50';
    const accentColor = isBoy ? 'blue' : 'pink';
    const dashboardEmoji = isBoy ? '🕌' : '🌺';
    const dashboardTitle = isBoy ? 'Boys Dashboard' : 'Girls Dashboard';
    const dashboardSubtitle = isBoy
        ? 'Stay consistent and maximize your rewards.'
        : 'Special tracking for your blessed month.';

    return (
        <div className={`flex flex-col lg:grid lg:grid-cols-12 min-h-screen ${bgColor}`}>
            {/* Sidebar */}
            <Sidebar
                currentDay={currentDay}
                scores={scores}
                onDayChange={handleDayChange}
                ramadanDay={ramadanDay}
            />

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6 md:space-y-8 p-4 md:p-6 lg:p-10">
                {/* Dashboard Header */}
                <div className={`mb-6 bg-white p-4 rounded-xl shadow-sm border-l-4 border-${accentColor}-400`}>
                    <h2 className={`text-lg font-bold text-${accentColor}-700`}>
                        {dashboardEmoji} {dashboardTitle}
                    </h2>
                    <p className="text-gray-600 text-sm">{dashboardSubtitle}</p>
                    {profile && (
                        <p className="text-xs text-gray-500 mt-1">
                            Welcome, <span className="font-semibold">{profile.full_name}</span> • {profile.stream} Year {profile.year}
                        </p>
                    )}
                </div>

                {/* Locked Day Warning */}
                {isLocked && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <p className="text-yellow-800 font-semibold">
                            🔒 This day is locked. You can view your scores but cannot edit.
                        </p>
                        {currentRecord?.final_score != null && (
                            <p className="text-yellow-700 text-sm mt-1">
                                Final Score: <span className="font-bold">{Math.round(currentRecord.final_score)}%</span>
                            </p>
                        )}
                    </div>
                )}

                <SalahCard
                    salah={salah}
                    onChange={handleSalahChange}
                    isLocked={isLocked}
                />

                <QuranCard
                    quran={quran}
                    onChange={handleQuranChange}
                    currentDay={currentDay}
                    isLocked={isLocked}
                />

                <DhikrCard
                    dhikr={dhikr}
                    onChange={handleDhikrChange}
                    isLocked={isLocked}
                />

                <DisciplineCard
                    discipline={discipline}
                    onChange={handleDisciplineChange}
                    isLocked={isLocked}
                />

                <GratitudeCard
                    gratitude={reflections.gratitude}
                    onChange={handleGratitudeChange}
                    isLocked={isLocked}
                />

                <GoodDeedsCard
                    goodDeeds={reflections.goodDeeds}
                    onChange={handleGoodDeedsChange}
                    isLocked={isLocked}
                />

                <FinalSummary
                    scores={scores}
                    lockedScore={isLocked ? currentRecord?.final_score : null}
                />

                {isAdmin && (
                    <Leaderboard />
                )}

                <Footer />
            </div>
        </div>
    );
}

export default Dashboard;
