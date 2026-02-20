import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { user, loading, authError } = useAuth();

    // Still checking auth — show spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-50">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }

    // Auth timed out or failed — show error instead of infinite spinner
    if (authError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center max-w-md p-6">
                    <p className="text-4xl mb-4">⚠️</p>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
                    <p className="text-gray-600 mb-4">{authError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    // No session — redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
