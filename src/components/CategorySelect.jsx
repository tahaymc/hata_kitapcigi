import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { COLOR_STYLES, ICON_OPTIONS } from '../utils/constants';
import { getCategoryIcon } from '../utils/helpers';

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
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl max-h-96 overflow-auto animate-in fade-in zoom-in-95 duration-100 p-1.5 flex flex-col gap-1">

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

export default CategorySelect;
