import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon } from '../utils/helpers';

const Sidebar = ({ categories, selectedCategory, onSelectCategory, activeTab, setActiveTab }) => {
    return (
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar">
            <div className="bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-2">
                {/* Module Switcher */}
                <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl flex mb-4">
                    <button
                        onClick={() => setActiveTab('errors')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'errors'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        Hatalar
                    </button>
                    <button
                        onClick={() => setActiveTab('guides')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'guides'
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        Kılavuzlar
                    </button>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700/50 mx-2 mb-4"></div>

                <h3 className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Kategoriler
                </h3>

                <button
                    onClick={() => onSelectCategory(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${!selectedCategory
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-500/20 dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] active:scale-95'
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${!selectedCategory ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}`}>
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <span>Tümü</span>
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2 mx-2"></div>

                {categories
                    .filter(c => (c.type === activeTab) || (!c.type && activeTab === 'errors'))
                    .map(category => {
                        const isSelected = selectedCategory === category.id;
                        const style = COLOR_STYLES[category.color] || COLOR_STYLES.slate;

                        return (
                            <button
                                key={category.id}
                                onClick={() => onSelectCategory(isSelected ? null : category.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isSelected
                                    ? `${style.buttonSelected} scale-[1.02]`
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] active:scale-95 border border-transparent'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${isSelected
                                    ? 'bg-white/20'
                                    : `${style.bgLight} group-hover:bg-white`
                                    }`}>
                                    {getCategoryIcon(category.id, `w-5 h-5 ${isSelected ? 'text-white' : style.text}`, category.icon)}
                                </div>
                                <span className="flex-1 text-left">{category.name}</span>
                            </button>
                        );
                    })}
            </div>
        </aside>
    );
};

export default Sidebar;
