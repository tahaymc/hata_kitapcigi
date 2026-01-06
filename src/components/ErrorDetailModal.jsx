import React from 'react';
import { X, Calendar, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Edit2, Trash2, Info, Users } from 'lucide-react';
import { getCategoryIcon, formatDisplayDate } from '../utils/helpers';
import { COLOR_STYLES } from '../utils/constants';



const ErrorDetailModal = ({ error, onClose, onCategoryClick, onDateClick, onCodeClick, categories = [], isAdmin, onEdit, onDelete }) => {
    console.log('ErrorDetailModal Debug:', {
        errorCategory: error?.category,
        foundCategory: categories.find(c => c.id === error?.category),
        allCategories: categories
    });
    const [isImageEnlarged, setIsImageEnlarged] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [zoomedStepImage, setZoomedStepImage] = React.useState(null);

    // Prevent body scroll when modal is open
    // Handle Escape key to close modal or zoomed images
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (zoomedStepImage) {
                    setZoomedStepImage(null);
                } else if (isImageEnlarged) {
                    setIsImageEnlarged(false);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose, isImageEnlarged, zoomedStepImage]);

    if (!error) return null;

    const category = categories.find(c => c.id === error.category);
    const colorStyle = COLOR_STYLES[category?.color || 'slate'] || COLOR_STYLES.slate;

    const displayImages = error.imageUrls && error.imageUrls.length > 0
        ? error.imageUrls
        : (error.imageUrl ? [error.imageUrl] : []);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-7xl max-h-[95vh] bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Top Accent Pill - Modal Main */}
                <div className={`absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-2 ${colorStyle.border.replace('border-', 'bg-')} rounded-b-full shadow-lg z-20`}></div>

                {/* Header - Left Icon, Center Title, Right Code & Close */}
                <div className="relative flex items-center justify-between px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-md">
                    {/* Gradient Shine */}
                    <div className={`absolute inset-0 opacity-[0.03] ${colorStyle.border.replace('border-', 'bg-')} pointer-events-none`}></div>

                    {/* Left: Icon */}
                    <div className="flex-shrink-0 z-10">
                        <div
                            onClick={() => onCategoryClick && onCategoryClick(error.category)}
                            className={`flex items-center justify-center w-12 h-12 rounded-2xl ${colorStyle.bgLight} border ${colorStyle.borderLight} ${colorStyle.text} shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 group`}
                        >
                            {getCategoryIcon(error.category, "w-6 h-6 transition-transform group-hover:rotate-12", category?.icon)}
                        </div>
                    </div>

                    {/* Center: Title */}
                    <div className="flex-1 px-4 text-center z-10">
                        <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">
                            {error.title}
                        </h2>
                    </div>

                    {/* Right: Code & Close */}
                    <div className="flex-shrink-0 z-10 flex items-center gap-3">
                        <div
                            onClick={() => onCodeClick && onCodeClick(error.code)}
                            className={`hidden sm:inline-flex items-center justify-center px-3 py-1 rounded-lg border font-mono font-bold text-[10px] sm:text-xs tracking-tight whitespace-nowrap shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${colorStyle.bgLight} ${colorStyle.borderLight} ${colorStyle.text}`}
                        >
                            {error.code || 'SYS-000'}
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700/50">
                                <button
                                    onClick={onEdit}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Düzenle"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 hover:rotate-90 transition-all duration-300 shadow-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-10 custom-scrollbar">


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary Card - Redesigned */}
                            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>

                                {/* Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Info className={`w-5 h-5 ${colorStyle.text}`} />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hata Özeti</h3>
                                </div>

                                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line font-medium">
                                    {error.summary}
                                </p>
                            </div>

                            {/* Solution Steps - Redesigned to Neutral Card Theme */}
                            <div className="bg-slate-100/80 dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>

                                {/* Header */}
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`w-4 h-4 ${colorStyle.text}`} />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-1">Çözüm Adımları</span>
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700/50 ml-2"></div>
                                    </div>
                                </div>

                                {/* Redesigned Solution Timeline */}
                                <div className="pl-2 relative">
                                    {/* Vertical Connecting Line */}
                                    <div className={`absolute top-4 left-[19px] bottom-10 w-0.5 ${colorStyle.bg} opacity-20 rounded-full`}></div>

                                    <ul className="space-y-8 relative z-10">
                                        {(error.solutionType === 'steps' && error.solutionSteps && error.solutionSteps.length > 0
                                            ? error.solutionSteps
                                            : (error.solution ? error.solution.split('\n').filter(s => s.trim() !== '').map(s => ({ text: s.replace(/^\d+\.\s*/, ''), imageUrl: null })) : [])
                                        ).map((step, index) => (
                                            <li key={index} className="flex gap-6 items-start group/step">
                                                {/* Step Number Badge */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorStyle.bgLight} border-2 ${colorStyle.border} flex items-center justify-center shadow-lg shadow-${colorStyle.text.split('-')[1]}-500/20 z-10 group-hover/step:scale-110 transition-transform duration-300 bg-white dark:bg-slate-800`}>
                                                    <span className={`font-black text-sm ${colorStyle.text}`}>{index + 1}</span>
                                                </div>

                                                {/* Content Card */}
                                                <div className="flex-1 bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group-hover/step:translate-x-1 relative">
                                                    {/* Little stylized arrow pointing to badge */}
                                                    <div className="absolute top-5 -left-1.5 w-3 h-3 bg-white dark:bg-[#0f172a] border-l border-b border-slate-200 dark:border-slate-700 transform rotate-45"></div>

                                                    <div className="relative z-10">
                                                        <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium">
                                                            {step.text}
                                                        </div>
                                                        {step.imageUrl && (
                                                            <div className="mt-4 relative group/step-img w-full max-w-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900">
                                                                <img
                                                                    src={step.imageUrl}
                                                                    alt={`Adım ${index + 1}`}
                                                                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                                    onClick={() => setZoomedStepImage(step.imageUrl)}
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/step-img:bg-black/10 transition-colors pointer-events-none"></div>
                                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover/step-img:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                                                                    Büyütmek için tıkla
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Sub Steps Display */}
                                                        {step.subSteps && step.subSteps.length > 0 && (
                                                            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                                                                {step.subSteps.map((subStep, subIndex) => (
                                                                    <div key={subIndex} className="flex gap-4 items-start pl-2">
                                                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 text-slate-400 font-mono text-[10px]">
                                                                            {index + 1}.{subIndex + 1}
                                                                        </div>
                                                                        <div className="flex-1 space-y-3">
                                                                            <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                                                {subStep.text}
                                                                            </div>
                                                                            {subStep.imageUrl && (
                                                                                <div className="relative group/sub-img w-full max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900">
                                                                                    <img
                                                                                        src={subStep.imageUrl}
                                                                                        alt={`Alt Adım ${index + 1}.${subIndex + 1}`}
                                                                                        className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                                                        onClick={() => setZoomedStepImage(subStep.imageUrl)}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Footer Info: Date, Category, Related People */}
                            <div className="space-y-3">
                                {/* Compact Info Row - Redesigned to match Related People */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Date Card */}
                                    <div
                                        onClick={() => onDateClick && onDateClick(error.date)}
                                        className="bg-slate-100/80 dark:bg-[#1e293b] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group flex items-center gap-3 cursor-pointer hover:shadow-md transition-all sm:hover:scale-105"
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                        <div className={`p-2 rounded-lg bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400`}>
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="pl-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">Tarih</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{formatDisplayDate(error.date)}</p>
                                        </div>
                                    </div>

                                    {/* Category Card */}
                                    <div
                                        onClick={() => onCategoryClick && onCategoryClick(error.category)}
                                        className="bg-slate-100/80 dark:bg-[#1e293b] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group flex items-center gap-3 cursor-pointer hover:shadow-md transition-all sm:hover:scale-105"
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                        <div className={`p-2 rounded-lg ${colorStyle.bgLight} border ${colorStyle.borderLight} ${colorStyle.text} shadow-sm`}>
                                            {getCategoryIcon(error.category, "w-4 h-4", category?.icon)}
                                        </div>
                                        <div className="pl-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">Kategori</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{category?.name || 'Bilinmeyen'}</p>
                                        </div>
                                    </div>
                                </div>


                                {/* Assigned Person / Related People / Multiple Assignees - Redesigned */}
                                {(error.assignees && error.assignees.length > 0) || error.assignee || (error.relatedPeople && error.relatedPeople.length > 0) ? (
                                    <div className="mt-2">
                                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                            {/* Category Colored Accent Bar */}
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>

                                            {/* Header */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <Users className={`w-5 h-5 ${colorStyle.text}`} />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                    {(error.assignees && error.assignees.length > 0) ? 'İlgili Personeller' : (error.assignee ? 'İlgili Personel' : 'İlgili Kişiler')}
                                                </h3>
                                            </div>

                                            <div className="">
                                                {error.assignees && error.assignees.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {error.assignees.map(person => (
                                                            <div key={person.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-${person.color || 'slate'}-100 text-${person.color || 'slate'}-700 border border-${person.color || 'slate'}-200`}>
                                                                    {person.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{person.name}</h4>
                                                                    {person.role && <p className="text-xs text-slate-500 font-medium">{person.role}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : error.assignee ? (
                                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-${error.assignee.color || 'slate'}-100 text-${error.assignee.color || 'slate'}-700 border border-${error.assignee.color || 'slate'}-200`}>
                                                            {error.assignee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{error.assignee.name}</h4>
                                                            {error.assignee.role && <p className="text-xs text-slate-500 font-medium">{error.assignee.role}</p>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {error.relatedPeople.map((person, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105">
                                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm bg-gradient-to-br ${Object.values(COLOR_STYLES)[idx % 5].text.replace('text-', 'from-').split(' ')[0]} ${Object.values(COLOR_STYLES)[(idx + 1) % 5].text.replace('text-', 'to-').split(' ')[0].replace('400', '500')}`}>
                                                                    {person.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{person}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>



                        {/* Right Content: Image */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-0 space-y-4">
                                <div
                                    className="bg-slate-50 dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-xl group cursor-pointer"
                                    onClick={() => displayImages.length > 0 && setIsImageEnlarged(true)}
                                >
                                    <div className="aspect-[3/4] w-full bg-slate-200 dark:bg-[#0f172a] relative overflow-hidden">
                                        {displayImages.length > 0 ? (
                                            <>
                                                <img
                                                    src={displayImages[selectedImageIndex]}
                                                    alt={error.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {/* Hover Overlay with Magnifying Glass */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 group-hover:bg-black/40 backdrop-blur-[0px] group-hover:backdrop-blur-[2px]">
                                                    <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 text-white shadow-xl transform scale-50 opacity-0 translate-y-4 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                                                        <ZoomIn className="w-8 h-8" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                                                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <span className="text-xs font-medium">Görsel Yok</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-60 pointer-events-none"></div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-[#1e293b]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="font-bold text-xs uppercase tracking-wide">Hata Görseli</span>
                                            </div>
                                            {displayImages.length > 1 && (
                                                <span className="text-xs text-slate-400">
                                                    {selectedImageIndex + 1} / {displayImages.length}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                                            Hatanın sistemdeki veya ekrandaki temsili görüntüsüdür.
                                        </p>
                                    </div>
                                </div>

                                {/* Thumbnails */}
                                {displayImages.length > 1 && (
                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/50">
                                            <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Hata Görselleri</h4>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2 fade-in">
                                            {displayImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImageIndex(idx)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur-[2px] rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                                                        {idx + 1}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Full Screen Image Overlay */}
            {
                isImageEnlarged && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setIsImageEnlarged(false)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                            onClick={() => setIsImageEnlarged(false)}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Navigation Arrows */}
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 hover:scale-110 active:scale-95"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : displayImages.length - 1));
                                    }}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 hover:scale-110 active:scale-95"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => (prev < displayImages.length - 1 ? prev + 1 : 0));
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <img
                            src={displayImages[selectedImageIndex]}
                            alt={error.title}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Counter Bubble */}
                        {displayImages.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm border border-white/10">
                                {selectedImageIndex + 1} / {displayImages.length}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Step Image Full Screen Overlay */}
            {
                zoomedStepImage && (
                    <div
                        className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setZoomedStepImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                            onClick={() => setZoomedStepImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={zoomedStepImage}
                            alt="Adım Görseli"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }

        </div >
    );
};

export default ErrorDetailModal;
