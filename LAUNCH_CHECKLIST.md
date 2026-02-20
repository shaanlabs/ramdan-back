# High-Traffic Launch Performance Checklist

## Pre-Launch (1-2 days before)

### Environment Setup
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
- [ ] Add `SUPABASE_URL` to Vercel environment variables  
- [ ] Add `ALLOWED_ORIGIN` with production domain
- [ ] Verify `VITE_SUPABASE_URL` is set correctly
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set correctly
- [ ] Verify `VITE_SITE_URL` points to production domain

### Supabase Configuration
- [ ] Enable "Confirm email" in Authentication settings
- [ ] Set Site URL to production domain: `https://your-app.vercel.app`
- [ ] Add Redirect URLs: `https://your-app.vercel.app/login`
- [ ] Verify profiles table has unique constraint on `uucms_roll`
- [ ] Create profiles table if not exists:
```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    uucms_roll TEXT NOT NULL UNIQUE,
    stream TEXT NOT NULL,
    year INTEGER NOT NULL,
    gender TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Load Testing
- [ ] Test single signup flow end-to-end
- [ ] Test 5 concurrent signups
- [ ] Test duplicate email rejection
- [ ] Test duplicate UUCMS roll rejection
- [ ] Verify email confirmation sent
- [ ] Verify profile created in database

### Monitoring Setup
- [ ] Enable Vercel Analytics
- [ ] Set up Supabase usage monitoring
- [ ] Configure error tracking (Sentry recommended)
- [ ] Test queue stats endpoint

## Launch Day

### Pre-Launch (30 mins before)
- [ ] Redeploy latest version to Vercel
- [ ] Clear any test data from database
- [ ] Reset rate limiter cache (restart if needed)
- [ ] Test signup from mobile device
- [ ] Test signup from desktop
- [ ] Check Supabase rate limit dashboard

### During Launch (Monitor every 15 mins)
- [ ] Monitor Vercel function execution count
- [ ] Watch for 429 errors in logs
- [ ] Check queue length in signup responses
- [ ] Monitor Supabase auth API usage
- [ ] Watch for failed profile creations
- [ ] Check average response time (< 300ms target)

### High Load Response Plan
If queue length > 50:
1. Enable queue position display in UI (already enabled)
2. Increase estimated wait time message
3. Monitor for 503 errors (should auto-retry)
4. Consider temporary signup pause if > 200 queue

## Post-Launch

### First Hour
- [ ] Export list of successful signups
- [ ] Verify email delivery rate
- [ ] Check for duplicate accounts
- [ ] Monitor error logs for edge cases
- [ ] Gather user feedback on speed

### First Day
- [ ] Review signup completion rate
- [ ] Calculate average queue time
- [ ] Identify peak traffic period
- [ ] Document any errors encountered
- [ ] Plan optimizations for next event

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time (fast) | < 300ms | > 500ms |
| Response Time (queued) | < 100ms | > 200ms |
| Queue Length | < 20 | > 50 |
| Error Rate | < 1% | > 5% |
| Success Rate | > 99% | < 95% |
| Email Delivery | > 98% | < 95% |

## Emergency Contacts

- Vercel Support: https://vercel.com/help
- Supabase Status: https://status.supabase.com
- Your Supabase Project ID: ________
- Vercel Project ID: ________

## Quick Commands

Check queue stats in browser console during test:
```javascript
// Run after signup attempt
// Response will include: { queueStats: { queueLength, activeCount, totalPending } }
```

Monitor real-time signups in Supabase:
```sql
-- Count signups in last 5 minutes
SELECT COUNT(*) FROM auth.users 
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- Count signups by hour
SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*)
FROM auth.users 
GROUP BY hour ORDER BY hour DESC;
```

## Signs of Healthy System

✅ Response times 150-300ms
✅ Queue length stays under 20
✅ No 429 errors from Supabase
✅ 201 (success) and 202 (accepted) status codes
✅ Email confirmations sending promptly
✅ Profiles created matching auth.users count

## Warning Signs

⚠️ Queue length > 50 = traffic spike detected
⚠️ Response time > 500ms = check Supabase rate limits  
⚠️ 503 errors = servers under high load
⚠️ Profile count < auth.users count = sync issue
⚠️ High 409 errors = many duplicate attempts
