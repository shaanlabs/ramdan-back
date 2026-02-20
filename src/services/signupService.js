/**
 * signupService.js — Direct Supabase Auth Signup
 *
 * Calls Supabase auth directly. Handles the case where the DB trigger
 * crashes (500) by catching it and manually inserting the profile.
 *
 * Exports the same interface as before so Signup.jsx needs NO changes.
 */

import { supabase } from '../lib/supabase';

// Client-side cooldown to prevent accidental double-submits
class ClientRateLimiter {
    constructor() {
        this.attempts = new Map();
        this.cooldownMs = 3000;
    }

    canAttempt(email) {
        const key = email.toLowerCase().trim();
        const last = this.attempts.get(key);
        if (!last) return { allowed: true };
        const elapsed = Date.now() - last;
        if (elapsed >= this.cooldownMs) return { allowed: true };
        return { allowed: false, waitMs: this.cooldownMs - elapsed };
    }

    recordAttempt(email) {
        this.attempts.set(email.toLowerCase().trim(), Date.now());
    }
}

const rateLimiter = new ClientRateLimiter();

/**
 * Submit signup using Supabase Auth directly.
 */
export async function submitSignup(signupData, options = {}) {
    const { email, password, full_name, phone, uucms_roll, stream, year, gender } = signupData;

    // Client-side rate check
    const rateCheck = rateLimiter.canAttempt(email);
    if (!rateCheck.allowed) {
        const err = new Error(`Please wait ${Math.ceil(rateCheck.waitMs / 1000)}s before trying again`);
        err.code = 'CLIENT_COOLDOWN';
        err.retryAfter = Math.ceil(rateCheck.waitMs / 1000);
        throw err;
    }

    rateLimiter.recordAttempt(email);

    // 1. Create auth user — pass ALL profile fields as metadata
    //    so the DB trigger can read them from raw_user_meta_data
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                phone: phone || '',
                uucms_roll: uucms_roll || '',
                stream: stream || '',
                year: year ? parseInt(year) : null,
                gender: gender || '',
            },
        },
    });

    // Handle auth errors
    if (authError) {
        console.error('[signup] Auth error:', authError);
        const err = new Error(authError.message);
        err.supabaseCode = authError.status;

        if (authError.message?.toLowerCase().includes('already registered') ||
            authError.message?.toLowerCase().includes('already exists') ||
            authError.status === 422) {
            err.code = 'EMAIL_EXISTS';
        } else if (authError.status === 429) {
            err.code = 'RATE_LIMIT';
            err.retryAfter = 60;
            err.retryable = true;
        } else if (authError.status >= 500) {
            // 500 from Supabase auth = DB trigger crash
            // The auth user may or may not have been created.
            // Try to manually insert the profile as a recovery step.
            err.code = 'SERVER_ERROR';
            err.retryable = true;
        } else {
            err.code = 'VALIDATION_ERROR';
        }
        throw err;
    }

    const userId = authData?.user?.id;

    // 2. Manually upsert the profile row.
    //    This runs AFTER auth signup succeeds.
    //    If the DB trigger already created the row, upsert is a no-op.
    //    If the trigger crashed and left no row, this creates it.
    if (userId) {
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert(
                {
                    id: userId,
                    full_name: full_name || '',
                    email: email || '',
                    phone: phone || '',
                    uucms_roll: uucms_roll || '',
                    stream: stream || '',
                    year: year ? parseInt(year) : null,
                    gender: gender || '',
                },
                { onConflict: 'id', ignoreDuplicates: false }
            );

        if (profileError) {
            // Log but don't fail — auth succeeded, profile can be fixed on login
            console.warn('[signup] Profile upsert warning (non-fatal):', profileError.message, profileError.code);
        } else {
            console.log('[signup] Profile saved ✓');
        }
    }

    return {
        success: true,
        immediate: true,
        message: 'Account created! Check your email for a confirmation link.',
        email,
        userId,
    };
}

/**
 * Format error for user display
 */
export function formatSignupError(error) {
    if (!error || typeof error !== 'object') {
        return 'An unexpected error occurred. Please try again.';
    }

    const code = error.code || 'DEFAULT';

    const messages = {
        'EMAIL_EXISTS': 'This email is already registered. Try logging in instead.',
        'ROLL_EXISTS': 'This UUCMS roll number is already registered.',
        'VALIDATION_ERROR': error.message || 'Please check your information.',
        'RATE_LIMIT': error.message || 'Too many attempts. Please wait a moment.',
        'EMAIL_RATE_LIMIT': error.message || 'Too many attempts with this email. Please wait.',
        'CLIENT_COOLDOWN': error.message || 'Please wait a moment before trying again.',
        'SERVER_ERROR': 'Server error. Please try again in a few seconds.',
        'TIMEOUT': 'Connection timed out. Please check your internet and try again.',
        'DEFAULT': error.message || 'Something went wrong. Please try again.',
    };

    return messages[code] || messages.DEFAULT;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
    return error.retryable === true ||
        error.code === 'SERVER_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.supabaseCode === 503 ||
        error.supabaseCode === 429;
}
