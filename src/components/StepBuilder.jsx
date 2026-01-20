import React from 'react';
import { X, Image as ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { compressImage } from '../utils/helpers';
import TextEditorToolbar from './TextEditorToolbar';
import RichTextEditor from './RichTextEditor';

export const SubStepItem = ({ subStep, subIndex, index, onUpdate, onDelete }) => {
    const editorRef = React.useRef(null);

    const handleFormat = (type, value) => {
        if (editorRef.current) {
            editorRef.current.format(type, value);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file);
            onUpdate({ ...subStep, imageUrl: compressed });
        }
    };

    return (
        <div className="relative pl-6 group/sub">
            {/* Connector Line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 group-last/sub:h-8"></div>
            <div className="absolute left-0 top-3 w-4 h-px bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                    <span className="flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                        {subIndex + 1}
                    </span>
                </div>

                <div className="flex-grow min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm group-hover/sub:border-slate-300 dark:group-hover/sub:border-slate-600 transition-colors">
                        <TextEditorToolbar onFormat={handleFormat} />
                        <div className="relative">
                            <RichTextEditor
                                ref={editorRef}
                                className="w-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 min-h-[4rem]"
                                placeholder="Alt açıklama..."
                                value={subStep.text}
                                onChange={(val) => onUpdate({ ...subStep, text: val })}
                            />

                            {/* Image and Delete Actions - Overlay on hover or active */}
                            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <label className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md cursor-pointer transition-colors" title="Görsel Ekle">
                                    <ImageIcon className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    title="Alt Adımı Sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {subStep.imageUrl && (
                        <div className="mt-2 relative inline-block group/img">
                            <img src={subStep.imageUrl} alt="" className="h-24 w-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => onUpdate({ ...subStep, imageUrl: null })}
                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const DraggableStepItem = ({ step, index, solutionSteps, setSolutionSteps }) => {
    const controls = useDragControls();
    const editorRef = React.useRef(null);

    const handleFormat = (type, value) => {
        if (editorRef.current) {
            editorRef.current.format(type, value);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file);
            const newSteps = [...solutionSteps];
            newSteps[index] = { ...newSteps[index], imageUrl: compressed };
            setSolutionSteps(newSteps);
        }
    };

    return (
        <Reorder.Item
            value={step}
            className="group flex flex-col gap-2 relative pl-8"
            dragListener={false}
            dragControls={controls}
            key={step.id}
        >
            {/* Drag Handle - Positioning absolute to the left */}
            <div
                className="absolute left-0 top-3 p-1.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-100 rounded-md transition-colors touch-none"
                onPointerDown={(e) => controls.start(e)}
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">

                {/* Step Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        {index + 1}
                    </span>
                    <input
                        type="text"
                        className="flex-grow bg-transparent border-none outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        placeholder="Adım Başlığı (İsteğe bağlı)"
                        value={step.title || ''}
                        onChange={(e) => {
                            const newSteps = [...solutionSteps];
                            newSteps[index] = { ...newSteps[index], title: e.target.value };
                            setSolutionSteps(newSteps);
                        }}
                    />

                    {/* Step Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                const newSteps = [...solutionSteps];
                                if (!newSteps[index].subSteps) newSteps[index].subSteps = [];
                                newSteps[index].subSteps.push({ text: '', imageUrl: null });
                                setSolutionSteps(newSteps);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Alt Adım Ekle"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Alt Adım</span>
                        </button>

                        {solutionSteps.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newSteps = solutionSteps.filter((_, i) => i !== index);
                                    setSolutionSteps(newSteps);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Adımı Sil"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="relative">
                    <TextEditorToolbar onFormat={handleFormat} />
                    <div className="relative p-1">
                        <RichTextEditor
                            ref={editorRef}
                            className="w-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 min-h-[5rem]"
                            placeholder="Adım açıklamasını buraya girin..."
                            value={step.text}
                            onChange={(val) => {
                                const newSteps = [...solutionSteps];
                                newSteps[index] = { ...newSteps[index], text: val };
                                setSolutionSteps(newSteps);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    setSolutionSteps([...solutionSteps, { id: Math.random().toString(36).substr(2, 9), text: '', imageUrl: null, subSteps: [] }]);
                                }
                            }}
                        />

                        {/* Image Upload Overlay */}
                        <div className="absolute top-2 right-2">
                            <label className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md cursor-pointer transition-colors block" title="Görsel Ekle">
                                <ImageIcon className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Step Image Preview */}
                {step.imageUrl && (
                    <div className="px-4 pb-4">
                        <div className="relative inline-block group/img">
                            <img src={step.imageUrl} alt="" className="h-32 w-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newSteps = [...solutionSteps];
                                        newSteps[index] = { ...newSteps[index], imageUrl: null };
                                        setSolutionSteps(newSteps);
                                    }}
                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sub Steps Container */}
            {step.subSteps && step.subSteps.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 pt-1">
                    {step.subSteps.map((subStep, subIndex) => (
                        <SubStepItem
                            key={subIndex}
                            index={index}
                            subIndex={subIndex}
                            subStep={subStep}
                            onUpdate={(updated) => {
                                const newSteps = [...solutionSteps];
                                newSteps[index].subSteps[subIndex] = updated;
                                setSolutionSteps(newSteps);
                            }}
                            onDelete={() => {
                                const newSteps = [...solutionSteps];
                                newSteps[index].subSteps = newSteps[index].subSteps.filter((_, i) => i !== subIndex);
                                setSolutionSteps(newSteps);
                            }}
                        />
                    ))}
                </div>
            )}
        </Reorder.Item>
    );
};
