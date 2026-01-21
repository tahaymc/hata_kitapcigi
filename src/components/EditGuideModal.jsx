import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Plus, Save, Trash2, Video, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { compressImage } from '../utils/helpers';
import { updateGuide, uploadVideo } from '../services/api';
import PersonSelect from './PersonSelect';
import CategorySelect from './CategorySelect';
import TextEditorToolbar from './TextEditorToolbar';
import RichTextEditor from './RichTextEditor';

import { DraggableStepItem } from './StepBuilder';

const EditGuideModal = ({ isOpen, onClose, onSuccess, guideToEdit, categories, onAddCategory, onUpdateCategory, onDeleteCategory, showToast }) => {
    const summaryEditorRef = React.useRef(null);

    const handleSummaryFormat = (type, value) => {
        if (summaryEditorRef.current) {
            summaryEditorRef.current.format(type, value);
        }
    };

    const [editingGuide, setEditingGuide] = useState(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);

    useEffect(() => {
        if (guideToEdit) {
            console.log("EditGuideModal received guide:", guideToEdit);
            setEditingGuide({
                ...guideToEdit,
                code: guideToEdit.code || '',
                // Map snake_case from DB to camelCase for component state if needed, or stick to one.
                // The component uses camelCase like `newGuideData`.
                assignee_ids: guideToEdit.assignees ? guideToEdit.assignees.map(a => a.id) : (guideToEdit.assignee_ids || []),
                steps: guideToEdit.steps || [{ id: 'init-1', text: '', imageUrl: null, subSteps: [] }],
                videoUrl: guideToEdit.video_url || guideToEdit.videoUrl || null,
                imageUrls: guideToEdit.image_urls || guideToEdit.imageUrls || (guideToEdit.imageUrl ? [guideToEdit.imageUrl] : []) || [],
                title: guideToEdit.title || '',
                summary: guideToEdit.summary || '',
                category: guideToEdit.category || 'genel'
            });
        }
    }, [guideToEdit]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen || !editingGuide) return null;

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const compressedImages = await Promise.all(files.map(file => compressImage(file)));

        setEditingGuide(prev => ({
            ...prev,
            imageUrls: [...(prev.imageUrls || []), ...compressedImages]
        }));
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            showToast('Video boyutu 50MB\'dan küçük olmalıdır.', 'error');
            return;
        }

        try {
            setIsUploadingVideo(true);
            const url = await uploadVideo(file);
            setEditingGuide(prev => ({ ...prev, videoUrl: url }));
            showToast('Video başarıyla yüklendi.', 'success');
        } catch (error) {
            console.error('Video upload error:', error);
            showToast('Video yüklenirken hata oluştu.', 'error');
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingGuide.title.trim()) {
            showToast("Kılavuz başlığı zorunludur!", 'error');
            return;
        }

        try {
            const updated = await updateGuide(editingGuide.id, {
                ...editingGuide,
                imageUrl: editingGuide.imageUrls?.[0] || editingGuide.imageUrl,
                steps: editingGuide.steps
            });

            if (updated) {
                onSuccess(updated);
                onClose();
                showToast('Kılavuz başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Error updating guide:', error);
            showToast(`Kılavuz güncellenirken hata: ${error.message}`, 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kılavuzu Düzenle</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kılavuz Kodu</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 uppercase font-mono"
                                placeholder="Otomatik"
                                value={editingGuide.code || ''}
                                onChange={e => setEditingGuide({ ...editingGuide, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="md:col-span-5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kılavuz Başlığı</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                value={editingGuide.title}
                                onChange={e => setEditingGuide({ ...editingGuide, title: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                            <CategorySelect
                                value={editingGuide.category}
                                onChange={(val) => setEditingGuide({ ...editingGuide, category: val })}
                                categories={categories}
                                onAddCategory={onAddCategory}
                                onUpdateCategory={onUpdateCategory}
                                onDeleteCategory={onDeleteCategory}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Atanan Personel / Hazırlayan</label>
                            <PersonSelect
                                value={editingGuide.assignee_ids}
                                onChange={(val) => setEditingGuide({ ...editingGuide, assignee_ids: val })}
                                multiple={true}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kılavuz Görselleri</label>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Maks. 5MB</span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-emerald-600 dark:text-emerald-400">Görsel yükle</span></p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                </label>

                                {(editingGuide.imageUrls && editingGuide.imageUrls.length > 0) && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {editingGuide.imageUrls.map((url, index) => (
                                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = editingGuide.imageUrls.filter((_, i) => i !== index);
                                                        setEditingGuide({ ...editingGuide, imageUrls: newImages, imageUrl: newImages[0] || null });
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özet (Giriş Metni)</label>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all overflow-hidden h-full flex flex-col">
                                <TextEditorToolbar onFormat={handleSummaryFormat} />
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <RichTextEditor
                                        ref={summaryEditorRef}
                                        className="w-full h-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 min-h-[120px]"
                                        value={editingGuide.summary}
                                        onChange={val => setEditingGuide({ ...editingGuide, summary: val })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Video Upload Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kılavuz Videosu</label>
                            <span className="text-xs text-slate-400 dark:text-slate-500">Maks. 50MB</span>
                        </div>

                        {!editingGuide.videoUrl ? (
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group ${isUploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <Video className="w-6 h-6 text-red-500 dark:text-red-400" />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {isUploadingVideo ? 'Video Yükleniyor...' : <><span className="font-semibold text-red-600 dark:text-red-400">Video yüklemek için tıklayın</span></>}
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                            </label>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                                <video src={editingGuide.videoUrl} controls className="w-full h-48 object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setEditingGuide({ ...editingGuide, videoUrl: null })}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                                    title="Videoyu Kaldır"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Anlatım Adımları</label>
                        <div className="space-y-4">
                            <Reorder.Group axis="y" values={editingGuide.steps} onReorder={(newOrder) => setEditingGuide({ ...editingGuide, steps: newOrder })} className="space-y-4">
                                {editingGuide.steps.map((step, index) => (
                                    <DraggableStepItem
                                        key={step.id}
                                        step={step}
                                        index={index}
                                        solutionSteps={editingGuide.steps}
                                        setSolutionSteps={(newSteps) => setEditingGuide({ ...editingGuide, steps: newSteps })}
                                    />
                                ))}
                            </Reorder.Group>
                            <button
                                type="button"
                                onClick={() => setEditingGuide({ ...editingGuide, steps: [...editingGuide.steps, { id: Math.random().toString(36).substr(2, 9), text: '', imageUrl: null, subSteps: [] }] })}
                                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
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
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Kaydet
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default EditGuideModal;
