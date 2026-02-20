import React, { useState, useEffect } from 'react';
import { fetchRandomDua } from '../services/duas';

const DuaCard = () => {
    const [dua, setDua] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDua();
    }, []);

    const loadDua = async () => {
        setLoading(true);
        try {
            const data = await fetchRandomDua();
            setDua(data);
        } catch (error) {
            console.error('Error fetching dua:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    if (!dua) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">🤲 Daily Dua</h2>
                <p className="text-gray-500 italic">No duas available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">🤲 Daily Dua</h2>
                <button
                    onClick={loadDua}
                    className="text-sm px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
                >
                    🔄 New Dua
                </button>
            </div>

            {/* Arabic Text */}
            {dua.arabic_text && (
                <div className="bg-amber-50 rounded-xl p-4 md:p-6 mb-4 text-center border border-amber-200">
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-loose" dir="rtl">
                        {dua.arabic_text}
                    </p>
                </div>
            )}

            {/* Translation */}
            {dua.translation && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200">
                    <p className="text-sm font-medium text-gray-500 mb-1">Translation</p>
                    <p className="text-base text-gray-700">{dua.translation}</p>
                </div>
            )}

            {/* Transliteration */}
            {dua.transliteration && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                    <p className="text-sm font-medium text-gray-500 mb-1">Transliteration</p>
                    <p className="text-base text-gray-700 italic">{dua.transliteration}</p>
                </div>
            )}

            {/* Reference */}
            {dua.reference && (
                <p className="text-xs text-gray-500 text-center mt-3 italic">
                    📚 {dua.reference}
                </p>
            )}

            <p className="text-xs text-gray-400 text-center mt-4 italic">
                Reflect on this dua — may Allah accept your worship ✨
            </p>
        </div>
    );
};

export default DuaCard;
