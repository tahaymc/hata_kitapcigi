import React from 'react';
import { Calendar, Edit2, Eye, Image as ImageIcon, Trash2, RotateCcw, GripVertical, Star } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon, formatDate, sanitizeRichHtml } from '../utils/helpers';
import { getErrorById } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ErrorCard = ({
    error,
    categories,
    selectedDate,
    onCardClick,
    onCategoryClick,
    onDateClick,
    onCodeClick,
    onEditClick,
    onDeleteClick,
    onResetViewClick,
    onImageClick,
    isAdmin,
    defaultStyle = COLOR_STYLES['slate'],
    dragHandleProps,
    isFavorite = false,
    onToggleFavorite
}) => {
    const queryClient = useQueryClient();
    const { isSuperAdmin, userDepartmentId } = useAuth();
    const cat = categories.find(c => c.id === error.category);
    const colorKey = cat ? cat.color : 'slate';
    const style = COLOR_STYLES[colorKey] || defaultStyle;

    const handleMouseEnter = () => {
        // Prefetch error details on hover
        queryClient.prefetchQuery({
            queryKey: ['error', error.id],
            queryFn: () => getErrorById(error.id),
            staleTime: 1000 * 60 * 5, // 5 min
        });
    };

    return (
            <div
                className={`bg-white dark:bg-[#1e293b] rounded-3xl p-5 shadow-sm hover:shadow-2xl border border-slate-200 dark:border-slate-800 ${style.hoverBorder} transition-all duration-300 group cursor-pointer relative hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full overflow-hidden`}
                onClick={() => onCardClick(error)}
                onMouseEnter={handleMouseEnter}
                onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1.5 ${style.bar?.split(' ')[0] || 'bg-slate-500'} rounded-b-full shadow-sm`} />

                {/* Header: Title and Code/Icon */}
                <div className="flex items-start gap-4 mb-4 mt-2">
                    {/* Left: Category Icon */}
                    <div className="flex-none">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onCategoryClick(error.category);
                            }}
                            className={`p-1.5 rounded-full border shadow-sm transition-transform group-hover:scale-110 cursor-pointer hover:opacity-80 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                            title={`Kategoriye git: ${cat?.name || 'Bilinmeyen'}`}
                        >
                            <div className="flex items-center justify-center">
                                {getCategoryIcon(error.category, "w-5 h-5", cat?.icon)}
                            </div>
                        </div>
                    </div>

                    {/* Center: Title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-sm md:text-base leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {error.title}
                        </h3>
                    </div>

                    {/* Right: Favorite + Code */}
                    <div className="flex-none flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(error.id); }}
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                            title={isFavorite ? 'Favorilerden çıkar' : 'Favorile'}
                        >
                            <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onCodeClick(error.code);
                            }}
                            className={`px-3 py-1 rounded-lg border font-mono font-bold text-[10px] sm:text-xs tracking-tight whitespace-nowrap shadow-sm transition-all cursor-pointer hover:opacity-80 ${style.bgLight} ${style.text} ${style.borderLight}`}
                        >
                            {error.code || 'SYS-000'}
                        </span>
                    </div>
                </div>

                {/* Middle Section: Description */}
                <div className="flex-1 mb-4 min-h-[60px]">
                    <div
                        className="rich-content text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 font-medium"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(error.summary) }}
                    />
                </div>

                {/* Footer Metadata (Pills) */}
                <div className="relative flex items-center justify-between gap-2 mb-4">
                    {/* Category Pill (Left) */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick(error.category);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border truncate max-w-[30%] text-center cursor-pointer hover:opacity-80 transition-opacity z-20 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                        title={`Kategoriye git: ${categories.find(c => c.id === error.category)?.name}`}
                    >
                        {categories.find(c => c.id === error.category)?.name}
                    </div>

                    {/* Date Pill (Absolute Center) */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onDateClick(selectedDate === error.date ? null : error.date);
                        }}
                        className={`absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 ${selectedDate === error.date
                            ? style.buttonSelected
                            : `bg-white dark:bg-slate-900 ${style.text} ${style.borderLight} hover:${style.bgLight}`
                            }`}
                        title={`Tarihe göre filtrele: ${formatDate(error.date)}`}
                    >
                        <Calendar className={`w-3 h-3 ${selectedDate === error.date ? 'text-white' : 'currentColor'}`} />
                        <span>{formatDate(error.date)}</span>
                    </div>

                    {/* View Count & Assignee Pill (Right) */}
                    <div className="flex items-center justify-end gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${style.bgLight} ${style.text} ${style.borderLight}`}>
                            <Eye className="w-4 h-4" />
                            <span>{error.view_count || error.viewCount || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom: Image Section */}
                <div className="mt-auto pt-4">
                    <div className="flex items-center gap-2 mb-2 px-1 opacity-60">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hata Görseli</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                    <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative group/image border-4 ${style.borderLight} transition-colors`}>
                        {(error.imageUrl || (error.imageUrls && error.imageUrls.length > 0)) ? (
                            <>
                                <img
                                    src={error.imageUrls?.[0] || error.imageUrl}
                                    alt={error.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/image:scale-105 cursor-zoom-in relative z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onImageClick(error);
                                    }}
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-slate-900/5 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onImageClick(error);
                                        }}
                                        className="pointer-events-auto transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>Büyüt</span>
                                    </button>
                                </div>
                                {(error.imageUrls && error.imageUrls.length > 1) && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/10 shadow-sm z-20">
                                        +{error.imageUrls.length - 1}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                <ImageIcon className="w-6 h-6 opacity-40" />
                                <span className="text-[10px] font-medium opacity-60">Görsel Yok</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                    <div className="absolute top-2 right-6 flex gap-2 z-10">
                        {dragHandleProps && (
                            <button
                                {...dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                                title="Sıralamak için sürükleyin"
                                onClick={e => e.stopPropagation()}
                            >
                                <GripVertical className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={(e) => onResetViewClick(e, error)}
                            className="text-slate-300 hover:text-orange-500 transition-colors"
                            title="Görüntülenmeyi Sıfırla"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => onEditClick(e, error)}
                            className="text-slate-300 hover:text-blue-500 transition-colors"
                            title="Düzenle"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => onDeleteClick(e, error.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Sil"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
};

export default ErrorCard;
