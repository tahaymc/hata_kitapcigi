import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Monitor, ShoppingCart, Archive, Settings, LayoutGrid, List, Calendar, Edit2, Eye, X, Image as ImageIcon, ChevronDown, Shield, Lock, ArrowRight, Moon, Sun, Plus, Save, Trash2, ChevronLeft, ChevronRight, Tag, Truck, Wifi, Printer, CreditCard, Smartphone, Package, AlertTriangle, HelpCircle, Database, Zap, Thermometer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategories, searchErrors, CATEGORIES, incrementViewCount, addError, updateError, deleteError } from '../data/mockData';
import ErrorDetailModal from '../components/ErrorDetailModal';

const ICON_OPTIONS = {
    shoppingCart: ShoppingCart,
    archive: Archive,
    monitor: Monitor,
    settings: Settings,
    tag: Tag,
    truck: Truck,
    wifi: Wifi,
    printer: Printer,
    creditCard: CreditCard,
    smartphone: Smartphone,
    package: Package,
    alertTriangle: AlertTriangle,
    helpCircle: HelpCircle,
    database: Database,
    zap: Zap,
    thermometer: Thermometer,
    bookOpen: BookOpen,
    shield: Shield
};

const getCategoryIcon = (categoryId, className = "w-6 h-6", iconName = null) => {
    // If iconName is provided (from category object), use it
    if (iconName && ICON_OPTIONS[iconName]) {
        const IconComponent = ICON_OPTIONS[iconName];
        return <IconComponent className={className} />;
    }

    // Fallback for legacy hardcoded categories
    switch (categoryId) {
        case 'kasa': return <ShoppingCart className={className} />;
        case 'reyon': return <Archive className={className} />;
        case 'depo': return <Archive className={className} />;
        case 'sistem': return <Monitor className={className} />;
        default: return <Settings className={className} />;
    }
};

const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.color : 'slate';
};

// Explicit mapping for Tailwind to detect classes
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
    },
    red: {
        gradient: 'from-red-500 to-red-400',
        text: 'text-red-400',
        bgLight: 'bg-red-500/10',
        borderLight: 'border-red-500/20',
        groupHoverText: 'group-hover:text-red-400',
        groupHoverBg: 'group-hover:bg-red-500/10',
        hoverBorder: 'hover:border-red-500/50',
        hoverShadow: 'hover:shadow-red-500/10',
        buttonSelected: 'bg-red-600 text-white shadow-lg shadow-red-500/30 border-red-500',
        buttonUnselectedHover: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50',
        bar: 'bg-red-500 w-1'
    },
    amber: {
        gradient: 'from-amber-500 to-amber-400',
        text: 'text-amber-400',
        bgLight: 'bg-amber-500/10',
        borderLight: 'border-amber-500/20',
        groupHoverText: 'group-hover:text-amber-400',
        groupHoverBg: 'group-hover:bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/50',
        hoverShadow: 'hover:shadow-amber-500/10',
        buttonSelected: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border-amber-500',
        buttonUnselectedHover: 'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/50',
        bar: 'bg-amber-500 w-1'
    },
    yellow: {
        gradient: 'from-yellow-500 to-yellow-400',
        text: 'text-yellow-400',
        bgLight: 'bg-yellow-500/10',
        borderLight: 'border-yellow-500/20',
        groupHoverText: 'group-hover:text-yellow-400',
        groupHoverBg: 'group-hover:bg-yellow-500/10',
        hoverBorder: 'hover:border-yellow-500/50',
        hoverShadow: 'hover:shadow-yellow-500/10',
        buttonSelected: 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/30 border-yellow-500',
        buttonUnselectedHover: 'hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/50',
        bar: 'bg-yellow-500 w-1'
    },
    lime: {
        gradient: 'from-lime-500 to-lime-400',
        text: 'text-lime-400',
        bgLight: 'bg-lime-500/10',
        borderLight: 'border-lime-500/20',
        groupHoverText: 'group-hover:text-lime-400',
        groupHoverBg: 'group-hover:bg-lime-500/10',
        hoverBorder: 'hover:border-lime-500/50',
        hoverShadow: 'hover:shadow-lime-500/10',
        buttonSelected: 'bg-lime-600 text-white shadow-lg shadow-lime-500/30 border-lime-500',
        buttonUnselectedHover: 'hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/50',
        bar: 'bg-lime-500 w-1'
    },
    green: {
        gradient: 'from-green-500 to-green-400',
        text: 'text-green-400',
        bgLight: 'bg-green-500/10',
        borderLight: 'border-green-500/20',
        groupHoverText: 'group-hover:text-green-400',
        groupHoverBg: 'group-hover:bg-green-500/10',
        hoverBorder: 'hover:border-green-500/50',
        hoverShadow: 'hover:shadow-green-500/10',
        buttonSelected: 'bg-green-600 text-white shadow-lg shadow-green-500/30 border-green-500',
        buttonUnselectedHover: 'hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50',
        bar: 'bg-green-500 w-1'
    },
    teal: {
        gradient: 'from-teal-500 to-teal-400',
        text: 'text-teal-400',
        bgLight: 'bg-teal-500/10',
        borderLight: 'border-teal-500/20',
        groupHoverText: 'group-hover:text-teal-400',
        groupHoverBg: 'group-hover:bg-teal-500/10',
        hoverBorder: 'hover:border-teal-500/50',
        hoverShadow: 'hover:shadow-teal-500/10',
        buttonSelected: 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 border-teal-500',
        buttonUnselectedHover: 'hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/50',
        bar: 'bg-teal-500 w-1'
    },
    cyan: {
        gradient: 'from-cyan-500 to-cyan-400',
        text: 'text-cyan-400',
        bgLight: 'bg-cyan-500/10',
        borderLight: 'border-cyan-500/20',
        groupHoverText: 'group-hover:text-cyan-400',
        groupHoverBg: 'group-hover:bg-cyan-500/10',
        hoverBorder: 'hover:border-cyan-500/50',
        hoverShadow: 'hover:shadow-cyan-500/10',
        buttonSelected: 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 border-cyan-500',
        buttonUnselectedHover: 'hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50',
        bar: 'bg-cyan-500 w-1'
    },
    sky: {
        gradient: 'from-sky-500 to-sky-400',
        text: 'text-sky-400',
        bgLight: 'bg-sky-500/10',
        borderLight: 'border-sky-500/20',
        groupHoverText: 'group-hover:text-sky-400',
        groupHoverBg: 'group-hover:bg-sky-500/10',
        hoverBorder: 'hover:border-sky-500/50',
        hoverShadow: 'hover:shadow-sky-500/10',
        buttonSelected: 'bg-sky-600 text-white shadow-lg shadow-sky-500/30 border-sky-500',
        buttonUnselectedHover: 'hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/50',
        bar: 'bg-sky-500 w-1'
    },
    indigo: {
        gradient: 'from-indigo-500 to-indigo-400',
        text: 'text-indigo-400',
        bgLight: 'bg-indigo-500/10',
        borderLight: 'border-indigo-500/20',
        groupHoverText: 'group-hover:text-indigo-400',
        groupHoverBg: 'group-hover:bg-indigo-500/10',
        hoverBorder: 'hover:border-indigo-500/50',
        hoverShadow: 'hover:shadow-indigo-500/10',
        buttonSelected: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-indigo-500',
        buttonUnselectedHover: 'hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/50',
        bar: 'bg-indigo-500 w-1'
    },
    violet: {
        gradient: 'from-violet-500 to-violet-400',
        text: 'text-violet-400',
        bgLight: 'bg-violet-500/10',
        borderLight: 'border-violet-500/20',
        groupHoverText: 'group-hover:text-violet-400',
        groupHoverBg: 'group-hover:bg-violet-500/10',
        hoverBorder: 'hover:border-violet-500/50',
        hoverShadow: 'hover:shadow-violet-500/10',
        buttonSelected: 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 border-violet-500',
        buttonUnselectedHover: 'hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/50',
        bar: 'bg-violet-500 w-1'
    },
    fuchsia: {
        gradient: 'from-fuchsia-500 to-fuchsia-400',
        text: 'text-fuchsia-400',
        bgLight: 'bg-fuchsia-500/10',
        borderLight: 'border-fuchsia-500/20',
        groupHoverText: 'group-hover:text-fuchsia-400',
        groupHoverBg: 'group-hover:bg-fuchsia-500/10',
        hoverBorder: 'hover:border-fuchsia-500/50',
        hoverShadow: 'hover:shadow-fuchsia-500/10',
        buttonSelected: 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30 border-fuchsia-500',
        buttonUnselectedHover: 'hover:bg-fuchsia-500/10 hover:text-fuchsia-400 hover:border-fuchsia-500/50',
        bar: 'bg-fuchsia-500 w-1'
    },
    pink: {
        gradient: 'from-pink-500 to-pink-400',
        text: 'text-pink-400',
        bgLight: 'bg-pink-500/10',
        borderLight: 'border-pink-500/20',
        groupHoverText: 'group-hover:text-pink-400',
        groupHoverBg: 'group-hover:bg-pink-500/10',
        hoverBorder: 'hover:border-pink-500/50',
        hoverShadow: 'hover:shadow-pink-500/10',
        buttonSelected: 'bg-pink-600 text-white shadow-lg shadow-pink-500/30 border-pink-500',
        buttonUnselectedHover: 'hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/50',
        bar: 'bg-pink-500 w-1'
    },
    rose: {
        gradient: 'from-rose-500 to-rose-400',
        text: 'text-rose-400',
        bgLight: 'bg-rose-500/10',
        borderLight: 'border-rose-500/20',
        groupHoverText: 'group-hover:text-rose-400',
        groupHoverBg: 'group-hover:bg-rose-500/10',
        hoverBorder: 'hover:border-rose-500/50',
        hoverShadow: 'hover:shadow-rose-500/10',
        buttonSelected: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 border-rose-500',
        buttonUnselectedHover: 'hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/50',
        bar: 'bg-rose-500 w-1'
    }
};

const CategorySelect = ({ value, onChange, categories, placeholder = "Kategori Seçin", onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCatId, setEditingCatId] = useState(null);

    // Shared form state for both Add and Edit
    const [formName, setFormName] = useState("");
    const [formColor, setFormColor] = useState("slate");
    const [formIcon, setFormIcon] = useState("settings");

    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsAdding(false);
                setEditingCatId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const startAdd = () => {
        setIsAdding(true);
        setEditingCatId(null);
        setFormName("");
        setFormColor("slate");
        setFormIcon("settings");
    };

    const startEdit = (e, c) => {
        e.stopPropagation(); // Don't select the category
        setEditingCatId(c.id);
        setIsAdding(false);
        setFormName(c.name);
        setFormColor(c.color);
        setFormIcon(c.icon || "settings");
    };

    const handleSaveAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!formName.trim() || !onAddCategory) return;

        const success = await onAddCategory(formName, formColor, formIcon);
        if (success) {
            setIsAdding(false);
            setFormName("");
            setFormColor("slate");
            setFormIcon("settings");
            // Optionally close dropdown or stay open
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!formName.trim() || !onUpdateCategory) return;

        const success = await onUpdateCategory(editingCatId, formName, formColor, formIcon);
        if (success) {
            setEditingCatId(null);
            setFormName("");
            setFormColor("slate");
            setFormIcon("settings");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
        if (onDeleteCategory) {
            await onDeleteCategory(id);
            if (value === id) onChange(null); // Clear selection if deleted
        }
    };

    const cancelForm = (e) => {
        e.stopPropagation();
        setIsAdding(false);
        setEditingCatId(null);
        setFormName("");
        setFormColor("slate");
    };

    const selectedCat = categories.find(c => c.id === value);
    const selectedColor = selectedCat ? (COLOR_STYLES[selectedCat.color] || COLOR_STYLES.slate) : COLOR_STYLES.slate;

    // Helper to render the form (used for both Add and Edit)
    const renderForm = (isEdit = false) => (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    {isEdit ? "Kategoriyi Düzenle" : "Yeni Kategori Adı"}
                </label>
                <input
                    type="text"
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Örn: Muhasebe"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    onClick={e => e.stopPropagation()}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Simge Seçin</label>
                <div className="grid grid-cols-6 gap-2">
                    {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFormIcon(key); }}
                            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${formIcon === key ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            title={key}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Renk Seçin</label>
                <div className="grid grid-cols-6 gap-2">
                    {Object.keys(COLOR_STYLES).map(colorKey => (
                        <button
                            key={colorKey}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFormColor(colorKey); }}
                            className={`w-6 h-6 rounded-full ${COLOR_STYLES[colorKey].bar.replace('w-1', '')} ${formColor === colorKey ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'} transition-all`}
                            title={colorKey}
                        />
                    ))}
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    İptal
                </button>
                <button
                    type="button"
                    onClick={isEdit ? handleSaveEdit : handleSaveAdd}
                    disabled={!formName.trim()}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    {isEdit ? "Güncelle" : "Ekle"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border rounded-lg flex items-center justify-between outline-none transition-all ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
            >
                {selectedCat ? (
                    <div className="flex items-center gap-3">
                        <span className={`${selectedColor.text} p-1 ${selectedColor.bgLight} rounded-lg`}>
                            {getCategoryIcon(selectedCat.id, "w-4 h-4", selectedCat.icon)}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{selectedCat.name}</span>
                    </div>
                ) : (
                    <span className="text-slate-400">{placeholder}</span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl max-h-96 overflow-auto animate-in fade-in zoom-in-95 duration-100 p-1.5 flex flex-col gap-1">

                    {/* List Categories */}
                    {categories.map(c => {
                        const isEditing = editingCatId === c.id;
                        if (isEditing) {
                            return <div key={c.id}>{renderForm(true)}</div>;
                        }

                        const cStyle = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                        const isSelected = c.id === value;
                        return (
                            <div key={c.id} className="group relative flex items-center">
                                <button
                                    type="button"
                                    onClick={() => { onChange(c.id); setIsOpen(false); }}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 rounded-lg transition-colors text-sm ${isSelected ? 'bg-slate-100 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                                >
                                    <span className={`${cStyle.text} p-1.5 rounded-md ${cStyle.bgLight} group-hover:scale-110 transition-transform`}>
                                        {getCategoryIcon(c.id, "w-4 h-4", c.icon)}
                                    </span>
                                    <span className={`font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {c.name}
                                    </span>
                                    {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                </button>

                                {/* Edit/Delete Actions (Visible on Hover) */}
                                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-sm rounded-md border border-slate-100 dark:border-slate-700 p-0.5">
                                    <button
                                        type="button"
                                        onClick={(e) => startEdit(e, c)}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, c.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Section */}
                    {isAdding ? (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {renderForm(false)}
                        </div>
                    ) : (
                        <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); startAdd(); }}
                                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Yeni Kategori Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedError, setSelectedError] = useState(null); // For Modal
    const [previewGallery, setPreviewGallery] = useState(null); // For Quick Image View { images: [], index: 0 }
    const [hoverSlideshow, setHoverSlideshow] = useState({ id: null, index: 0 }); // For Card Hover Effect

    // Hover Slideshow Effect
    useEffect(() => {
        let interval;
        if (hoverSlideshow.id) {
            interval = setInterval(() => {
                setHoverSlideshow(prev => {
                    if (prev.id !== hoverSlideshow.id) return prev;
                    // Find the error to know how many images it has
                    const error = errors.find(e => e.id === hoverSlideshow.id);
                    if (!error) return prev;

                    const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                    if (images.length <= 1) return prev;

                    return { ...prev, index: (prev.index + 1) % images.length };
                });
            }, 1000); // Switch every 1 second
        }
        return () => clearInterval(interval);
    }, [hoverSlideshow.id, errors]);

    // Prevent body scroll when preview gallery is open
    useEffect(() => {
        if (previewGallery) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [previewGallery]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // Custom Dropdown State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Login Modal State

    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newErrorData, setNewErrorData] = useState({
        title: '', code: '', category: 'kasa', summary: '', solution: '', imageUrl: null, imageUrls: [],
        solutionType: 'steps', // Enforcing 'steps'
        solutionSteps: [{ text: '', imageUrl: null }]
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingError, setEditingError] = useState(null);

    useEffect(() => {
        const adminAuth = localStorage.getItem('isAdminAuthenticated');
        if (adminAuth === 'true') {
            setIsAdmin(true);
        }
    }, []);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Default fallback style
    const defaultStyle = COLOR_STYLES['slate'];

    useEffect(() => {
        getCategories().then(setCategories);
        searchErrors('', null).then(setErrors);
    }, []);

    useEffect(() => {
        searchErrors(searchTerm, selectedCategory, selectedDate).then(setErrors);
    }, [searchTerm, selectedCategory, selectedDate]);

    const handleAddCategory = async (name, color, icon) => {
        try {
            // Using absolute URL isn't necessary if proxy is set up or relative path works, but sticking to relative '/api'
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, icon })
            });
            if (response.ok) {
                const newCat = await response.json();
                setCategories([...categories, newCat]);
                return newCat.id;
            }
        } catch (e) {
            console.error('Failed to add category', e);
        }
        return null;
    };

    const handleUpdateCategory = async (id, name, color, icon) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, icon })
            });
            if (response.ok) {
                const updatedCat = await response.json();
                setCategories(categories.map(c => c.id === id ? updatedCat : c));
                return true;
            }
        } catch (e) {
            console.error('Failed to update category', e);
        }
        return false;
    };

    const handleDeleteCategory = async (id) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setCategories(categories.filter(c => c.id !== id));
                return true;
            }
        } catch (e) {
            console.error('Failed to delete category', e);
        }
        return false;
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginData.username === 'admin' && loginData.password === 'admin') {
            localStorage.setItem('isAdminAuthenticated', 'true');
            setIsAdmin(true);
            setIsLoginModalOpen(false);
            setLoginData({ username: '', password: '' });
        } else {
            alert("Hatalı kullanıcı adı veya şifre! (Demo: admin / admin)");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        setIsAdmin(false);
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const compressedImages = await Promise.all(files.map(file => compressImage(file)));

        setNewErrorData(prev => ({
            ...prev,
            imageUrls: [...(prev.imageUrls || []), ...compressedImages]
        }));
    };

    const handleAddErrorSubmit = async (e) => {
        e.preventDefault();

        // Format solution always as steps
        const finalSolution = newErrorData.solutionSteps
            .filter(step => step.text.trim() !== '')
            .map((step, index) => `${index + 1}. ${step.text}`)
            .join('\n');

        try {
            const newError = await addError({
                ...newErrorData,
                solution: finalSolution, // For backward compatibility
                solutionType: 'steps',
                solutionSteps: newErrorData.solutionSteps,
                imageUrl: newErrorData.imageUrls?.[0] || newErrorData.imageUrl
            });

            if (newError) {
                setErrors([newError, ...errors]);
                setIsAddModalOpen(false);
                setIsAddModalOpen(false);
                setNewErrorData({ title: '', code: '', category: 'kasa', summary: '', solution: '', imageUrl: null, imageUrls: [], solutionType: 'steps', solutionSteps: [{ text: '', imageUrl: null }] });
                alert('Hata başarıyla eklendi!');
            }
        } catch (error) {
            alert('Hata eklenirken bir sorun oluştu.');
        }
    };

    const handleDeleteClick = async (e, errorId) => {
        e.stopPropagation();
        if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteError(errorId);
            const updatedErrors = await searchErrors(searchTerm, selectedCategory, selectedDate);
            setErrors(updatedErrors);
        }
    };

    const handleEditClick = (e, error) => {
        e.stopPropagation();

        let steps = [{ text: '', imageUrl: null }];

        if (error.solutionType === 'steps' && error.solutionSteps && error.solutionSteps.length > 0) {
            steps = error.solutionSteps;
        } else {
            // Fallback parsing for legacy data
            const isSteps = /^\s*\d+\./.test(error.solution);
            if (isSteps) {
                const parsedSteps = error.solution.split('\n')
                    .map(line => line.replace(/^\d+\.\s*/, ''))
                    .filter(s => s.trim() !== '');

                if (parsedSteps.length > 0) {
                    steps = parsedSteps.map(text => ({ text, imageUrl: null }));
                }
            } else if (error.solution) {
                // Determine if it looks like there are steps even without numbering (paragraphs)
                // or just put everything in one step
                steps = [{ text: error.solution, imageUrl: null }];
            }
        }

        setEditingError({
            ...error,
            imageUrls: error.imageUrls || (error.imageUrl ? [error.imageUrl] : []),
            solutionType: 'steps',
            solutionSteps: steps
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        // Format solution always as steps
        const finalSolution = editingError.solutionSteps
            .filter(step => step.text.trim() !== '')
            .map((step, index) => `${index + 1}. ${step.text}`)
            .join('\n');

        try {
            await updateError({
                ...editingError,
                solution: finalSolution,
                solutionType: 'steps',
                solutionSteps: editingError.solutionSteps,
                imageUrls: editingError.imageUrls
            });
            setIsEditModalOpen(false);
            setEditingError(null);
            // Refresh errors
            const updatedErrors = await searchErrors(searchTerm, selectedCategory, selectedDate);
            setErrors(updatedErrors);
            alert('Kayıt güncellendi!');
        } catch (error) {
            alert('Hata güncellenirken bir sorun oluştu.');
        }
    };

    const handleCardClick = async (error) => {
        // Attempt to increment view count
        const updatedError = await incrementViewCount(error.id);

        if (updatedError) {
            // Update local list state if successful
            setErrors(prev => prev.map(e => e.id === error.id ? updatedError : e));
            setSelectedError(updatedError);
        } else {
            // Fallback: If API fails (e.g. Vercel static deployment), still open the modal with existing data
            setSelectedError(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-[#1e293b]/90 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-10 backdrop-blur-md">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory(null);
                        setSelectedDate(null);
                        navigate('/');
                    }}>
                        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300 ring-1 ring-white/20">
                            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                                Hata<span className="font-light text-slate-500 dark:text-slate-300">Kitapçığı</span>
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="h-px w-3 bg-blue-500/50 rounded-full"></span>
                                <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Çözüm Merkezi</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider ${isAdmin ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            <span>{isAdmin ? 'Yönetici' : 'Misafir'}</span>
                        </div>

                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700/50"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {isAdmin ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-all shadow-lg shadow-blue-500/20 text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Yeni Ekle</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-all text-sm border border-red-500/20"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/90 transition-all duration-300 group"
                            >
                                <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
                                    <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                </div>
                                <span>Yönetici Girişi</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-10">
                {/* Search Section */}
                <div className="mb-12 relative">
                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className="flex items-center bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl hover:border-blue-500/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all group">
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

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700/50 mx-2"></div>

                            {/* Category Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group/cat cursor-pointer min-w-[180px]"
                                >
                                    <div className={`transition-colors ${selectedCategory ? COLOR_STYLES[categories.find(c => c.id === selectedCategory)?.color]?.text || 'text-blue-400' : 'text-slate-400'}`}>
                                        {selectedCategory ? getCategoryIcon(selectedCategory) : <LayoutGrid className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${selectedCategory ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 group-hover/cat:text-slate-700 dark:group-hover/cat:text-slate-300'}`}>
                                        {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Tüm Kategoriler'}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-auto transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-1.5 space-y-0.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${!selectedCategory ? 'bg-blue-600/10 text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                                <span>Tüm Kategoriler</span>
                                            </button>
                                            {categories.map(c => {
                                                const style = COLOR_STYLES[c.color] || defaultStyle;
                                                const isSelected = selectedCategory === c.id;
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCategory(c.id);
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group/item ${isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                    >
                                                        <div className={`scale-90 transition-colors ${style.text}`}>
                                                            {getCategoryIcon(c.id)}
                                                        </div>
                                                        <span className={`transition-colors ${isSelected ? 'text-slate-900 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-slate-200'}`}>
                                                            {c.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                </div>

                {/* Active Filters Indicator */}
                {(selectedDate || selectedCategory) && (
                    <div className="flex justify-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all group"
                            >
                                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                <span>{selectedDate}</span>
                                <div className="bg-slate-700 rounded-full p-0.5 group-hover:bg-slate-600 ml-1">
                                    <X className="w-3 h-3" />
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* Categories & View Toggle Loop Removed */}

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
                                    className={`bg-white dark:bg-[#1e293b] rounded-3xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-slate-700/50 ${style.hoverBorder} ${style.hoverShadow} transition-all duration-300 group cursor-pointer relative hover:z-50`}
                                    onClick={() => handleCardClick(error)}
                                >
                                    {/* Top Bar with Dynamic Color */}
                                    <div className={`h-1.5 w-24 absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r ${style.gradient} rounded-b-xl shadow-lg shadow-${style.text.split('-')[1]}-500/20`}></div>

                                    <div className="p-6 pt-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 bg-slate-50 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700/50 shadow-inner ${style.text} ${style.groupHoverBg} transition-all`}>
                                                {getCategoryIcon(error.category)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-md ${style.bgLight} border ${style.borderLight} ${style.text} font-mono font-bold text-xs tracking-wider`}>
                                                    {error.code || 'SYS-000'}
                                                </div>
                                                {/* Static Image Preview Button with Hover Pop */}
                                                {(error.imageUrl || (error.imageUrls && error.imageUrls.length > 0)) && (
                                                    <div
                                                        className="relative group/preview"
                                                        onMouseEnter={() => setHoverSlideshow({ id: error.id, index: 0 })}
                                                        onMouseLeave={() => setHoverSlideshow({ id: null, index: 0 })}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                                                setPreviewGallery({ images, index: 0 });
                                                            }}
                                                            className={`p-1.5 rounded-md ${style.bgLight} border ${style.borderLight} ${style.text} hover:bg-${colorKey}-500 hover:text-white transition-all`}
                                                            title="Büyütmek için tıkla"
                                                        >
                                                            <ImageIcon className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Hover Popup */}
                                                        <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl opacity-0 invisible group-hover/preview:opacity-100 group-hover/preview:visible transition-all duration-300 z-20 pointer-events-none">
                                                            <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-[#0f172a] rounded-lg overflow-hidden relative">
                                                                <img
                                                                    src={
                                                                        hoverSlideshow.id === error.id
                                                                            ? ((error.imageUrls && error.imageUrls.length > 0) ? error.imageUrls[hoverSlideshow.index] : error.imageUrl)
                                                                            : (error.imageUrl || (error.imageUrls && error.imageUrls[0]))
                                                                    }
                                                                    alt="Önizleme"
                                                                    className="w-full h-full object-cover transition-opacity duration-300"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end justify-center p-2">
                                                                    <span className="text-[10px] text-white font-medium">Tıkla ve Büyüt</span>
                                                                </div>
                                                                {(error.imageUrls && error.imageUrls.length > 1) && (
                                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-[2px] rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                                        <span>{hoverSlideshow.id === error.id ? hoverSlideshow.index + 1 : 1}</span>
                                                                        <span className="opacity-60">/</span>
                                                                        <span>{error.imageUrls.length}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`text-xl font-bold text-slate-800 dark:text-white mb-3 ${style.groupHoverText} transition-colors flex-1`}>
                                                    {error.title}
                                                </h3>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <button
                                                            onClick={(e) => handleEditClick(e, error)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                            title="Düzenle"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, error.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
                                                {error.summary}
                                            </p>
                                        </div>
                                        <div className="relative flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-4 min-h-[42px]">
                                            {/* Left: Category Badge */}
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategory(error.category);
                                                }}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bgLight} ${style.text} border ${style.borderLight} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                                            >
                                                {categories.find(c => c.id === error.category)?.name}
                                            </span>

                                            {/* Center: Date (Moved here) */}
                                            {/* Center: Date (Moved here) */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDate(selectedDate === error.date ? null : error.date);
                                                }}
                                                className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer border ${selectedDate === error.date
                                                    ? 'text-white bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/25'
                                                    : 'text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-white'
                                                    }`}
                                                title="Tarihe göre filtrele"
                                            >
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{error.date}</span>
                                            </div>

                                            {/* Right: View Count (New) */}
                                            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${style.bgLight} ${style.borderLight} ${style.text}`} title="Görüntülenme Sayısı">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{error.viewCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // List View
                                <div
                                    key={error.id}
                                    className={`bg-white dark:bg-[#1e293b] py-6 px-4 rounded-xl border border-slate-200 dark:border-slate-700/50 ${style.hoverBorder} hover:bg-slate-50 dark:hover:bg-[#253248] transition-all cursor-pointer group flex items-center gap-6 relative hover:z-50`}
                                    onClick={() => handleCardClick(error)}
                                >
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 ${style.bar.replace('w-1', '')} bg-${style.bar.split(' ')[0].replace('bg-', '')} rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[2px_0_8px_-2px_rgba(0,0,0,0.5)]`}></div>

                                    <div className={`w-12 h-12 bg-slate-50 dark:bg-[#0f172a] rounded-xl flex flex-shrink-0 items-center justify-center border border-slate-200 dark:border-slate-700/50 ${style.text} ${style.groupHoverBg} transition-all`}>
                                        {getCategoryIcon(error.category)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded ${style.bgLight} border ${style.borderLight} ${style.text} font-mono font-bold text-[10px] tracking-wider`}>
                                                {error.code || 'SYS-000'}
                                            </span>
                                            <h3 className={`text-lg font-bold text-slate-800 dark:text-white ${style.groupHoverText} transition-colors truncate flex-1`}>
                                                {error.title}
                                            </h3>

                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                                            {error.summary}
                                        </p>
                                    </div>

                                    <div className="hidden md:flex flex-row items-center gap-3 min-w-fit">
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCategory(error.category);
                                            }}
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bgLight} ${style.text} border ${style.borderLight} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                                        >
                                            {categories.find(c => c.id === error.category)?.name}
                                        </span>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDate(selectedDate === error.date ? null : error.date);
                                            }}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm cursor-pointer transition-colors ${selectedDate === error.date
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/50 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'
                                                }`}
                                        >
                                            <Calendar className={`w-3.5 h-3.5 ${selectedDate === error.date ? 'text-white' : 'text-slate-400'}`} />
                                            <span>{error.date}</span>
                                        </div>

                                        {/* Static Image Preview Button with Hover Pop */}
                                        {(error.imageUrl || (error.imageUrls && error.imageUrls.length > 0)) && (
                                            <div
                                                className="relative group/preview"
                                                onMouseEnter={() => setHoverSlideshow({ id: error.id, index: 0 })}
                                                onMouseLeave={() => setHoverSlideshow({ id: null, index: 0 })}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                                        setPreviewGallery({ images, index: 0 });
                                                    }}
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-600/50"
                                                    title="Büyütmek için tıkla"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                </button>

                                                {/* Hover Popup */}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-48 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl opacity-0 invisible group-hover/preview:opacity-100 group-hover/preview:visible transition-all duration-300 z-20 pointer-events-none">
                                                    <div className="aspect-[3/4] w-full bg-[#0f172a] rounded-lg overflow-hidden relative">
                                                        <img
                                                            src={
                                                                hoverSlideshow.id === error.id
                                                                    ? ((error.imageUrls && error.imageUrls.length > 0) ? error.imageUrls[hoverSlideshow.index] : error.imageUrl)
                                                                    : (error.imageUrl || (error.imageUrls && error.imageUrls[0]))
                                                            }
                                                            alt="Önizleme"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end justify-center p-2">
                                                            <span className="text-[10px] text-white font-medium">Tıkla ve Büyüt</span>
                                                        </div>
                                                        {(error.imageUrls && error.imageUrls.length > 1) && (
                                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-[2px] rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                                <span>{hoverSlideshow.id === error.id ? hoverSlideshow.index + 1 : 1}</span>
                                                                <span className="opacity-60">/</span>
                                                                <span>{error.imageUrls.length}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Arrow Pointer */}
                                                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 border-t border-r border-slate-700 transform rotate-45"></div>
                                                </div>
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700/50">
                                                <button
                                                    onClick={(e) => handleEditClick(e, error)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, error.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-[#1e293b] rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Search className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 dark:text-slate-300">Sonuç Bulunamadı</h3>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedError && (
                    <ErrorDetailModal
                        error={selectedError}
                        onClose={() => setSelectedError(null)}
                    />
                )}

                {/* Login Modal */}
                {isLoginModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setIsLoginModalOpen(false)}
                    >
                        <div
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Gradient */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                    <Lock className="w-8 h-8 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Yönetici Girişi</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Devam etmek için lütfen giriş yapın</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Kullanıcı Adı</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="örn: admin"
                                        value={loginData.username}
                                        onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Şifre</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="••••••"
                                        value={loginData.password}
                                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                                >
                                    <span>Giriş Yap</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            <button
                                className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => setIsLoginModalOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Quick Image Preview Gallery Modal */}
                {previewGallery && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setPreviewGallery(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                            onClick={() => setPreviewGallery(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Navigation Arrows */}
                        {previewGallery.images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewGallery(prev => ({ ...prev, index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1 }));
                                    }}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewGallery(prev => ({ ...prev, index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0 }));
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <img
                            src={previewGallery.images[previewGallery.index]}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Counter Bubble */}
                        {previewGallery.images.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm border border-white/10">
                                {previewGallery.index + 1} / {previewGallery.images.length}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Error Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsAddModalOpen(false)}>
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Hata Ekle</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddErrorSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hata Kodu</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            placeholder="Örn: SYS-101"
                                            value={newErrorData.code}
                                            onChange={e => setNewErrorData({ ...newErrorData, code: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                                        <CategorySelect
                                            value={newErrorData.category}
                                            onChange={(val) => setNewErrorData({ ...newErrorData, category: val })}
                                            categories={categories}
                                            onAddCategory={handleAddCategory}
                                            onUpdateCategory={handleUpdateCategory}
                                            onDeleteCategory={handleDeleteCategory}
                                        />
                                    </div>
                                </div>

                                {/* Image Upload Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hata Görselleri</label>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">Maks. 5MB (Çoklu Seçim)</span>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {/* Upload Area */}
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-blue-600 dark:text-blue-400">Görsel yüklemek için tıklayın</span> veya sürükleyin</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, GIF</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                        </label>

                                        {/* Image Preview Grid */}
                                        {(newErrorData.imageUrls && newErrorData.imageUrls.length > 0) && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
                                                {newErrorData.imageUrls.map((url, index) => (
                                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = newErrorData.imageUrls.filter((_, i) => i !== index);
                                                                    setNewErrorData({ ...newErrorData, imageUrls: newImages, imageUrl: newImages[0] || null });
                                                                }}
                                                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform scale-90 hover:scale-100"
                                                                title="Görseli Kaldır"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {index === 0 && (
                                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500/90 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow-sm">
                                                                Kapak
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hata Başlığı</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="Hata başlığını giriniz"
                                        value={newErrorData.title}
                                        onChange={e => setNewErrorData({ ...newErrorData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özet (Listede görünür)</label>
                                    <textarea
                                        required
                                        rows="2"
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="Sorunu kısaca açıklayın..."
                                        value={newErrorData.summary}
                                        onChange={e => setNewErrorData({ ...newErrorData, summary: e.target.value })}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
                                    <div className="space-y-4">
                                        {newErrorData.solutionSteps.map((step, index) => (
                                            <div key={index} className="flex gap-3 group items-start">
                                                <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-mono text-sm mt-1">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex-grow space-y-2">
                                                    <div className="relative">
                                                        <textarea
                                                            rows="2"
                                                            className="w-full pl-4 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y"
                                                            placeholder={`${index + 1}. Adımı girin...`}
                                                            value={step.text}
                                                            onChange={(e) => {
                                                                const newSteps = [...newErrorData.solutionSteps];
                                                                newSteps[index] = { ...newSteps[index], text: e.target.value };
                                                                setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    setNewErrorData({ ...newErrorData, solutionSteps: [...newErrorData.solutionSteps, { text: '', imageUrl: null }] });
                                                                }
                                                            }}
                                                        ></textarea>
                                                        <div className="absolute right-2 top-2 flex items-center gap-1">
                                                            <label className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer select-none border border-slate-200 dark:border-slate-700">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span>Görsel</span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const compressed = await compressImage(file);
                                                                            const newSteps = [...newErrorData.solutionSteps];
                                                                            newSteps[index] = { ...newSteps[index], imageUrl: compressed };
                                                                            setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            {newErrorData.solutionSteps.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSteps = newErrorData.solutionSteps.filter((_, i) => i !== index);
                                                                        setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                    title="Adımı Sil"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {step.imageUrl && (
                                                        <div className="relative inline-block group/img">
                                                            <img src={step.imageUrl} alt="" className="h-20 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSteps = [...newErrorData.solutionSteps];
                                                                    newSteps[index] = { ...newSteps[index], imageUrl: null };
                                                                    setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                }}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setNewErrorData({ ...newErrorData, solutionSteps: [...newErrorData.solutionSteps, { text: '', imageUrl: null }] })}
                                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Yeni Adım Ekle
                                        </button>
                                    </div>
                                </div>



                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Kaydet
                                    </button>
                                </div>
                            </form >
                        </div >
                    </div >
                )}

                {/* Edit Error Modal */}
                {
                    isEditModalOpen && editingError && (
                        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsEditModalOpen(false)}>
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kaydı Düzenle</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hata Kodu</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                value={editingError.code}
                                                onChange={e => setEditingError({ ...editingError, code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                                            <CategorySelect
                                                value={editingError.category}
                                                onChange={(val) => setEditingError({ ...editingError, category: val })}
                                                categories={categories}
                                                onAddCategory={handleAddCategory}
                                                onUpdateCategory={handleUpdateCategory}
                                                onDeleteCategory={handleDeleteCategory}
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hata Görselleri</label>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">Maks. 5MB (Çoklu Seçim)</span>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {/* Upload Area */}
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                        <ImageIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-blue-600 dark:text-blue-400">Görsel yüklemek için tıklayın</span> veya sürükleyin</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, GIF</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files);
                                                        const compressedImages = await Promise.all(files.map(file => compressImage(file)));

                                                        setEditingError(prev => ({
                                                            ...prev,
                                                            imageUrls: [...(prev.imageUrls || []), ...compressedImages]
                                                        }));
                                                    }}
                                                />
                                            </label>

                                            {/* Image Preview Grid */}
                                            {(editingError.imageUrls && editingError.imageUrls.length > 0) && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
                                                    {editingError.imageUrls.map((url, index) => (
                                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newImages = editingError.imageUrls.filter((_, i) => i !== index);
                                                                        setEditingError({ ...editingError, imageUrls: newImages, imageUrl: newImages[0] || null });
                                                                    }}
                                                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform scale-90 hover:scale-100"
                                                                    title="Görseli Kaldır"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {index === 0 && (
                                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500/90 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow-sm">
                                                                    Kapak
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hata Başlığı</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            value={editingError.title}
                                            onChange={e => setEditingError({ ...editingError, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özet</label>
                                        <textarea
                                            required
                                            rows="2"
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            value={editingError.summary}
                                            onChange={e => setEditingError({ ...editingError, summary: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
                                        <div className="space-y-4">
                                            {editingError.solutionSteps.map((step, index) => (
                                                <div key={index} className="flex gap-3 group items-start">
                                                    <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-mono text-sm mt-1">
                                                        {index + 1}.
                                                    </span>
                                                    <div className="flex-grow space-y-2">
                                                        <div className="relative">
                                                            <textarea
                                                                rows="2"
                                                                className="w-full pl-4 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y"
                                                                placeholder={`${index + 1}. Adımı girin...`}
                                                                value={step.text}
                                                                onChange={(e) => {
                                                                    const newSteps = [...editingError.solutionSteps];
                                                                    newSteps[index] = { ...newSteps[index], text: e.target.value };
                                                                    setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { text: '', imageUrl: null }] });
                                                                    }
                                                                }}
                                                            ></textarea>
                                                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                                                <label className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer select-none border border-slate-200 dark:border-slate-700">
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    <span>Görsel</span>
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                const compressed = await compressImage(file);
                                                                                const newSteps = [...editingError.solutionSteps];
                                                                                newSteps[index] = { ...newSteps[index], imageUrl: compressed };
                                                                                setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                                {editingError.solutionSteps.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newSteps = editingError.solutionSteps.filter((_, i) => i !== index);
                                                                            setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                        title="Adımı Sil"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {step.imageUrl && (
                                                            <div className="relative inline-block group/img">
                                                                <img src={step.imageUrl} alt="" className="h-20 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSteps = [...editingError.solutionSteps];
                                                                        newSteps[index] = { ...newSteps[index], imageUrl: null };
                                                                        setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                    }}
                                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { text: '', imageUrl: null }] })}
                                                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Yeni Adım Ekle
                                            </button>
                                        </div>
                                    </div>



                                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Kaydet
                                        </button>
                                    </div>
                                </form >
                            </div >
                        </div >
                    )
                }
            </main >
        </div >
    );
};

export default HomePage;
