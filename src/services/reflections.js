import { supabase } from '../lib/supabase';

/**
 * Fetch gratitude + good deeds for a daily record.
 * Stored directly on daily_ramadan_tracker.
 * Returns null (silently) if columns don't exist yet (migration not run).
 */
export async function fetchReflections(dailyId) {
    if (!dailyId) return null;
    try {
        const { data, error } = await supabase
            .from('daily_ramadan_tracker')
            .select('gratitude_1, gratitude_2, gratitude_3, good_deed_1, good_deed_2, good_deed_3, good_deed_4, good_deed_5')
            .eq('id', dailyId)
            .maybeSingle();

        if (error) {
            // Columns don't exist yet — return null gracefully
            if (error.message?.includes('column') || error.message?.includes('gratitude')) {
                console.warn('[reflections] columns not found — run SQL migration');
                return null;
            }
            throw error;
        }
        return data;
    } catch (err) {
        console.warn('[reflections] fetchReflections error (non-fatal):', err.message);
        return null;
    }
}

/**
 * Save gratitude + good deeds to daily_ramadan_tracker.
 * Silently skips if columns don't exist yet.
 */
export async function upsertReflections(dailyId, reflectionsData) {
    if (!dailyId) {
        console.error('[reflections] upsertReflections called with no dailyId — skipping');
        return null;
    }

    const gratitude = reflectionsData.gratitude || ['', '', ''];
    const goodDeeds = reflectionsData.goodDeeds || ['', '', '', '', ''];

    const payload = {
        gratitude_1: gratitude[0] || '',
        gratitude_2: gratitude[1] || '',
        gratitude_3: gratitude[2] || '',
        good_deed_1: goodDeeds[0] || '',
        good_deed_2: goodDeeds[1] || '',
        good_deed_3: goodDeeds[2] || '',
        good_deed_4: goodDeeds[3] || '',
        good_deed_5: goodDeeds[4] || '',
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('daily_ramadan_tracker')
        .update(payload)
        .eq('id', dailyId)
        .select()
        .single();

    if (error) {
        // Columns don't exist yet — skip silently, don't crash the app
        if (error.message?.includes('column') || error.message?.includes('gratitude') || error.message?.includes('good_deed')) {
            console.warn('[reflections] columns missing — run SQL migration to persist gratitude/good deeds');
            return null;
        }
        console.error('[reflections] upsert error:', error.message, '|', error.details);
        throw error;
    }
    console.log('[reflections] saved ✓');
    return data;
}

/**
 * Convert DB record → frontend reflections state
 */
export function dbToFrontendReflections(dbRecord) {
    if (!dbRecord) return getDefaultReflections();
    return {
        gratitude: [
            dbRecord.gratitude_1 || '',
            dbRecord.gratitude_2 || '',
            dbRecord.gratitude_3 || '',
        ],
        goodDeeds: [
            dbRecord.good_deed_1 || '',
            dbRecord.good_deed_2 || '',
            dbRecord.good_deed_3 || '',
            dbRecord.good_deed_4 || '',
            dbRecord.good_deed_5 || '',
        ],
    };
}

/**
 * Default reflections state
 */
export function getDefaultReflections() {
    return {
        gratitude: ['', '', ''],
        goodDeeds: ['', '', '', '', ''],
    };
}

