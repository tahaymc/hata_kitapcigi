import React from 'react';
import { X, Calendar, Monitor, ShoppingCart, Archive, Settings, CheckCircle, AlertTriangle, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 'kasa': return <ShoppingCart className="w-6 h-6" />;
        case 'reyon': return <Archive className="w-6 h-6" />;
        case 'depo': return <Archive className="w-6 h-6" />;
        case 'sistem': return <Monitor className="w-6 h-6" />;
        default: return <Settings className="w-6 h-6" />;
    }
};

const COLOR_STYLES = {
    blue: { text: 'text-blue-600 dark:text-blue-400', bgLight: 'bg-blue-500/10', border: 'border-blue-500', ring: 'ring-blue-500' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500', ring: 'ring-emerald-500' },
    orange: { text: 'text-orange-600 dark:text-orange-400', bgLight: 'bg-orange-500/10', border: 'border-orange-500', ring: 'ring-orange-500' },
    purple: { text: 'text-purple-600 dark:text-purple-400', bgLight: 'bg-purple-500/10', border: 'border-purple-500', ring: 'ring-purple-500' },
    slate: { text: 'text-slate-600 dark:text-slate-400', bgLight: 'bg-slate-500/10', border: 'border-slate-500', ring: 'ring-slate-500' }
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('.') && dateStr.split('.').length === 3) return dateStr;
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    }
    return dateStr;
};

const ErrorDetailModal = ({ error, onClose, onCategoryClick, onDateClick }) => {

    const [isImageEnlarged, setIsImageEnlarged] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [zoomedStepImage, setZoomedStepImage] = React.useState(null);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!error) return null;

    const category = CATEGORIES.find(c => c.id === error.category);
    const colorStyle = COLOR_STYLES[category?.color || 'slate'];

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

                {/* Header */}
                <div className="relative flex items-center justify-center px-8 py-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e293b]">
                    {/* Left: Icon */}
                    <div className="absolute left-8 top-1/2 -translate-y-1/2">
                        <div
                            onClick={() => onCategoryClick && onCategoryClick(error.category)}
                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform`}
                        >
                            <div className={`${colorStyle.text}`}>
                                {getCategoryIcon(error.category)}
                            </div>
                        </div>
                    </div>

                    {/* Center: Title */}
                    <div className="w-full px-20 text-center">
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            {error.title}
                        </h2>
                    </div>

                    {/* Right: Code & Close */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg ${colorStyle.bgLight} border border-${colorStyle.border}/20 ${colorStyle.text} font-mono font-bold text-sm tracking-wider shadow-sm hidden sm:block`}>
                            {error.code || 'SYS-000'}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-10 custom-scrollbar">


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/30 transition-colors relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-line font-medium pl-2">
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

                                <div className="pl-2">
                                    <ul className="space-y-6">
                                        {error.solutionType === 'steps' && error.solutionSteps && error.solutionSteps.length > 0 ? (
                                            error.solutionSteps.map((step, index) => (
                                                <li key={index} className="flex gap-4 items-start text-slate-600 dark:text-slate-300">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex items-center justify-center group">
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 pl-1">{index + 1}</span>
                                                    </div>
                                                    <div className="flex-grow space-y-3 min-w-0">
                                                        <div className="mt-1 leading-relaxed text-sm md:text-base font-medium break-words whitespace-pre-wrap">
                                                            {step.text}
                                                        </div>
                                                        {step.imageUrl && (
                                                            <div className="relative group/step-img w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                <img
                                                                    src={step.imageUrl}
                                                                    alt={`Adım ${index + 1}`}
                                                                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                                    onClick={() => setZoomedStepImage(step.imageUrl)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            error.solution.split('\n').filter(s => s.trim() !== '').map((step, index) => (
                                                <li key={index} className="flex gap-4 items-start text-slate-600 dark:text-slate-300">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex items-center justify-center group">
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 pl-1">{index + 1}</span>
                                                    </div>
                                                    <div className="mt-1 leading-relaxed text-sm md:text-base break-words whitespace-pre-wrap min-w-0 flex-1">{step.replace(/^\d+\.\s*/, '')}</div>
                                                </li>
                                            ))
                                        )}
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
                                        <div className={`p-2 rounded-lg bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200 dark:border-slate-700 ${colorStyle.text}`}>
                                            {React.cloneElement(getCategoryIcon(error.category), { className: "w-4 h-4" })}
                                        </div>
                                        <div className="pl-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">Kategori</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{category?.name}</p>
                                        </div>
                                    </div>
                                </div>


                                {/* Assigned Person / Related People / Multiple Assignees */}
                                {(error.assignees && error.assignees.length > 0) || error.assignee || (error.relatedPeople && error.relatedPeople.length > 0) ? (
                                    <div className="mt-2">
                                        <div className="bg-slate-100/80 dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                            {/* Category Colored Accent Bar */}
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-2">
                                                        {(error.assignees && error.assignees.length > 0) ? 'İlgili Personeller' : (error.assignee ? 'İlgili Personel' : 'İlgili Kişiler')}
                                                    </span>
                                                    <div className="h-px w-full bg-slate-200 dark:bg-slate-700/50"></div>
                                                </div>

                                                <div className="pl-2">
                                                    {error.assignees && error.assignees.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {error.assignees.map(person => (
                                                                <div key={person.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
                                                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
                                                                <div key={idx} className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105">
                                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm bg-gradient-to-br ${Object.values(COLOR_STYLES)[idx % 5].text.replace('text-', 'from-').split(' ')[0]} ${Object.values(COLOR_STYLES)[(idx + 1) % 5].text.replace('text-', 'to-').split(' ')[0].replace('400', '500')}`}>
                                                                        {person.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{person}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
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
