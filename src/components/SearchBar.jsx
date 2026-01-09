import React from 'react';
import { Search, LayoutGrid, List, X, Calendar } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon, formatDisplayDate } from '../utils/helpers';
import CategoryMoreDropdown from './CategoryMoreDropdown';

const SearchBar = ({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedDate,
    setSelectedDate,
    categories,
    viewMode,
    setViewMode,
    defaultStyle = COLOR_STYLES['slate']
}) => {
    return (
        <div className="mb-12 relative z-[60]">
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="flex items-center bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 group hover:scale-[1.01]">
                    {/* Search Input */}
                    <div className="flex-1 relative flex items-center h-full">
                        <div className="absolute left-6 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Search className="h-6 w-6" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-16 pr-4 py-5 bg-transparent border-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 transition-all"
                            placeholder="Hata kodu, başlık veya anahtar kelime..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                </div>

                {/* Category Selection Bar */}
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 mt-2 p-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-100 px-4 md:px-0 relative z-30">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] active:scale-95 whitespace-nowrap h-[42px] ${!selectedCategory
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-500/20 dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-blue-500/10'
                            }`}
                    >
                        <LayoutGrid className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                        <span>Tümü</span>
                    </button>
                    {categories.slice(0, 4).map(c => {
                        const style = COLOR_STYLES[c.color] || defaultStyle;
                        const isSelected = selectedCategory === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(isSelected ? null : c.id)}
                                className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] active:scale-95 whitespace-nowrap h-[42px] ${isSelected
                                    ? `${style.buttonSelected} scale-[1.02]`
                                    : `bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${style.buttonUnselectedHover} ${style.hoverShadow}`
                                    }`}
                            >
                                {getCategoryIcon(c.id, `w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isSelected ? 'text-white' : style.text}`, c.icon)}
                                <span>{c.name}</span>
                            </button>
                        );
                    })}

                    {/* More Categories Dropdown */}
                    {categories.length > 4 && (
                        <CategoryMoreDropdown
                            categories={categories.slice(4)}
                            selectedCategory={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    )}
                </div>

            </div>

            {/* View Toggle (Desktop) */}
            <div className="hidden md:flex absolute right-0 top-0 h-full items-center">
                <div className="bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 flex">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        title="Kart Görünümü"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        title="Liste Görünümü"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* View Toggle (Mobile) */}
            <div className="flex md:hidden justify-center mt-6">
                <div className="flex bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Active Filters Indicator */}
            {
                (selectedDate || selectedCategory) && (
                    <div className="flex justify-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all group"
                            >
                                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                <span>{formatDisplayDate(selectedDate)}</span>
                                <div className="bg-slate-700 rounded-full p-0.5 group-hover:bg-slate-600 ml-1">
                                    <X className="w-3 h-3" />
                                </div>
                            </button>
                        )}
                    </div>
                )
            }
        </div>
    );
};

export default SearchBar;
