import React from 'react';
import { X, Calendar, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Edit2, Trash2, Info, Users, Tag, Video } from 'lucide-react';
import { getCategoryIcon, formatDate } from '../utils/helpers';
import { COLOR_STYLES } from '../utils/constants';



const ErrorDetailModal = ({ error, onClose, onCategoryClick, onDateClick, onCodeClick, categories = [], isAdmin, onEdit, onDelete }) => {
    const [isImageEnlarged, setIsImageEnlarged] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [zoomedStepImage, setZoomedStepImage] = React.useState(null);
    const [isLandscape, setIsLandscape] = React.useState(false);

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

    const displayImages = React.useMemo(() => {
        if (Array.isArray(error.imageUrls) && error.imageUrls.length > 0) return error.imageUrls;
        if (typeof error.imageUrl === 'string' && error.imageUrl) return [error.imageUrl];
        return [];
    }, [error]);

    const hasImages = displayImages.length > 0;
    const hasVideo = !!(error.videoUrl || error.video_url);
    const isGuide = error.code === 'KILAVUZ' || error.type === 'guide';

    // Gösterim senaryoları
    const showVideoOnRight = hasVideo && !hasImages; // Resim yoksa video sağa geçer
    const showVideoOnLeft = hasVideo && hasImages;   // Resim varsa video solda kalır

    // Video sağdaysa veya kullanıcı yatay modu seçtiyse geniş çerçeve kullan
    const forceLandscape = isLandscape || showVideoOnRight;

    // Ensure state resets when error changes (new error opened)
    React.useEffect(() => {
        setSelectedImageIndex(0);
        setIsLandscape(false);
    }, [error?.id]);

    // Detect image orientation reliably
    React.useEffect(() => {
        if (displayImages.length > 0 && displayImages[selectedImageIndex]) {
            const img = new Image();
            img.onload = () => {
                const isLands = img.naturalWidth > img.naturalHeight;
                setIsLandscape(isLands);
            };
            img.src = displayImages[selectedImageIndex];
        }
    }, [displayImages, selectedImageIndex]);



    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-[1500px] max-h-[95vh] bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(e);
                                    }}
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

                    <div className={`grid grid-cols-1 ${forceLandscape ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8 items-start`}>
                        {/* Left Content */}
                        <div className={`${forceLandscape ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-8`}>
                            {/* Summary Card - Redesigned */}
                            <div className={`p-6 rounded-2xl border ${colorStyle.bgLight} ${colorStyle.borderLight} relative overflow-hidden`}>
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-full ${colorStyle.border.replace('border-', 'bg-')} flex items-center justify-center text-white shadow-sm`}>
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                        {isGuide ? 'Kılavuz Özeti' : 'Hata Özeti'}
                                    </h3>
                                </div>

                                <div
                                    className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium"
                                    dangerouslySetInnerHTML={{ __html: error.summary }}
                                />
                            </div>

                            {/* Video Section (Only if images exist - keeps it on left) */}
                            {showVideoOnLeft && (
                                <div className={`p-6 rounded-2xl border ${colorStyle.bgLight} ${colorStyle.borderLight} relative overflow-hidden space-y-4`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${colorStyle.border.replace('border-', 'bg-')} flex items-center justify-center text-white shadow-sm`}>
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                            {isGuide ? 'Kılavuz Videosu' : 'Hata Çözüm Videosu'}
                                        </h3>
                                    </div>
                                    <div className="rounded-xl overflow-hidden bg-black shadow-lg">
                                        <video
                                            src={error.videoUrl || error.video_url}
                                            controls
                                            className="w-full h-auto max-h-[400px] object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Solution Steps - Redesigned */}
                            <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                                            {isGuide ? 'Kılavuz Adımları' : 'Çözüm Adımları'}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            {isGuide ? 'Adımları sırasıyla takip edin' : 'Bu adımları sırasıyla uygulayın'}
                                        </p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="relative pl-4">
                                    {/* Vertical Connecting Line REMOVED (Moved to per-item) */}

                                    <ul className="space-y-10 relative z-10">
                                        {(() => {
                                            const steps = (error.solutionType === 'steps' && Array.isArray(error.solutionSteps) && error.solutionSteps.length > 0
                                                ? error.solutionSteps
                                                : (typeof error.solution === 'string' ? error.solution.split('\n').filter(s => s.trim() !== '').map(s => ({ text: s.replace(/^\d+\.\s*/, ''), imageUrl: null })) : [])
                                            );

                                            return steps.map((step, index) => {
                                                const isLastItem = index === steps.length - 1;
                                                let title = null;
                                                let text = step.text;

                                                // Priority 1: Explicit title property
                                                if (step.title) {
                                                    title = step.title;
                                                } else {
                                                    // Priority 2: Markdown parsing
                                                    const titleMatch = step.text.match(/^\*\*(.*?):\*\*\s*(.*)/);
                                                    if (titleMatch) {
                                                        title = titleMatch[1];
                                                        text = titleMatch[2];
                                                    }
                                                }

                                                return (
                                                    <li key={index} className="flex gap-6 relative group">
                                                        {/* Connecting Line (for all except last) */}
                                                        {!isLastItem && (
                                                            <div className={`absolute left-[27px] top-14 w-[3px] -bottom-10 opacity-20 ${colorStyle.border.replace('border-', 'bg-')}`}></div>
                                                        )}

                                                        {/* Step Number Bubble */}
                                                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${colorStyle.border.replace('border-', 'bg-')} text-white flex items-center justify-center shadow-lg shadow-${colorStyle.text.split('-')[1]}-500/30 z-10 text-xl font-bold border-[4px] border-white dark:border-[#1e293b]`}>
                                                            {index + 1}
                                                        </div>

                                                        {/* Content Card containing Title + Text + Substeps */}
                                                        <div className="flex-1 min-w-0 pt-2">
                                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">

                                                                {/* Title inside card */}
                                                                {title && (
                                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                                                                        {title}
                                                                    </h4>
                                                                )}

                                                                <div
                                                                    className={`text-slate-700 dark:text-slate-300 leading-relaxed text-base ${title ? 'font-medium' : 'font-semibold'}`}
                                                                    dangerouslySetInnerHTML={{ __html: text }}
                                                                />

                                                                {step.imageUrl && (
                                                                    <div className="mt-4 relative group/img rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-w-md">
                                                                        <img
                                                                            src={step.imageUrl}
                                                                            alt={`Adım ${index + 1}`}
                                                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                                            onClick={() => setZoomedStepImage(step.imageUrl)}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Sub-steps displayed as a clean list */}
                                                                {step.subSteps && step.subSteps.length > 0 && (
                                                                    <div className="mt-6 flex flex-col gap-3">
                                                                        {step.subSteps.map((subStep, subIndex) => (
                                                                            <div key={subIndex} className="flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50">
                                                                                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${colorStyle.bgLight} ${colorStyle.text} text-xs font-bold mt-0.5`}>
                                                                                    {subIndex + 1}
                                                                                </span>
                                                                                <div className="flex-1 space-y-2">
                                                                                    <div
                                                                                        className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed"
                                                                                        dangerouslySetInnerHTML={{ __html: subStep.text }}
                                                                                    />
                                                                                    {subStep.imageUrl && (
                                                                                        <div className="relative w-full max-w-[200px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                                                            <img
                                                                                                src={subStep.imageUrl}
                                                                                                alt=""
                                                                                                className="w-full h-auto object-cover cursor-zoom-in"
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
                                                );
                                            });
                                        })()}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Right Content: Image - Dynamic Frame Support */}
                        <div className="lg:col-span-1 sticky top-6">
                            {forceLandscape ? (
                                // MONITOR/TABLET FRAME (Wider, Landscape)
                                <div className="bg-white dark:bg-[#1e293b] p-3 rounded-[1.5rem] border-[8px] border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full z-10"></div>
                                    <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] relative aspect-video w-full border border-slate-200 dark:border-slate-700/50">

                                        {showVideoOnRight ? (
                                            // VIDEO PLAYER (When on right)
                                            <div className="w-full h-full flex items-center justify-center bg-black">
                                                <video
                                                    src={error.videoUrl || error.video_url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : displayImages.length > 0 ? (
                                            // IMAGES SLIDER
                                            <>
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl scale-110"
                                                    style={{ backgroundImage: `url(${displayImages[selectedImageIndex]})` }}
                                                ></div>
                                                <img
                                                    src={displayImages[selectedImageIndex]}
                                                    alt={error.title}
                                                    className="w-full h-full object-contain relative z-10 cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                                    onClick={() => setIsImageEnlarged(true)}
                                                />

                                                {displayImages.length > 1 && (
                                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-white text-[10px] font-bold border border-white/10 z-20">
                                                        {selectedImageIndex + 1} / {displayImages.length}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            // EMPTY STATE
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 dark:bg-slate-900">
                                                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="text-xs font-medium opacity-60">Görsel Yok</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // PHONE FRAME (Vertical, Portrait) - Only for Images
                                <div className="bg-white dark:bg-[#1e293b] p-2 rounded-[2.5rem] border-[8px] border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-100 dark:bg-slate-800 rounded-b-xl z-10 flex items-center justify-center gap-2">
                                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                    </div>

                                    <div className="rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-[#0f172a] relative aspect-[9/19] w-full">
                                        {displayImages.length > 0 ? (
                                            <>
                                                <img
                                                    src={displayImages[selectedImageIndex]}
                                                    alt={error.title}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                                    onClick={() => setIsImageEnlarged(true)}
                                                />

                                                {displayImages.length > 1 && (
                                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/10">
                                                        {selectedImageIndex + 1} / {displayImages.length}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                                <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                                                <p className="text-sm font-medium">Bu hata için görsel yüklenmemiş.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Caption Below Picture/Video */}
                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    {showVideoOnRight ? (
                                        <>
                                            <Video className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {isGuide ? 'Kılavuz Videosu' : 'Hata Çözüm Videosu'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {isGuide ? 'Kılavuz Videosu' : 'Hata Görseli'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnails if multiple */}
                            {displayImages.length > 1 && (
                                <div className="mt-6 flex justify-center gap-2">
                                    {displayImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${selectedImageIndex === idx ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Metadata Card */}
                            <div className="mt-6 bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg text-left">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Detaylar
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Category */}
                                        <button
                                            onClick={() => onCategoryClick && onCategoryClick(error.category)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 bg-white dark:bg-slate-900 ${colorStyle.text} ${colorStyle.borderLight} hover:${colorStyle.bgLight}`}
                                            title="Bu kategoriye ait hataları gör"
                                        >
                                            {getCategoryIcon(error.category, "w-4 h-4", category?.icon)}
                                            <span>{category?.name || error.category}</span>
                                        </button>

                                        {/* Date */}
                                        <button
                                            onClick={() => onDateClick && onDateClick(error.date)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 bg-white dark:bg-slate-900 ${colorStyle.text} ${colorStyle.borderLight} hover:${colorStyle.bgLight}`}
                                            title="Bu tarihe ait hataları gör"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(error.date)}</span>
                                        </button>
                                    </div>

                                    {/* Assignees */}
                                    {error.assignees && error.assignees.length > 0 && (
                                        <div className="pt-2 mt-2">
                                            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">İlgili Personel</div>
                                            <div className="flex flex-wrap gap-2">
                                                {error.assignees.map((person, idx) => {
                                                    const name = typeof person === 'string' ? person : (person.name || 'Unknown');
                                                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                                    const getColorClasses = (c) => {
                                                        const colors = {
                                                            blue: 'bg-blue-100 text-blue-600',
                                                            green: 'bg-green-100 text-green-600',
                                                            red: 'bg-red-100 text-red-600',
                                                            yellow: 'bg-yellow-100 text-yellow-600',
                                                            purple: 'bg-purple-100 text-purple-600',
                                                            pink: 'bg-pink-100 text-pink-600',
                                                            indigo: 'bg-indigo-100 text-indigo-600',
                                                            cyan: 'bg-cyan-100 text-cyan-600',
                                                            teal: 'bg-teal-100 text-teal-600',
                                                            orange: 'bg-orange-100 text-orange-600',
                                                            slate: 'bg-slate-200 text-slate-600',
                                                            emerald: 'bg-emerald-100 text-emerald-600',
                                                            amber: 'bg-amber-100 text-amber-600',
                                                            lime: 'bg-lime-100 text-lime-600',
                                                            sky: 'bg-sky-100 text-sky-600',
                                                            violet: 'bg-violet-100 text-violet-600',
                                                            fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
                                                            rose: 'bg-rose-100 text-rose-600'
                                                        };
                                                        return colors[c] || colors.slate;
                                                    };

                                                    const colorClass = typeof person === 'object' && (person.color || person.department?.color) ? getColorClasses(person.color || person.department?.color) : 'bg-slate-200 text-slate-600';

                                                    return (
                                                        <div key={idx} className="flex items-center gap-1.5 pl-1.5 pr-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700">
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClass}`}>
                                                                {initials}
                                                            </div>
                                                            {name}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
