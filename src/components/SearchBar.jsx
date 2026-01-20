import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
    searchTerm,
    setSearchTerm,
    placeholder = "Arama yap..."
}) => {
    return (
        <div className="relative z-[60] w-full">
            <div className="relative flex items-center h-12 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-200">
                <div className="absolute left-3 text-slate-400">
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="w-full h-full pl-10 pr-4 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
