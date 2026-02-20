import { supabase } from '../lib/supabase';

/**
 * Persist aggregate scores on the main daily_ramadan_tracker row.
 *
 * We only touch columns that we know exist from your schema:
 *   - salah_score      (integer)
 *   - good_deeds_score (integer)
 *   - final_score      (integer)
 *
 * All values are expected as 0–100 integers from calculateFinalScore.
 * If any of these columns are missing (older DB), we fail softly and do not
 * break the app.
 */
export async function upsertDailyScores(dailyId, scores) {
  if (!dailyId) {
    console.error('[scores] upsertDailyScores called with no dailyId — skipping');
    return null;
  }

  const safeScores = scores || {};

  const payload = {
    salah_score: safeScores.salah ?? 0,
    good_deeds_score: safeScores.goodDeeds ?? 0,
    final_score: safeScores.final ?? 0,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('daily_ramadan_tracker')
      .update(payload)
      .eq('id', dailyId)
      .select()
      .single();

    if (error) {
      // If the migration for these columns is not in place yet, don't crash
      if (error.message?.includes('column')) {
        console.warn('[scores] score columns missing on daily_ramadan_tracker — run migration to persist aggregate scores');
        return null;
      }
      console.error('[scores] upsert error:', error.message, '|', error.details);
      throw error;
    }

    console.log('[scores] daily scores saved ✓', payload);
    return data;
  } catch (err) {
    console.error('[scores] unexpected error while saving scores:', err);
    return null;
  }
}

