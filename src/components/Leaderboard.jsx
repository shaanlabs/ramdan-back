import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, filterLeaderboard } from '../services/leaderboard';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
    const { appDate, profile } = useAuth();
    const [entries, setEntries] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        gender: '',
        stream: '',
        year: '',
        section: '',
    });

    useEffect(() => {
        loadLeaderboard();
    }, [appDate]);

    // Default filters to the current user's class / section / gender when available
    useEffect(() => {
        if (!profile) return;
        setFilters(prev => ({
            ...prev,
            gender: profile.gender || prev.gender,
            stream: profile.stream || prev.stream,
            year: profile.year ? String(profile.year) : prev.year,
            section: profile.section || prev.section,
        }));
    }, [profile]);

    useEffect(() => {
        const activeFilters = {};
        if (filters.gender) activeFilters.gender = filters.gender;
        if (filters.stream) activeFilters.stream = filters.stream;
        if (filters.year) activeFilters.year = filters.year;
        if (filters.section) activeFilters.section = filters.section;

        setFiltered(filterLeaderboard(entries, activeFilters));
    }, [entries, filters]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await fetchLeaderboard(appDate);
            setEntries(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getMedalEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
                🏆 Daily Leaderboard
            </h2>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 md:mb-6">
                <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Genders</option>
                    <option value="boy">Boys</option>
                    <option value="girl">Girls</option>
                </select>

                <select
                    value={filters.stream}
                    onChange={(e) => handleFilterChange('stream', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Streams</option>
                    <option value="BBA">BBA</option>
                    <option value="BCA">BCA</option>
                </select>

                <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                </select>

                <select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Sections</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
            </div>

            {/* Leaderboard List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No entries found for today.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((entry, index) => (
                        <div
                            key={entry.user_id || index}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${index < 3 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                                }`}
                        >
                            {/* Rank */}
                            <div className="w-10 text-center font-bold text-lg">
                                {getMedalEmoji(index + 1)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                                    {entry.full_name || 'Anonymous'}
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${entry.gender === 'girl'
                                            ? 'bg-pink-100 text-pink-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {entry.gender === 'girl' ? '🧕' : '🕌'}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    {entry.stream} • Year {entry.year} • Sec {entry.section}
                                </p>
                            </div>

                            {/* Score */}
                            <div className={`text-lg md:text-xl font-bold ${getScoreColor(entry.final_score || entry.score || 0)}`}>
                                {Math.round(entry.final_score || entry.score || 0)}%
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
