import React, { useState, useRef, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { submitSignup, formatSignupError, isRetryableError } from '../services/signupService';



// Client-side cooldown between attempts (3 seconds)

const CLIENT_COOLDOWN_MS = 3000;



function Signup() {

    const [formData, setFormData] = useState({

        full_name: '',

        email: '',

        password: '',

        confirmPassword: '',

        phone: '',

        uucms_roll: '',

        stream: '',

        year: '',

        gender: '',

    });



    const [error, setError] = useState('');

    const [infoMessage, setInfoMessage] = useState('');

    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'processing' | 'success'

    const [retryCount, setRetryCount] = useState(0);

    const { user } = useAuth();

    const navigate = useNavigate();



    // Ref-based lock — blocks duplicate submissions even before React re-renders

    const isSubmittingRef = useRef(false);

    const abortControllerRef = useRef(null);



    // Redirect if already logged in

    useEffect(() => {

        if (user) {

            navigate('/dashboard');

        }

    }, [user, navigate]);



    // Cleanup abort controller on unmount

    useEffect(() => {

        return () => {

            if (abortControllerRef.current) {

                abortControllerRef.current.abort();

            }

        };

    }, []);



    const handleChange = (e) => {

        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

        // Clear error when user starts typing

        if (error) setError('');

    };



    const handleSubmit = async (e) => {

        e.preventDefault();



        // Hard guard — ref check is synchronous, state check is async

        if (isSubmittingRef.current || status === 'submitting' || status === 'processing') return;



        setError('');
        setInfoMessage('');

        // ── Validation ───────────────────────────────────────────────────────

        if (formData.password !== formData.confirmPassword) {

            setError('Passwords do not match');

            return;

        }

        if (formData.password.length < 6) {

            setError('Password must be at least 6 characters');

            return;

        }

        if (!formData.gender) {

            setError('Please select your gender');

            return;

        }

        if (!formData.stream) {

            setError('Please select your stream');

            return;

        }



        // ── Lock & submit ────────────────────────────────────────────────────

        isSubmittingRef.current = true;

        setStatus('submitting');



        // Create new AbortController for this request

        abortControllerRef.current = new AbortController();



        try {

            const result = await submitSignup(formData, {

                onProcessing: ({ message, estimatedTime, queuePosition }) => {

                    // Update UI when server indicates background processing

                    setStatus('processing');

                    setInfoMessage(

                        queuePosition 

                            ? `High traffic detected. Queue position: ${queuePosition}. ${message} (Est: ${estimatedTime})`

                            : message

                    );

                },

                signal: abortControllerRef.current.signal

            });



            if (result.success) {

                // Show appropriate success message

                if (result.processing) {

                    // Background processing mode

                    setInfoMessage(result.message || 'Account created! Check your email shortly for confirmation.');

                }

                setStatus('success');

            }



        } catch (err) {

            console.error('Signup error:', err);

            

            // Check if it's a retryable error

            if (isRetryableError(err) && retryCount < 2) {

                setRetryCount(prev => prev + 1);

                setInfoMessage(`Retrying... (attempt ${retryCount + 2}/3)`);

                

                // Wait and retry

                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));

                

                isSubmittingRef.current = false;

                setStatus('idle');

                handleSubmit(e);

                return;

            }



            // Format error for display

            const formattedError = formatSignupError(err);

            setError(formattedError);

            

            // Set appropriate status based on error

            if (err.code === 'CLIENT_COOLDOWN' || err.code === 'EMAIL_RATE_LIMIT') {

                setStatus('cooldown');

                // Auto-reset after cooldown

                setTimeout(() => {

                    setStatus('idle');

                    setError('');

                }, (err.retryAfter || 3) * 1000);

            } else {

                setStatus('idle');

            }

            

            setRetryCount(0);



        } finally {

            // Always release the lock after cooldown period

            setTimeout(() => {

                isSubmittingRef.current = false;

            }, CLIENT_COOLDOWN_MS);

        }

    };



    // ── Success screen ───────────────────────────────────────────────────────

    if (status === 'success') {

        return (

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">

                <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-md">

                    <div className="text-5xl mb-4">📬</div>

                    <h2 className="text-2xl font-bold text-emerald-700 mb-2">Check your email!</h2>

                    <p className="text-gray-600 mb-1">

                        We sent a confirmation link to <strong>{formData.email}</strong>.

                    </p>

                    <p className="text-gray-500 text-sm">

                        Click the link in the email to activate your account, then{' '}

                        <Link to="/login" className="text-emerald-600 font-semibold hover:underline">

                            log in here

                        </Link>

                        .

                    </p>

                </div>

            </div>

        );

    }



    // ── Form ─────────────────────────────────────────────────────────────────

    const isDisabled = status === 'loading' || status === 'cooldown';



    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">

            <div className="w-full max-w-lg">

                {/* Header */}

                <div className="text-center mb-6">

                    <h1 className="text-4xl font-bold text-emerald-800 mb-2">🌙 Ramadan Tracker</h1>

                    <p className="text-gray-600">Create your account to start tracking</p>

                </div>



                {/* Card */}

                <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">

                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign Up</h2>



                    {error && (

                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm" role="alert">

                            ⚠️ {error}

                        </div>

                    )}



                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full Name */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>

                            <input

                                type="text"

                                name="full_name"

                                value={formData.full_name}

                                onChange={handleChange}

                                required

                                disabled={isDisabled}

                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                placeholder="Your full name"

                            />

                        </div>



                        {/* Email */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>

                            <input

                                type="email"

                                name="email"

                                value={formData.email}

                                onChange={handleChange}

                                required

                                disabled={isDisabled}

                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                placeholder="your@email.com"

                                autoComplete="email"

                            />

                        </div>



                        {/* Password Row */}

                        <div className="grid grid-cols-2 gap-3">

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>

                                <input

                                    type="password"

                                    name="password"

                                    value={formData.password}

                                    onChange={handleChange}

                                    required

                                    disabled={isDisabled}

                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                    placeholder="••••••"

                                    autoComplete="new-password"

                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>

                                <input

                                    type="password"

                                    name="confirmPassword"

                                    value={formData.confirmPassword}

                                    onChange={handleChange}

                                    required

                                    disabled={isDisabled}

                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                    placeholder="••••••"

                                    autoComplete="new-password"

                                />

                            </div>

                        </div>



                        {/* Phone */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>

                            <input

                                type="tel"

                                name="phone"

                                value={formData.phone}

                                onChange={handleChange}

                                required

                                disabled={isDisabled}

                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                placeholder="+91 9876543210"

                            />

                        </div>



                        {/* UUCMS Roll */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">UUCMS Roll Number</label>

                            <input

                                type="text"

                                name="uucms_roll"

                                value={formData.uucms_roll}

                                onChange={handleChange}

                                required

                                disabled={isDisabled}

                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"

                                placeholder="e.g. U02JV24S0001"

                            />

                        </div>



                        {/* Stream + Year Row */}

                        <div className="grid grid-cols-2 gap-3">

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>

                                <select

                                    name="stream"

                                    value={formData.stream}

                                    onChange={handleChange}

                                    required

                                    disabled={isDisabled}

                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:opacity-50"

                                >

                                    <option value="">Select</option>

                                    <option value="BBA">BBA</option>

                                    <option value="BCA">BCA</option>

                                </select>

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>

                                <select

                                    name="year"

                                    value={formData.year}

                                    onChange={handleChange}

                                    required

                                    disabled={isDisabled}

                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:opacity-50"

                                >

                                    <option value="">Select</option>

                                    <option value="1">1st Year</option>

                                    <option value="2">2nd Year</option>

                                    <option value="3">3rd Year</option>

                                </select>

                            </div>

                        </div>



                        {/* Gender */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>

                            <select

                                name="gender"

                                value={formData.gender}

                                onChange={handleChange}

                                required

                                disabled={isDisabled}

                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:opacity-50"

                            >

                                <option value="">Select</option>

                                <option value="boy">Boy</option>

                                <option value="girl">Girl</option>

                            </select>

                        </div>



                        <button

                            type="submit"

                            disabled={isDisabled}

                            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"

                        >

                            {status === 'loading' && 'Creating Account…'}

                            {status === 'cooldown' && 'Please wait…'}

                            {status === 'idle' && 'Create Account'}

                        </button>

                    </form>



                    <div className="mt-6 text-center">

                        <p className="text-sm text-gray-600">

                            Already have an account?{' '}

                            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">

                                Login

                            </Link>

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}



export default Signup;