import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Clock, CornerDownLeft } from 'lucide-react';

// Arama-motoru tarzı anlık öneri kutusu.
//  - Yazarken: başlık/kod/özet içinde eşleşen kayıtlar listelenir (eşleşen
//    kısım vurgulanır).
//  - Boşken odaklanınca: en son eklenen kayıtlar (id'ye göre yeni->eski) gösterilir.
const SearchBar = ({
    searchTerm,
    setSearchTerm,
    placeholder = "Arama yap...",
    className = "",
    items = [],
    onSelect,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);

    const q = searchTerm.trim().toLowerCase();

    const suggestions = useMemo(() => {
        if (!q) {
            // Son eklenenler: id büyükten küçüğe (yeni kayıt = büyük id)
            return [...items]
                .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
                .slice(0, 6);
        }
        return items
            .filter(it =>
                (it.title && it.title.toLowerCase().includes(q)) ||
                (it.code && String(it.code).toLowerCase().includes(q)) ||
                (it.summary && it.summary.toLowerCase().includes(q))
            )
            .slice(0, 8);
    }, [items, q]);

    // Öneriler değişince aktif satırı sıfırla
    useEffect(() => { setActiveIndex(-1); }, [q, isOpen]);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const choose = (item) => {
        if (!item) return;
        onSelect?.(item);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setIsOpen(true);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                choose(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Eşleşen kısmı vurgula
    const highlight = (text) => {
        if (!q || !text) return text;
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 rounded px-0.5">
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    const showDropdown = isOpen && suggestions.length > 0;

    return (
        <div className={`relative z-[60] w-full ${className}`} ref={wrapperRef}>
            <div className={`relative flex items-center h-12 w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/70 shadow-sm shadow-blue-900/5 focus-within:ring-2 focus-within:ring-blue-500/15 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all duration-200 ${showDropdown ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'}`}>
                <div className="absolute left-3.5 text-slate-400">
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="w-full h-full pl-11 pr-16 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                {searchTerm ? (
                    <button
                        onClick={() => { setSearchTerm(''); setIsOpen(true); }}
                        className="absolute right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Temizle"
                    >
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <kbd className="hidden md:flex absolute right-3 items-center gap-0.5 px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                        ⌘K
                    </kbd>
                )}
            </div>

            {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-[70] bg-white dark:bg-slate-800 border border-t-0 border-slate-200/70 dark:border-slate-700/70 rounded-b-2xl shadow-xl shadow-blue-900/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {q ? (
                            <>
                                <Search className="w-3 h-3" />
                                Sonuçlar
                            </>
                        ) : (
                            <>
                                <Clock className="w-3 h-3" />
                                Son Eklenenler
                            </>
                        )}
                    </div>
                    <ul className="max-h-80 overflow-auto pb-1.5">
                        {suggestions.map((item, i) => (
                            <li key={item.id ?? i}>
                                <button
                                    type="button"
                                    onClick={() => choose(item)}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIndex === i ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}
                                >
                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400">
                                        <Search className="w-4 h-4" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {highlight(item.title || '—')}
                                        </span>
                                        {(item.code || item.summary) && (
                                            <span className="block text-xs text-slate-400 dark:text-slate-500 truncate">
                                                {item.code ? highlight(String(item.code)) : highlight(item.summary)}
                                            </span>
                                        )}
                                    </span>
                                    {activeIndex === i && (
                                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
