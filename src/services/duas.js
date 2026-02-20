import { supabase } from '../lib/supabase';

/**
 * Fetch a random dua from the duas table
 */
export async function fetchRandomDua() {
    // Get total count first
    const { count, error: countError } = await supabase
        .from('duas')
        .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    if (!count || count === 0) return null;

    // Pick random offset
    const randomOffset = Math.floor(Math.random() * count);

    const { data, error } = await supabase
        .from('duas')
        .select('*')
        .range(randomOffset, randomOffset)
        .single();

    if (error) throw error;
    return data;
}
