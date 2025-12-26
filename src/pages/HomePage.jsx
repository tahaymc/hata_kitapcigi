import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Monitor, ShoppingCart, Archive, Settings, LayoutGrid, List, Calendar, Edit2 } from 'lucide-react';
import { getCategories, searchErrors, CATEGORIES } from '../data/mockData';
import ErrorDetailModal from '../components/ErrorDetailModal';

const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 'kasa': return <ShoppingCart className="w-6 h-6" />;
        case 'reyon': return <Archive className="w-6 h-6" />;
        case 'depo': return <Archive className="w-6 h-6" />;
        case 'sistem': return <Monitor className="w-6 h-6" />;
        default: return <Settings className="w-6 h-6" />;
    }
};

const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.color : 'slate';
};

// Explicit mapping for Tailwind to detect classes
const COLOR_STYLES = {
    blue: {
        gradient: 'from-blue-500 to-blue-400',
        text: 'text-blue-400',
        bgLight: 'bg-blue-500/10',
        borderLight: 'border-blue-500/20',
        groupHoverText: 'group-hover:text-blue-400',
        groupHoverBg: 'group-hover:bg-blue-500/10',
        hoverBorder: 'hover:border-blue-500/50',
        hoverShadow: 'hover:shadow-blue-500/10',
        buttonSelected: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-500',
        buttonUnselectedHover: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50',
        bar: 'bg-blue-500 w-1'
    },
    emerald: {
        gradient: 'from-emerald-500 to-emerald-400',
        text: 'text-emerald-400',
        bgLight: 'bg-emerald-500/10',
        borderLight: 'border-emerald-500/20',
        groupHoverText: 'group-hover:text-emerald-400',
        groupHoverBg: 'group-hover:bg-emerald-500/10',
        hoverBorder: 'hover:border-emerald-500/50',
        hoverShadow: 'hover:shadow-emerald-500/10',
        buttonSelected: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-500',
        buttonUnselectedHover: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/50',
        bar: 'bg-emerald-500 w-1'
    },
    orange: {
        gradient: 'from-orange-500 to-orange-400',
        text: 'text-orange-400',
        bgLight: 'bg-orange-500/10',
        borderLight: 'border-orange-500/20',
        groupHoverText: 'group-hover:text-orange-400',
        groupHoverBg: 'group-hover:bg-orange-500/10',
        hoverBorder: 'hover:border-orange-500/50',
        hoverShadow: 'hover:shadow-orange-500/10',
        buttonSelected: 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 border-orange-500',
        buttonUnselectedHover: 'hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/50',
        bar: 'bg-orange-500 w-1'
    },
    purple: {
        gradient: 'from-purple-500 to-purple-400',
        text: 'text-purple-400',
        bgLight: 'bg-purple-500/10',
        borderLight: 'border-purple-500/20',
        groupHoverText: 'group-hover:text-purple-400',
        groupHoverBg: 'group-hover:bg-purple-500/10',
        hoverBorder: 'hover:border-purple-500/50',
        hoverShadow: 'hover:shadow-purple-500/10',
        buttonSelected: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-500',
        buttonUnselectedHover: 'hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/50',
        bar: 'bg-purple-500 w-1'
    },
    slate: {
        gradient: 'from-slate-500 to-slate-400',
        text: 'text-slate-400',
        bgLight: 'bg-slate-500/10',
        borderLight: 'border-slate-500/20',
        groupHoverText: 'group-hover:text-slate-400',
        groupHoverBg: 'group-hover:bg-slate-500/10',
        hoverBorder: 'hover:border-slate-500/50',
        hoverShadow: 'hover:shadow-slate-500/10',
        buttonSelected: 'bg-slate-600 text-white shadow-lg shadow-slate-500/30 border-slate-500',
        buttonUnselectedHover: 'hover:bg-slate-500/10 hover:text-slate-400 hover:border-slate-500/50',
        bar: 'bg-slate-500 w-1'
    }
};

const HomePage = () => {
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedError, setSelectedError] = useState(null); // For Modal

    // Default fallback style
    const defaultStyle = COLOR_STYLES['slate'];

    useEffect(() => {
        getCategories().then(setCategories);
        searchErrors('', null).then(setErrors);
    }, []);

    useEffect(() => {
        searchErrors(searchTerm, selectedCategory).then(setErrors);
    }, [searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100">
            {/* Header */}
            <header className="bg-[#1e293b] border-b border-slate-700/50 sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-100">Hata Kitapçığı</h1>
                    </div>
                    <a href="/login" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors px-4 py-2 hover:bg-slate-800 rounded-lg">
                        Yönetici Girişi
                    </a>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-10">
                {/* Search Section */}
                <div className="mb-12 text-center space-y-6">
                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-14 pr-4 py-5 bg-[#1e293b] border-2 border-slate-700/50 rounded-2xl shadow-xl text-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                            placeholder="Hata kodu, başlık veya anahtar kelime..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories & View Toggle Loop */}
                <div className="mb-12 relative">
                    {/* Centered Categories */}
                    <div className="flex flex-wrap justify-center gap-4 px-12 md:px-32">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${selectedCategory === null
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-500'
                                : 'bg-[#1e293b] text-slate-400 hover:bg-white/5 hover:text-white border-slate-700/50'
                                }`}
                        >
                            Tümü
                        </button>
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const style = COLOR_STYLES[cat.color] || defaultStyle;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${isSelected
                                        ? style.buttonSelected
                                        : `bg-[#1e293b] text-slate-400 border-slate-700/50 ${style.buttonUnselectedHover}`
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Absolute Right-Aligned View Toggle (Desktop) */}
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-[#1e293b] p-1 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    {/* View Toggle for Mobile (Centered below categories) */}
                    <div className="flex md:hidden justify-center mt-6">
                        <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {errors.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                        {errors.map((error) => {
                            const colorKey = getCategoryColor(error.category);
                            const style = COLOR_STYLES[colorKey] || defaultStyle;

                            return viewMode === 'grid' ? (
                                // Card View
                                <div
                                    key={error.id}
                                    className={`bg-[#1e293b] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 ${style.hoverBorder} ${style.hoverShadow} transition-all duration-300 group cursor-pointer relative`}
                                    onClick={() => setSelectedError(error)}
                                >
                                    {/* Top Bar with Dynamic Color */}
                                    <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${style.gradient}`}></div>

                                    <div className="p-6 pt-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-inner ${style.text} ${style.groupHoverBg} transition-all`}>
                                                {getCategoryIcon(error.category)}
                                            </div>
                                            <div className={`px-3 py-1 rounded-md ${style.bgLight} border ${style.borderLight} ${style.text} font-mono font-bold text-xs tracking-wider`}>
                                                {error.code || 'SYS-000'}
                                            </div>
                                        </div>
                                        <div className="mb-6">
                                            <h3 className={`text-xl font-bold text-white mb-3 ${style.groupHoverText} transition-colors`}>
                                                {error.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                                                {error.summary}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                                            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                                                {categories.find(c => c.id === error.category)?.name}
                                            </span>
                                            <span className="text-slate-600 text-xs">{error.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // List View
                                <div
                                    key={error.id}
                                    className={`bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 ${style.hoverBorder} hover:bg-[#253248] transition-all cursor-pointer group flex items-center gap-6 relative overflow-hidden`}
                                    onClick={() => setSelectedError(error)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 ${style.bar} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                    <div className={`w-12 h-12 bg-[#0f172a] rounded-xl flex flex-shrink-0 items-center justify-center border border-slate-700/50 ${style.text} ${style.groupHoverBg} transition-all`}>
                                        {getCategoryIcon(error.category)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded ${style.bgLight} border ${style.borderLight} ${style.text} font-mono font-bold text-[10px] tracking-wider`}>
                                                {error.code || 'SYS-000'}
                                            </span>
                                            <h3 className={`text-lg font-bold text-white ${style.groupHoverText} transition-colors truncate`}>
                                                {error.title}
                                            </h3>
                                        </div>
                                        <p className="text-slate-400 text-sm truncate">
                                            {error.summary}
                                        </p>
                                    </div>

                                    <div className="hidden md:flex flex-col items-end gap-1 text-right min-w-[100px]">
                                        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                                            {categories.find(c => c.id === error.category)?.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                                            <Calendar className="w-3 h-3" />
                                            {error.date}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Search className="h-10 w-10 text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-300">Sonuç Bulunamadı</h3>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedError && (
                    <ErrorDetailModal
                        error={selectedError}
                        onClose={() => setSelectedError(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default HomePage;
