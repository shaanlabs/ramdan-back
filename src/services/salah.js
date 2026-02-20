import { supabase } from '../lib/supabase';
import { calculateSalahScore } from '../utils/scoring';

/**
 * Fetch salah scores for a daily record
 */
export async function fetchSalah(dailyId) {
    if (!dailyId) return null;
    const { data, error } = await supabase
        .from('salah_scores')
        .select('*')
        .eq('daily_id', dailyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Helper: extract mode from a prayer field value.
 * The UI stores prayer mode directly on the prayer field:
 *   false        → not prayed
 *   'takbir'     → prayed with Takbir-e-Ula
 *   'jamaat'     → prayed in Jamaat
 *   'ada'        → prayed (Ada / alone)
 *   true         → prayed (Girls card — simple boolean)
 */
function getPrayerMode(val) {
    if (!val) return null; // not prayed
    if (val === 'takbir') return 'takbir-ula';
    if (val === 'jamaat') return 'jamaat';
    return 'ada'; // 'ada', true, or any other truthy value
}

/**
 * Upsert salah scores for a daily record.
 *
 * Handles BOTH Boys card (mode stored on prayer field: fajr: 'takbir'/'jamaat'/'ada'/false)
 * and Girls card (simple boolean: fajr: true/false).
 *
 * UI field names used by both cards:
 *   dhuhr (not zuhar), duha (not ishraq)
 *   sunnahBeforeDhuhr, sunnahAfterDhuhr (not BeforeZuhar/AfterZuhar)
 *
 * DB columns:
 *   fajr, zuhar, asr, maghrib, isha → boolean
 *   fajr_jamaat, zuhar_jamaat, etc. → boolean
 *   fajr_takbeer_ula, zuhar_takbeer_ula, etc. → boolean
 *   sunnah_fajr_rakaat, sunnah_before_zuhar_rakaat, etc. → integer
 *   ishraq_rakaat, tahajjud_rakaat, taraweeh_rakaat → integer
 *   witr → boolean
 *   awwabeen_rakaat → integer
 */
export async function upsertSalah(dailyId, salahData) {
    if (!dailyId) {
        console.error('[salah] upsertSalah called with no dailyId — skipping');
        return null;
    }

    // Compute total salah score (0–100) from current UI state
    const totalScore = Math.round(calculateSalahScore(salahData || {}));

    // Extract modes for each prayer (works for both Boys and Girls cards)
    const fajrMode = getPrayerMode(salahData.fajr);
    const zuharMode = getPrayerMode(salahData.dhuhr ?? salahData.zuhar);
    const asrMode = getPrayerMode(salahData.asr);
    const maghribMode = getPrayerMode(salahData.maghrib);
    const ishaMode = getPrayerMode(salahData.isha);

    const payload = {
        daily_id: dailyId,
        updated_at: new Date().toISOString(),

        // ===== FARZ (boolean) =====
        fajr: !!salahData.fajr,
        zuhar: !!(salahData.dhuhr ?? salahData.zuhar),
        asr: !!salahData.asr,
        maghrib: !!salahData.maghrib,
        isha: !!salahData.isha,

        // ===== JAMAAT (boolean) =====
        fajr_jamaat: fajrMode === 'jamaat',
        zuhar_jamaat: zuharMode === 'jamaat',
        asr_jamaat: asrMode === 'jamaat',
        maghrib_jamaat: maghribMode === 'jamaat',
        isha_jamaat: ishaMode === 'jamaat',

        // ===== TAKBEER ULA — per prayer (boolean) =====
        fajr_takbeer_ula: fajrMode === 'takbir-ula',
        zuhar_takbeer_ula: zuharMode === 'takbir-ula',
        asr_takbeer_ula: asrMode === 'takbir-ula',
        maghrib_takbeer_ula: maghribMode === 'takbir-ula',
        isha_takbeer_ula: ishaMode === 'takbir-ula',

        // ===== SUNNAH RAKAAT (integer) =====
        // UI uses sunnahBeforeDhuhr/sunnahAfterDhuhr; also accept zuhar variants
        sunnah_fajr_rakaat: parseInt(salahData.sunnahFajr) || 0,
        sunnah_before_zuhar_rakaat: parseInt(salahData.sunnahBeforeDhuhr ?? salahData.sunnahBeforeZuhar) || 0,
        sunnah_after_zuhar_rakaat: parseInt(salahData.sunnahAfterDhuhr ?? salahData.sunnahAfterZuhar) || 0,
        sunnah_before_asr_rakaat: parseInt(salahData.sunnahBeforeAsr) || 0,
        sunnah_before_maghrib_rakaat: parseInt(salahData.sunnahBeforeMaghrib) || 0,
        sunnah_after_maghrib_rakaat: parseInt(salahData.sunnahAfterMaghrib) || 0,
        sunnah_before_isha_rakaat: parseInt(salahData.sunnahBeforeIsha) || 0,
        sunnah_after_isha_rakaat: parseInt(salahData.sunnahAfterIsha) || 0,
        awwabeen_rakaat: parseInt(salahData.awwabeen) || 0,

        // ===== EXTRA PRAYERS =====
        tahajjud_rakaat: parseInt(salahData.tahajjud) || 0,
        // UI uses 'duha' for Ishraq; also accept 'ishraq' directly
        ishraq_rakaat: parseInt(salahData.duha ?? salahData.ishraq) || 0,
        taraweeh_rakaat: parseInt(salahData.taraweeh) || 0,
        witr: !!salahData.witr,

        // ===== AGGREGATE SCORE =====
        // Persist the same score shown in the UI progress card
        salah_score: totalScore,
    };

    let { data, error } = await supabase
        .from('salah_scores')
        .upsert(payload, { onConflict: 'daily_id' })
        .select()
        .single();

    if (error) {
        console.error('[salah] upsert error:', error.message, '|', error.details);
        throw error;
    }
    console.log('[salah] saved ✓', payload);
    return data;
}

/**
 * Helper: reconstruct prayer mode string from DB boolean columns.
 * Returns: 'takbir-ula' | 'jamaat' | 'ada'
 * For Boys card: this is stored directly on the prayer field.
 */
function getMode(takbeer, jamaat) {
    if (takbeer) return 'takbir';   // Boys card uses 'takbir' (not 'takbir-ula')
    if (jamaat) return 'jamaat';
    return 'ada';
}

/**
 * Convert DB salah record → frontend state (Boys card format)
 * Boys card stores mode directly on prayer field: fajr: 'takbir'/'jamaat'/'ada'/false
 * Boys card uses: dhuhr, duha, sunnahBeforeDhuhr, sunnahAfterDhuhr
 */
export function dbToFrontendSalahBoys(dbRecord) {
    if (!dbRecord) return getDefaultSalah();

    // Reconstruct prayer values: false if not prayed, else mode string
    const fajrVal = dbRecord.fajr ? getMode(dbRecord.fajr_takbeer_ula, dbRecord.fajr_jamaat) : false;
    const dhuhrVal = dbRecord.zuhar ? getMode(dbRecord.zuhar_takbeer_ula, dbRecord.zuhar_jamaat) : false;
    const asrVal = dbRecord.asr ? getMode(dbRecord.asr_takbeer_ula, dbRecord.asr_jamaat) : false;
    const maghribVal = dbRecord.maghrib ? getMode(dbRecord.maghrib_takbeer_ula, dbRecord.maghrib_jamaat) : false;
    const ishaVal = dbRecord.isha ? getMode(dbRecord.isha_takbeer_ula, dbRecord.isha_jamaat) : false;

    return {
        // Main prayers — mode stored directly on field (Boys card format)
        fajr: fajrVal,
        dhuhr: dhuhrVal,
        asr: asrVal,
        maghrib: maghribVal,
        isha: ishaVal,

        // Sunnah rakaat counts — UI uses Dhuhr naming
        sunnahFajr: dbRecord.sunnah_fajr_rakaat || 0,
        sunnahBeforeDhuhr: dbRecord.sunnah_before_zuhar_rakaat || 0,
        sunnahAfterDhuhr: dbRecord.sunnah_after_zuhar_rakaat || 0,
        sunnahBeforeAsr: dbRecord.sunnah_before_asr_rakaat || 0,
        sunnahBeforeMaghrib: dbRecord.sunnah_before_maghrib_rakaat || 0,
        sunnahAfterMaghrib: dbRecord.sunnah_after_maghrib_rakaat || 0,
        sunnahBeforeIsha: dbRecord.sunnah_before_isha_rakaat || 0,
        sunnahAfterIsha: dbRecord.sunnah_after_isha_rakaat || 0,

        // Extra prayers — UI uses 'duha' for Ishraq
        tahajjud: dbRecord.tahajjud_rakaat || 0,
        duha: dbRecord.ishraq_rakaat || 0,
        taraweeh: dbRecord.taraweeh_rakaat || 0,
        witr: dbRecord.witr || false,
        awwabeen: dbRecord.awwabeen_rakaat || 0,
    };
}

/**
 * Convert DB salah record → frontend state (Girls card format)
 * Girls card uses simple boolean for prayers (no mode selection).
 * Girls card also uses: dhuhr, duha, sunnahBeforeDhuhr, sunnahAfterDhuhr
 */
export function dbToFrontendSalahGirls(dbRecord) {
    if (!dbRecord) return getDefaultSalah();

    return {
        // Main prayers — simple boolean (Girls card format)
        fajr: dbRecord.fajr || false,
        dhuhr: dbRecord.zuhar || false,
        asr: dbRecord.asr || false,
        maghrib: dbRecord.maghrib || false,
        isha: dbRecord.isha || false,

        // Sunnah rakaat counts — UI uses Dhuhr naming
        sunnahFajr: dbRecord.sunnah_fajr_rakaat || 0,
        sunnahBeforeDhuhr: dbRecord.sunnah_before_zuhar_rakaat || 0,
        sunnahAfterDhuhr: dbRecord.sunnah_after_zuhar_rakaat || 0,
        sunnahBeforeAsr: dbRecord.sunnah_before_asr_rakaat || 0,
        sunnahBeforeMaghrib: dbRecord.sunnah_before_maghrib_rakaat || 0,
        sunnahAfterMaghrib: dbRecord.sunnah_after_maghrib_rakaat || 0,
        sunnahBeforeIsha: dbRecord.sunnah_before_isha_rakaat || 0,
        sunnahAfterIsha: dbRecord.sunnah_after_isha_rakaat || 0,

        // Extra prayers — UI uses 'duha' for Ishraq
        tahajjud: dbRecord.tahajjud_rakaat || 0,
        duha: dbRecord.ishraq_rakaat || 0,
        taraweeh: dbRecord.taraweeh_rakaat || 0,
        witr: dbRecord.witr || false,
        awwabeen: dbRecord.awwabeen_rakaat || 0,
    };
}

/**
 * Default salah state — matches the field names used by both UI cards.
 * Boys card: fajr/dhuhr/asr/maghrib/isha start as false (not prayed)
 * Girls card: same structure, same defaults
 */
export function getDefaultSalah() {
    return {
        // Main prayers
        fajr: false,
        dhuhr: false,   // UI uses 'dhuhr', DB stores as 'zuhar'
        asr: false,
        maghrib: false,
        isha: false,

        // Sunnah rakaat counts (integer)
        sunnahFajr: 0,
        sunnahBeforeDhuhr: 0,
        sunnahAfterDhuhr: 0,
        sunnahBeforeAsr: 0,
        sunnahBeforeMaghrib: 0,
        sunnahAfterMaghrib: 0,
        sunnahBeforeIsha: 0,
        sunnahAfterIsha: 0,

        // Extra prayers
        tahajjud: 0,
        duha: 0,     // UI uses 'duha' for Ishraq, DB stores as 'ishraq_rakaat'
        taraweeh: 0,
        witr: false,
        awwabeen: 0,
    };
}
