import React, { useState, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon } from '../utils/helpers';

const CategoryMoreDropdown = ({ categories, selectedCategory, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);
    const hasSelectedInside = categories.some(c => c.id === selectedCategory);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] active:scale-95 whitespace-nowrap h-[42px] ${hasSelectedInside || isOpen
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-500/20 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-blue-500/10'
                    }`}
            >
                <MoreHorizontal className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>Diğer</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 z-[70] bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
                    {categories.map(c => {
                        const style = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                        const isSelected = selectedCategory === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => {
                                    onSelect(isSelected ? null : c.id);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 w-full text-left group/item ${isSelected
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-transform group-hover/item:scale-110 ${style.bgLight} ${style.text}`}>
                                    {getCategoryIcon(c.id, "w-4 h-4", c.icon)}
                                </div>
                                <span className={`flex-1 transition-colors ${!isSelected && 'group-hover/item:text-slate-900 dark:group-hover/item:text-white'}`}>{c.name}</span>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CategoryMoreDropdown;
