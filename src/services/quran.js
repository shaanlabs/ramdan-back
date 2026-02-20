import { supabase } from '../lib/supabase';

/**
 * Fetch quran scores for a daily record
 */
export async function fetchQuran(dailyId) {
    if (!dailyId) return null;
    const { data, error } = await supabase
        .from('quran_scores')
        .select('*')
        .eq('daily_id', dailyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Upsert quran scores for a daily record.
 *
 * DB columns:
 *   start_page, end_page → integer (writable)
 *   pages_read           → GENERATED column (do NOT send)
 *   current_page         → integer (added via migration, optional)
 */
export async function upsertQuran(dailyId, quranData) {
    if (!dailyId) {
        console.error('[quran] upsertQuran called with no dailyId — skipping');
        return null;
    }

    const startPage = parseInt(quranData.startPage) || 0;
    const endPage = parseInt(quranData.endPage) || 0;
    
    // Validate: endPage must be >= startPage
    const validEndPage = Math.max(startPage, endPage);
    
    // pages_read is GENERATED — never send it
    const currentPage = parseInt(quranData.currentPage) || validEndPage || 0;

    // Try with current_page first (requires migration to have been run)
    const payload = {
        daily_id: dailyId,
        start_page: startPage,
        end_page: validEndPage,  // Use validated endPage
        current_page: currentPage,
        updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
        .from('quran_scores')
        .upsert(payload, { onConflict: 'daily_id' })
        .select()
        .single();

    // If current_page column doesn't exist yet, retry without it
    if (error && error.message?.includes('current_page')) {
        console.warn('[quran] current_page column missing — retrying without it');
        const fallbackPayload = {
            daily_id: dailyId,
            start_page: startPage,
            end_page: validEndPage,  // Use validated endPage
            updated_at: new Date().toISOString(),
        };
        const result = await supabase
            .from('quran_scores')
            .upsert(fallbackPayload, { onConflict: 'daily_id' })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
        console.error('[quran] upsert error:', error.message, '|', error.details);
        throw error;
    }
    console.log('[quran] saved ✓');
    return data;
}

/**
 * Convert DB quran record → frontend state
 */
export function dbToFrontendQuran(dbRecord) {
    if (!dbRecord) return getDefaultQuran();
    const startPage = dbRecord.start_page || 0;
    const endPage = dbRecord.end_page || 0;
    // Ensure pagesRead is never negative
    const pagesRead = Math.max(0, endPage - startPage + 1);
    return {
        startPage,
        endPage,
        pagesRead: dbRecord.pages_read || pagesRead,
        currentPage: dbRecord.current_page || endPage || 2,
        totalPagesRead: dbRecord.pages_read || 0,
        khatamCount: dbRecord.khatam_count || 0,
    };
}

/**
 * Default quran state
 */
export function getDefaultQuran() {
    return {
        startPage: 0,
        endPage: 0,
        pagesRead: 0,
        totalPagesRead: 0,
        currentPage: 2,
        khatamCount: 0,
    };
}
