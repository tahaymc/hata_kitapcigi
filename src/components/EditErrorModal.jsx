import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Plus, Save, Trash2, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { compressImage } from '../utils/helpers';
import { updateError } from '../data/mockData';
import PersonSelect from './PersonSelect';
import CategorySelect from './CategorySelect';
import TextEditorToolbar from './TextEditorToolbar';
import RichTextEditor from './RichTextEditor';


const SubStepItem = ({ subStep, subIndex, index, onUpdate, onDelete }) => {
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

const DraggableStepItem = ({ step, index, editingError, setEditingError }) => {
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
            const newSteps = [...editingError.solutionSteps];
            newSteps[index] = { ...newSteps[index], imageUrl: compressed };
            setEditingError({ ...editingError, solutionSteps: newSteps });
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
                            const newSteps = [...editingError.solutionSteps];
                            newSteps[index] = { ...newSteps[index], title: e.target.value };
                            setEditingError({ ...editingError, solutionSteps: newSteps });
                        }}
                    />

                    {/* Step Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                const newSteps = [...editingError.solutionSteps];
                                if (!newSteps[index].subSteps) newSteps[index].subSteps = [];
                                newSteps[index].subSteps.push({ text: '', imageUrl: null });
                                setEditingError({ ...editingError, solutionSteps: newSteps });
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Alt Adım Ekle"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Alt Adım</span>
                        </button>

                        {editingError.solutionSteps.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newSteps = editingError.solutionSteps.filter((_, i) => i !== index);
                                    setEditingError({ ...editingError, solutionSteps: newSteps });
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
                                const newSteps = [...editingError.solutionSteps];
                                newSteps[index] = { ...newSteps[index], text: val };
                                setEditingError({ ...editingError, solutionSteps: newSteps });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { id: Math.random().toString(36).substr(2, 9), text: '', imageUrl: null, subSteps: [] }] });
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
                                        const newSteps = [...editingError.solutionSteps];
                                        newSteps[index] = { ...newSteps[index], imageUrl: null };
                                        setEditingError({ ...editingError, solutionSteps: newSteps });
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
                                const newSteps = [...editingError.solutionSteps];
                                newSteps[index].subSteps[subIndex] = updated;
                                setEditingError({ ...editingError, solutionSteps: newSteps });
                            }}
                            onDelete={() => {
                                const newSteps = [...editingError.solutionSteps];
                                newSteps[index].subSteps = newSteps[index].subSteps.filter((_, i) => i !== subIndex);
                                setEditingError({ ...editingError, solutionSteps: newSteps });
                            }}
                        />
                    ))}
                </div>
            )}
        </Reorder.Item>
    );
};

const EditErrorModal = ({ isOpen, onClose, onSuccess, errorToEdit, categories, onAddCategory, onUpdateCategory, onDeleteCategory, showToast }) => {
    const summaryEditorRef = React.useRef(null);

    const handleSummaryFormat = (type, value) => {
        if (summaryEditorRef.current) {
            summaryEditorRef.current.format(type, value);
        }
    };

    const [editingError, setEditingError] = useState(null);

    useEffect(() => {
        if (errorToEdit) {
            let steps = [{ text: '', imageUrl: null, subSteps: [] }];

            if (errorToEdit.solutionType === 'steps' && errorToEdit.solutionSteps && errorToEdit.solutionSteps.length > 0) {
                // Ensure subSteps property exists
                steps = errorToEdit.solutionSteps.map(step => ({ ...step, subSteps: step.subSteps || [] }));
            } else {
                // Fallback parsing for legacy data
                const isSteps = /^\s*\d+\./.test(errorToEdit.solution);
                if (isSteps) {
                    const parsedSteps = errorToEdit.solution.split('\n')
                        .map(line => {
                            const content = line.replace(/^\d+\.\s*/, '');
                            // Attempt to extract title if format is "**Title:** Description"
                            const titleMatch = content.match(/^\*\*(.*?):\*\*\s*(.*)/);
                            if (titleMatch) {
                                return { title: titleMatch[1], text: titleMatch[2], imageUrl: null, subSteps: [] };
                            }
                            return { title: '', text: content, imageUrl: null, subSteps: [] };
                        })
                        .filter(s => s.text.trim() !== '');

                    if (parsedSteps.length > 0) steps = parsedSteps;
                } else if (errorToEdit.solution) {
                    steps = [{ title: '', text: errorToEdit.solution, imageUrl: null, subSteps: [] }];
                }
            }

            setEditingError({
                ...errorToEdit,
                assignee_ids: errorToEdit.assignees ? errorToEdit.assignees.map(a => a.id) : (errorToEdit.assignee_ids || []),
                solutionSteps: steps
            });
        }
    }, [errorToEdit]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen || !editingError) return null;

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const compressedImages = await Promise.all(files.map(file => compressImage(file)));

        setEditingError(prev => ({
            ...prev,
            imageUrls: [...(prev.imageUrls || []), ...compressedImages]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalSolution = editingError.solutionSteps
            .filter(step => step.text.trim() !== '')
            .map((step, index) => {
                let stepText = step.title
                    ? `${index + 1}. **${step.title}:** ${step.text}`
                    : `${index + 1}. ${step.text}`;

                if (step.subSteps && step.subSteps.length > 0) {
                    stepText += '\n' + step.subSteps.map((sub, sIdx) => `  ${index + 1}.${sIdx + 1}. ${sub.text}`).join('\n');
                }
                return stepText;
            })
            .join('\n');

        try {
            const updated = await updateError(editingError.id, {
                ...editingError,
                solution: finalSolution,
                solutionType: 'steps',
                solutionSteps: editingError.solutionSteps,
                imageUrl: editingError.imageUrls?.[0] || editingError.imageUrl,
                assignee_ids: editingError.assignee_ids,
            });

            if (updated) {
                onSuccess(updated);
                onClose();
                showToast('Hata başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Error updating record:', error);
            showToast(`Güncelleme hatası: ${error.message}`, 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kaydı Düzenle</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hata Kodu</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono"
                                value={editingError.code}
                                onChange={(e) => setEditingError({ ...editingError, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                            <CategorySelect
                                value={editingError.category}
                                onChange={(val) => setEditingError({ ...editingError, category: val })}
                                categories={categories}
                                onAddCategory={onAddCategory}
                                onUpdateCategory={onUpdateCategory}
                                onDeleteCategory={onDeleteCategory}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Atanan Personel</label>
                            <PersonSelect
                                value={editingError.assignee_ids}
                                onChange={(val) => setEditingError({ ...editingError, assignee_ids: val })}
                                multiple={true}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hata Görselleri</label>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Maks. 5MB (Çoklu Seçim)</span>
                            </div>

                            <div className="flex flex-col gap-4">
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
                                        onChange={handleImageUpload}
                                    />
                                </label>

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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özet</label>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden h-full flex flex-col">
                                <TextEditorToolbar onFormat={handleSummaryFormat} />
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <RichTextEditor
                                        ref={summaryEditorRef}
                                        className="w-full h-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 min-h-[120px]"
                                        value={editingError.summary}
                                        onChange={val => setEditingError({ ...editingError, summary: val })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
                        <div className="space-y-4">
                            <Reorder.Group axis="y" values={editingError.solutionSteps} onReorder={(newOrder) => setEditingError({ ...editingError, solutionSteps: newOrder })} className="space-y-4">
                                {editingError.solutionSteps.map((step, index) => (
                                    <DraggableStepItem
                                        key={step.id}
                                        step={step}
                                        index={index}
                                        editingError={editingError}
                                        setEditingError={setEditingError}
                                    />
                                ))}
                            </Reorder.Group>
                            <button
                                type="button"
                                onClick={() => setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { id: Math.random().toString(36).substr(2, 9), text: '', imageUrl: null, subSteps: [] }] })}
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
                            onClick={onClose}
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
    );
};

export default EditErrorModal;
