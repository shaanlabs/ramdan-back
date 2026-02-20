/**
 * AuthContext.jsx — Production-Safe Supabase Auth Provider
 *
 * ARCHITECTURE RULES (do not violate):
 *  1. getSession() is called ONCE on mount — never again automatically.
 *  2. signUp / signIn are NEVER called automatically anywhere in this file.
 *  3. onAuthStateChange is the ONLY listener for post-mount auth events.
 *  4. All state transitions happen through explicit user actions only.
 *  5. Loading state ALWAYS resolves — no infinite spinner possible.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../services/profile';
import { getOrCreateDailyRecord } from '../services/daily';
import { getAppDateString, getRamadanDay } from '../utils/dateEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_TIMEOUT_MS = 8000;

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [dailyId, setDailyId] = useState(null);
    const [dailyRecord, setDailyRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Refs — survive re-renders without triggering them
    const mountedRef = useRef(true);
    const initCalledRef = useRef(false); // StrictMode double-fire guard

    const appDate = getAppDateString();
    const ramadanDay = getRamadanDay();

    // ── Boot ────────────────────────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;

        // React StrictMode fires effects twice in dev — guard against it.
        if (initCalledRef.current) return;
        initCalledRef.current = true;

        // Absolute failsafe: never freeze the UI forever.
        const failsafe = setTimeout(() => {
            if (mountedRef.current && loading) {
                console.warn(`[Auth] Timeout after ${AUTH_TIMEOUT_MS}ms — forcing ready state.`);
                setAuthError('Failed to load. Please refresh.');
                setLoading(false);
            }
        }, AUTH_TIMEOUT_MS);

        // 1. One-time session check.
        initAuth().finally(() => clearTimeout(failsafe));

        // 2. Passive listener for post-init events (login / logout from form).
        //    This does NOT call signUp or signIn — it only reacts to changes.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mountedRef.current) return;

                if (event === 'SIGNED_IN' && session?.user) {
                    // User just signed in via the form — load their data.
                    setUser(session.user);
                    await loadUserData(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    clearUserState();
                }
                // TOKEN_REFRESHED, USER_UPDATED, etc. are ignored intentionally.
            }
        );

        return () => {
            mountedRef.current = false;
            clearTimeout(failsafe);
            subscription.unsubscribe();
        };
    }, []); // Empty deps — runs ONCE. Do not add anything here.

    // ── Core init — called once, never called again ─────────────────────────

    async function initAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (!mountedRef.current) return;

            if (error) {
                // Stale / corrupt session — wipe it silently and continue as guest.
                console.error('[Auth] getSession error:', error.message);
                try { await supabase.auth.signOut(); } catch (_) { }
                setLoading(false);
                return;
            }

            if (!session?.user) {
                // No session — user is logged out. Stop loading immediately.
                setLoading(false);
                return;
            }

            // Valid session — hydrate user data.
            setUser(session.user);
            await loadUserData(session.user.id);

        } catch (err) {
            console.error('[Auth] initAuth unexpected error:', err);
            if (mountedRef.current) {
                setAuthError('Authentication error. Please refresh.');
                setLoading(false);
            }
        }
    }

    // ── Data loading — profile + daily record ───────────────────────────────

    async function loadUserData(userId) {
        try {
            const profileData = await fetchProfile(userId);
            if (!mountedRef.current) return;

            if (!profileData) {
                // Profile not created yet (trigger still processing or failed).
                // Don't block the app — user can retry login after email confirmation.
                console.warn('[Auth] Profile is null after signup — user may need to confirm email first.');
                setLoading(false);
                return;
            }

            setProfile(profileData);

            try {
                const record = await getOrCreateDailyRecord(appDate, ramadanDay);
                if (!mountedRef.current) return;
                if (record) {
                    setDailyId(record.id);
                    setDailyRecord(record);
                }
            } catch (rpcErr) {
                // Non-fatal — dashboard still usable without daily record.
                console.error('[Auth] Daily record RPC error (non-fatal):', rpcErr);
            }
        } catch (err) {
            console.error('[Auth] loadUserData error:', err);
        } finally {
            // CRITICAL: always resolve loading, no matter what failed.
            if (mountedRef.current) setLoading(false);
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    function clearUserState() {
        setUser(null);
        setProfile(null);
        setDailyId(null);
        setDailyRecord(null);
    }

    // Load daily record for a different day (navigation, not auth)
    const loadDailyRecord = useCallback(async (targetDate = null, targetDay = null) => {
        try {
            const date = targetDate || appDate;
            const day = targetDay || ramadanDay;
            const record = await getOrCreateDailyRecord(date, day);
            if (record) {
                setDailyId(record.id);
                setDailyRecord(record);
            }
            return record;
        } catch (err) {
            console.error('[Auth] loadDailyRecord error:', err);
            return null;
        }
    }, [appDate, ramadanDay]);

    // ── Public auth methods (called from forms ONLY) ─────────────────────────

    /**
     * signUp — must be called from a form submit handler only.
     * AuthContext exposes it; it does NOT call it internally.
     */
    async function signUp(email, password, metadata) {
        const redirectUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: `${redirectUrl}/login`,
            },
        });
        if (error) throw error; // Let the form handle & display the error.
        return data;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        clearUserState();
    }

    // ── Context value ────────────────────────────────────────────────────────

    const value = {
        user,
        profile,
        dailyId,
        dailyRecord,
        loading,
        authError,
        appDate,
        ramadanDay,
        signUp,
        signIn,
        signOut,
        loadDailyRecord,
        setDailyRecord,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}