// Distributed Signup Queue Manager with Token Bucket Rate Limiting
// Handles burst traffic by queuing requests and processing at controlled rate
// ESM Module — Vercel Serverless Compatible

import crypto from 'node:crypto';

class TokenBucket {
    constructor(capacity, refillRateMs) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRateMs = refillRateMs;
        this.lastRefill = Date.now();
        this.lock = false;
    }

    async consume(tokens = 1) {
        // Wait for any concurrent operations
        while (this.lock) {
            await new Promise(r => setTimeout(r, 1));
        }
        this.lock = true;

        try {
            const now = Date.now();
            const timePassed = now - this.lastRefill;
            const tokensToAdd = Math.floor(timePassed / this.refillRateMs);

            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefill = now;

            if (this.tokens >= tokens) {
                this.tokens -= tokens;
                return { allowed: true, remaining: this.tokens };
            }

            return { allowed: false, remaining: this.tokens, retryAfter: this.refillRateMs };
        } finally {
            this.lock = false;
        }
    }
}

// Global rate limiters
const ipRateLimiters = new Map(); // Per-IP rate limiters
const emailRateLimiters = new Map(); // Per-email rate limiters
const duplicateCache = new Map(); // Email duplicate prevention cache

// Supabase rate limiter - CRITICAL: prevents hitting Supabase rate limits
// Allows 50 signups per 10 seconds (well under Supabase's typical 100 req/s limit)
const supabaseRateLimiter = new TokenBucket(50, 200); // 50 tokens, refill every 200ms

// IP rate limiter - prevents spam from single IP
// 3 attempts per 60 seconds per IP
function getIpRateLimiter(ip) {
    if (!ipRateLimiters.has(ip)) {
        ipRateLimiters.set(ip, new TokenBucket(3, 20000)); // 3 per 20 seconds
    }
    return ipRateLimiters.get(ip);
}

// Email rate limiter - prevents repeated attempts on same email
// 2 attempts per 120 seconds per email
function getEmailRateLimiter(email) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRateLimiters.has(normalizedEmail)) {
        emailRateLimiters.set(normalizedEmail, new TokenBucket(2, 60000)); // 2 per 60 seconds
    }
    return emailRateLimiters.get(normalizedEmail);
}

// Duplicate prevention cache - prevents identical requests
function isDuplicateRequest(fingerprint) {
    const now = Date.now();
    if (duplicateCache.has(fingerprint)) {
        const timestamp = duplicateCache.get(fingerprint);
        if (now - timestamp < 60000) { // 60 second window
            return true;
        }
    }
    duplicateCache.set(fingerprint, now);
    return false;
}

// Cleanup old cache entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();

    // Clean duplicate cache
    for (const [key, timestamp] of duplicateCache.entries()) {
        if (now - timestamp > 300000) { // 5 minutes
            duplicateCache.delete(key);
        }
    }

    // Clean old IP limiters (keep only active ones)
    for (const [ip, limiter] of ipRateLimiters.entries()) {
        if (now - limiter.lastRefill > 300000) {
            ipRateLimiters.delete(ip);
        }
    }

    // Clean old email limiters
    for (const [email, limiter] of emailRateLimiters.entries()) {
        if (now - limiter.lastRefill > 300000) {
            emailRateLimiters.delete(email);
        }
    }
}, 300000);

// Request queue for handling bursts
class SignupQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.concurrency = 5; // Process 5 signups concurrently
        this.activeCount = 0;
    }

    async enqueue(signupData, processFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                data: signupData,
                processFn,
                resolve,
                reject,
                enqueuedAt: Date.now()
            });
            this.process();
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0 || this.activeCount >= this.concurrency) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && this.activeCount < this.concurrency) {
            const item = this.queue.shift();
            this.activeCount++;

            // Process immediately but don't block
            // Use setTimeout(…, 0) instead of setImmediate for Vercel compatibility
            this.processItem(item).finally(() => {
                this.activeCount--;
                setTimeout(() => this.process(), 0);
            });
        }

        this.processing = false;
    }

    async processItem(item) {
        try {
            // Wait for Supabase rate limiter
            let rateLimitResult;
            do {
                rateLimitResult = await supabaseRateLimiter.consume(1);
                if (!rateLimitResult.allowed) {
                    await new Promise(r => setTimeout(r, rateLimitResult.retryAfter));
                }
            } while (!rateLimitResult.allowed);

            // Execute signup with retry logic
            const result = await this.executeWithRetry(item.processFn, item.data, 3);
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        }
    }

    async executeWithRetry(fn, data, maxRetries) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn(data);
            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx)
                if (error.status && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Exponential backoff: 100ms, 200ms, 400ms
                if (attempt < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
                }
            }
        }
        throw lastError;
    }

    getStats() {
        return {
            queueLength: this.queue.length,
            activeCount: this.activeCount,
            totalPending: this.queue.length + this.activeCount
        };
    }
}

// Global signup queue instance
const signupQueue = new SignupQueue();

// Validation helper
function validateSignupData(data) {
    const errors = [];

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (!data.full_name || data.full_name.length < 2) {
        errors.push('Full name is required');
    }

    if (!data.phone || data.phone.length < 10) {
        errors.push('Valid phone number is required');
    }

    if (!data.uucms_roll || data.uucms_roll.length < 5) {
        errors.push('UUCMS roll number is required');
    }

    if (!data.stream || !['BBA', 'BCA'].includes(data.stream)) {
        errors.push('Valid stream (BBA or BCA) is required');
    }

    if (!data.year || ![1, 2, 3].includes(Number(data.year))) {
        errors.push('Valid year (1, 2, or 3) is required');
    }

    if (!data.gender || !['boy', 'girl'].includes(data.gender)) {
        errors.push('Gender is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Generate request fingerprint
function generateFingerprint(data, ip) {
    const str = `${data.email.toLowerCase().trim()}:${data.uucms_roll}:${ip}`;
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

export {
    getIpRateLimiter,
    getEmailRateLimiter,
    isDuplicateRequest,
    generateFingerprint,
    validateSignupData,
    signupQueue,
    supabaseRateLimiter,
    TokenBucket
};
