import { supabase } from '../lib/supabase';

/**
 * Fetch user profile from user_profiles table.
 * Uses maybeSingle() to avoid 406 errors when profile doesn't exist yet.
 * Retries once after 2s to handle trigger race conditions.
 */
export async function fetchProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();  // returns null instead of 406 when no row found

    if (error) {
        console.error('[profile] fetchProfile error:', error.message);
        throw error;
    }

    // Profile not created yet (trigger may still be processing)
    if (!data) {
        console.warn('[profile] Profile not found — retrying in 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: retryData, error: retryError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (retryError) {
            console.error('[profile] Retry error:', retryError.message);
            throw retryError;
        }

        if (!retryData) {
            console.warn('[profile] Profile still not found after retry — returning null');
            return null; // Let AuthContext handle missing profile gracefully
        }

        return retryData;
    }

    return data;
}
