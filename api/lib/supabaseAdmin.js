// Supabase Admin Service - Server-side only, uses service_role key
// Creates users with admin privileges to bypass rate limits
// ESM Module — Vercel Serverless Compatible

import { createClient } from '@supabase/supabase-js';

// Lazy initialization - don't throw at module load time
let supabaseAdmin = null;
let supabaseUrl = null;
let supabaseServiceKey = null;

function getSupabaseAdmin() {
    if (supabaseAdmin) {
        return supabaseAdmin;
    }

    supabaseUrl = process.env.SUPABASE_URL;
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    // Admin client with service role - NEVER expose to frontend
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return supabaseAdmin;
}

class SupabaseAdminService {
    constructor() {
        this.cache = new Map();
    }

    getClient() {
        return getSupabaseAdmin();
    }

    /**
     * Create user with admin API - bypasses client-side rate limits
     * Uses supabase.auth.admin.createUser() which has higher rate limits
     */
    async createUser(userData) {
        const { email, password, metadata } = userData;
        const client = this.getClient();

        try {
            // Step 1: Create auth user with admin API
            // This has much higher rate limits than client signup
            const { data: authData, error: authError } = await client.auth.admin.createUser({
                email: email.toLowerCase().trim(),
                password,
                email_confirm: false, // Require email confirmation
                user_metadata: {
                    full_name: metadata.full_name,
                    phone: metadata.phone,
                    uucms_roll: metadata.uucms_roll,
                    stream: metadata.stream,
                    year: metadata.year,
                    gender: metadata.gender,
                }
            });

            if (authError) {
                // Check for specific error types
                if (authError.message?.includes('already registered') ||
                    authError.message?.includes('already exists') ||
                    authError.message?.includes('User already registered')) {
                    throw { status: 409, message: 'Email already registered', code: 'EMAIL_EXISTS' };
                }

                if (authError.message?.includes('rate limit') || authError.status === 429) {
                    throw { status: 429, message: 'Server busy, please retry', code: 'RATE_LIMIT', retryable: true };
                }

                throw { status: 500, message: authError.message, code: 'AUTH_ERROR' };
            }

            if (!authData?.user?.id) {
                throw { status: 500, message: 'User creation failed - no user ID returned', code: 'NO_USER_ID' };
            }

            const userId = authData.user.id;

            // Step 2: Create profile record in parallel with email trigger
            const [profileResult, emailResult] = await Promise.allSettled([
                this.createProfile(client, userId, metadata),
                this.triggerConfirmationEmail(client, email)
            ]);

            // Log profile creation errors but don't fail signup
            if (profileResult.status === 'rejected') {
                console.error('[SupabaseAdmin] Profile creation failed:', profileResult.reason);
            }

            // Log email errors but don't fail signup
            if (emailResult.status === 'rejected') {
                console.error('[SupabaseAdmin] Email trigger failed:', emailResult.reason);
            }

            return {
                success: true,
                userId: userId,
                email: email,
                message: 'Account created successfully. Check your email for confirmation.',
                emailSent: emailResult.status === 'fulfilled'
            };

        } catch (error) {
            // Re-throw structured errors
            if (error.status && error.code) {
                throw error;
            }

            // Wrap unexpected errors
            console.error('[SupabaseAdmin] Unexpected error:', error);
            throw {
                status: 500,
                message: 'Internal server error during signup',
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Create profile in profiles table
     */
    async createProfile(client, userId, metadata) {
        const { full_name, phone, uucms_roll, stream, year, gender } = metadata;

        const { error } = await client
            .from('profiles')
            .insert({
                id: userId,
                full_name: full_name.trim(),
                phone: phone.trim(),
                uucms_roll: uucms_roll.trim().toUpperCase(),
                stream: stream.toUpperCase(),
                year: Number(year),
                gender: gender.toLowerCase(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            // Handle duplicate UUCMS roll
            if (error.code === '23505' && error.message?.includes('uucms_roll')) {
                throw { status: 409, message: 'UUCMS roll number already registered', code: 'ROLL_EXISTS' };
            }

            throw error;
        }

        return { success: true };
    }

    /**
     * Trigger confirmation email manually if needed
     */
    async triggerConfirmationEmail(client, email) {
        // Note: With admin.createUser and email_confirm: false,
        // Supabase automatically sends confirmation email
        // This method is for manual re-sends if needed

        const { error } = await client.auth.resend({
            type: 'signup',
            email: email.toLowerCase().trim()
        });

        if (error) {
            throw error;
        }

        return { success: true };
    }

    /**
     * Check if email exists (cached for 60 seconds)
     */
    async checkEmailExists(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const cacheKey = `email:${normalizedEmail}`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) {
                return cached.exists;
            }
        }

        try {
            const client = this.getClient();
            const { data, error } = await client.auth.admin.listUsers({
                filter: `email.eq.${normalizedEmail}`
            });

            if (error) throw error;

            const exists = data.users.length > 0;

            // Cache result
            this.cache.set(cacheKey, { exists, timestamp: Date.now() });

            return exists;
        } catch (error) {
            console.error('[SupabaseAdmin] Error checking email:', error);
            return false; // Fail open - let signup proceed
        }
    }

    /**
     * Check if UUCMS roll exists
     */
    async checkRollExists(uucmsRoll) {
        const normalizedRoll = uucmsRoll.trim().toUpperCase();
        const cacheKey = `roll:${normalizedRoll}`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) {
                return cached.exists;
            }
        }

        try {
            const client = this.getClient();
            const { data, error } = await client
                .from('profiles')
                .select('id')
                .eq('uucms_roll', normalizedRoll)
                .single();

            const exists = !error && data !== null;

            // Cache result
            this.cache.set(cacheKey, { exists, timestamp: Date.now() });

            return exists;
        } catch (error) {
            // Error means not found (PGRST116 = no rows)
            if (error.code === 'PGRST116') {
                this.cache.set(cacheKey, { exists: false, timestamp: Date.now() });
                return false;
            }

            console.error('[SupabaseAdmin] Error checking roll:', error);
            return false; // Fail open
        }
    }
}

const supabaseAdminService = new SupabaseAdminService();

// Cleanup cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of supabaseAdminService.cache.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutes
            supabaseAdminService.cache.delete(key);
        }
    }
}, 300000);

export { getSupabaseAdmin, supabaseAdminService };
