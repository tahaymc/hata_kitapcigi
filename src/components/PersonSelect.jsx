import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, Check, Search, X } from 'lucide-react';

const PersonSelect = ({ value, onChange, placeholder = "Personel Seçin", multiple = false }) => {
    const [people, setPeople] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const res = await fetch('/api/people');
                if (res.ok) {
                    const data = await res.json();
                    setPeople(data);
                }
            } catch (error) {
                console.error("Failed to fetch people for select:", error);
            }
        };
        fetchPeople();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Color mapping for avatar
    const getBgColor = (color) => {
        switch (color) {
            case 'blue': return 'bg-blue-100 text-blue-700';
            case 'emerald': return 'bg-emerald-100 text-emerald-700';
            case 'purple': return 'bg-purple-100 text-purple-700';
            case 'orange': return 'bg-orange-100 text-orange-700';
            case 'pink': return 'bg-pink-100 text-pink-700';
            case 'slate': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handleSelect = (personId) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(personId)) {
                onChange(currentValues.filter(id => id !== personId));
            } else {
                onChange([...currentValues, personId]);
            }
        } else {
            onChange(personId);
            setIsOpen(false);
        }
        setSearchTerm(''); // Clear search on select
    };

    const filteredPeople = people.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedPeople = multiple
        ? people.filter(p => (Array.isArray(value) ? value : []).includes(p.id))
        : people.filter(p => p.id === value);

    const renderTriggerContent = () => {
        if (selectedPeople.length === 0) {
            return <span className="text-slate-400 text-sm">{placeholder}</span>;
        }

        if (multiple) {
            return (
                <div className="flex flex-wrap gap-1.5">
                    {selectedPeople.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 pl-1 pr-1 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-full border border-slate-200 dark:border-slate-600">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getBgColor(p.color)}`}>
                                {p.name.split(' ').map((n, i, arr) => (i === 0 || i === arr.length - 1) ? n.charAt(0) : '').join('').toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{p.name}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(p.id);
                                }}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors ml-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        const selectedPerson = selectedPeople[0];
        return (
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getBgColor(selectedPerson.color)}`}>
                    {selectedPerson.name.split(' ').map((n, i, arr) => (i === 0 || i === arr.length - 1) ? n.charAt(0) : '').join('').toUpperCase()}
                </div>
                <span className="text-slate-900 dark:text-slate-100 font-medium text-sm">{selectedPerson.name}</span>
                {selectedPerson.role && <span className="text-xs text-slate-400">({selectedPerson.role})</span>}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border rounded-lg flex items-center justify-between outline-none transition-all min-h-[42px] cursor-pointer ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
            >
                {renderTriggerContent()}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 p-1.5 flex flex-col gap-1">
                    <div className="sticky top-0 bg-white dark:bg-slate-800 p-1 mb-1 border-b border-slate-100 dark:border-slate-700 z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Personel ara..."
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {!multiple && (
                        <button
                            type="button"
                            onClick={() => { onChange(null); setIsOpen(false); }}
                            className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-left mx-1"
                        >
                            Seçimi Kaldır
                        </button>
                    )}

                    {filteredPeople.map(p => {
                        const isSelected = multiple
                            ? (Array.isArray(value) ? value : []).includes(p.id)
                            : value === p.id;

                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelect(p.id)}
                                className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg transition-colors text-sm ${isSelected ? 'bg-slate-100 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getBgColor(p.color)}`}>
                                    {p.name.split(' ').map((n, i, arr) => (i === 0 || i === arr.length - 1) ? n.charAt(0) : '').join('').toUpperCase()}
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className={`font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {p.name}
                                    </span>
                                    {p.role && <span className="text-[10px] text-slate-400">{p.role}</span>}
                                </div>
                                {isSelected && <Check className="ml-auto w-4 h-4 text-blue-500" />}
                            </button>
                        );
                    })}
                    {filteredPeople.length === 0 && (
                        <div className="p-3 text-center text-slate-400 text-sm">
                            Sonuç bulunamadı.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PersonSelect;
