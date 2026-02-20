import { supabase } from '../lib/supabase';

/**
 * Fetch dhikr scores for a daily record
 */
export async function fetchDhikr(dailyId) {
    const { data, error } = await supabase
        .from('dhikr_scores')
        .select('*')
        .eq('daily_id', dailyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Upsert dhikr scores for a daily record
 */
export async function upsertDhikr(dailyId, dhikrData) {
    if (!dailyId) {
        console.error('[dhikr] upsertDhikr called with no dailyId — skipping');
        return null;
    }
    const payload = {
        daily_id: dailyId,
        subhanallah: dhikrData.subhanallah || 0,
        alhamdulillah: dhikrData.alhamdulillah || 0,
        allahuakbar: dhikrData.allahuAkbar || 0,
        astaghfirullah: dhikrData.astaghfirullah || 0,
        durood: dhikrData.daroodh || 0,
    };

    const { data, error } = await supabase
        .from('dhikr_scores')
        .upsert(payload, { onConflict: 'daily_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Convert DB dhikr record to frontend state
 */
export function dbToFrontendDhikr(dbRecord) {
    if (!dbRecord) return getDefaultDhikr();
    return {
        subhanallah: dbRecord.subhanallah || 0,
        alhamdulillah: dbRecord.alhamdulillah || 0,
        allahuAkbar: dbRecord.allahuakbar || 0,
        astaghfirullah: dbRecord.astaghfirullah || 0,
        daroodh: dbRecord.durood || 0,
    };
}

/**
 * Default dhikr state
 */
export function getDefaultDhikr() {
    return {
        subhanallah: 0,
        alhamdulillah: 0,
        allahuAkbar: 0,
        astaghfirullah: 0,
        daroodh: 0,
    };
}
