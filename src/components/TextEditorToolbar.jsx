import React, { useState } from 'react';
import { Bold, Italic, Palette, ChevronDown } from 'lucide-react';

const COLORS = [
    { name: 'Kırmızı', value: 'red' },
    { name: 'Turuncu', value: 'orange' },
    { name: 'Sarı', value: 'amber' },
    { name: 'Yeşil', value: 'green' },
    { name: 'Mavi', value: 'blue' },
    { name: 'Lacivert', value: 'indigo' },
    { name: 'Mor', value: 'violet' },
    { name: 'Pembe', value: 'pink' },
    { name: 'Gri', value: 'slate' },
];

const TextEditorToolbar = ({ onFormat }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-t-lg border-x border-t border-slate-200 dark:border-slate-700">
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onFormat('bold');
                }}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                title="Kalın (Bold)"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onFormat('italic');
                }}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                title="İtalik"
            >
                <Italic className="w-4 h-4" />
            </button>

            <div className="relative">
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setShowColorPicker(!showColorPicker);
                    }}
                    className="p-1.5 flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                    title="Renk Seç"
                >
                    <Palette className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {showColorPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setShowColorPicker(false);
                            }}
                        ></div>
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-5 gap-1 z-20 w-40">
                            {COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onFormat('color', color.value);
                                        setShowColorPicker(false);
                                    }}
                                    className={`w-6 h-6 rounded-full bg-${color.value}-500 hover:scale-110 transition-transform ring-1 ring-offset-1 ring-transparent hover:ring-slate-300 dark:ring-offset-slate-800`}
                                    title={color.name}
                                ></button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TextEditorToolbar;
