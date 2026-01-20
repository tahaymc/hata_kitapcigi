import React from 'react';
import { Calendar, Edit2, Eye, Image as ImageIcon, Trash2, BookOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon, formatDate } from '../utils/helpers';
import { getGuideById } from '../services/api';

const GuideCard = ({
    guide = {},
    categories = [],
    onCardClick,
    onCategoryClick,
    onEditClick,
    onDeleteClick,
    onImageClick,
    isAdmin,
    defaultStyle = COLOR_STYLES['emerald']
}) => {
    const queryClient = useQueryClient();
    const cat = categories.find(c => c.id === guide.category);
    // Use emerald style by default or category color if it matches "green-ish" themes? 
    // Or just use the category color. User asked for "Blue-Agua tones".
    // I'll override the style to be Cyan/Emerald if possible, or just respect category.
    // User said: "Hata/Kırmızı" yerine "Bilgi/Mavi-Yeşil" tonlarını kullan.
    // If category has color, we use it. If not, we use defaultStyle.
    const style = cat && COLOR_STYLES[cat.color] ? COLOR_STYLES[cat.color] : defaultStyle;
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        queryClient.prefetchQuery({
            queryKey: ['guide', guide.id],
            queryFn: () => getGuideById(guide.id),
            staleTime: 1000 * 60 * 5,
        });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div
            className={`bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 shadow-sm hover:shadow-2xl border border-slate-200 dark:border-slate-800 ${style.hoverBorder} transition-all duration-300 group cursor-pointer relative hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full overflow-hidden`}
            onClick={() => onCardClick(guide)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1.5 ${style.bar.split(' ')[0]} rounded-b-full shadow-sm`} />

            {/* Header */}
            <div className="flex items-start gap-4 mb-4 mt-2">
                {/* Category Icon */}
                <div className="flex-none">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick(guide.category);
                        }}
                        className={`p-1.5 rounded-full border shadow-sm transition-transform group-hover:scale-110 cursor-pointer hover:opacity-80 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                        title={`Kategori: ${cat?.name || 'Genel'}`}
                    >
                        <div className="flex items-center justify-center">
                            {getCategoryIcon(guide.category, "w-5 h-5", cat?.icon)}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm md:text-base leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {guide.title}
                    </h3>
                </div>

                {/* Guide Code Badge */}
                <div className="flex-none">
                    <span className={`px-3 py-1 rounded-lg border font-bold text-[10px] sm:text-xs tracking-tight whitespace-nowrap shadow-sm transition-all ${style.bgLight} ${style.text} ${style.borderLight} flex items-center gap-1 uppercase`}>
                        {guide.code || `#${guide.id}`}
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div className="flex-1 mb-4 min-h-[60px]">
                <div
                    className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 font-medium"
                    dangerouslySetInnerHTML={{ __html: guide.summary }}
                />
            </div>

            {/* Footer Metadata */}
            <div className="relative flex items-center justify-between gap-2 mb-4">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onCategoryClick(guide.category);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border truncate max-w-[40%] text-center cursor-pointer hover:opacity-80 transition-opacity z-20 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                >
                    {categories.find(c => c.id === guide.category)?.name || 'Genel'}
                </div>

                {/* Date */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${style.bgLight} ${style.text} ${style.borderLight}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(guide.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                {/* View Count & Assignees */}
                <div className="flex items-center justify-end gap-2">
                    {guide.assignees && guide.assignees.length > 0 && (
                        <div className="flex -space-x-2">
                            {guide.assignees.slice(0, 3).map(person => (
                                <div key={person.id} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] bg-${person.color || 'slate'}-100 text-${person.color || 'slate'}-700 border border-${person.color || 'slate'}-200 shadow-sm relative z-10`} title={person.name}>
                                    {person.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${style.bgLight} ${style.text} ${style.borderLight}`}>
                        <Eye className="w-4 h-4" />
                        <span>{guide.view_count || 0}</span>
                    </div>
                </div>
            </div>

            {/* Image Section */}
            <div className="mt-auto pt-4">
                <div className="flex items-center gap-2 mb-2 px-1 opacity-60">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kılavuz Görseli</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative group/image border-4 ${style.borderLight} transition-colors`}>
                    {(guide.video_url || guide.videoUrl) && isHovered ? (
                        <video
                            src={guide.video_url || guide.videoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            ref={(el) => {
                                if (el) {
                                    el.play().catch(err => console.log('Autoplay prevented:', err));
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageClick && onImageClick(guide);
                            }}
                        />
                    ) : (guide.image_url || guide.imageUrl || (guide.image_urls && guide.image_urls.length > 0) || (guide.imageUrls && guide.imageUrls.length > 0)) ? (
                        <>
                            <img
                                src={guide.image_urls?.[0] || guide.imageUrls?.[0] || guide.image_url || guide.imageUrl}
                                alt={guide.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/image:scale-105 cursor-zoom-in relative z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageClick(guide);
                                }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-900/5 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none z-20">
                                <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform scale-90 group-hover/image:scale-100 transition-all">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </>
                    ) : (guide.video_url || guide.videoUrl) ? (
                        <div className="relative w-full h-full bg-slate-900 group-hover/image:bg-slate-800 transition-colors">
                            <video
                                src={`${guide.video_url || guide.videoUrl}#t=0.001`}
                                className="w-full h-full object-cover opacity-90"
                                preload="metadata"
                                muted
                                playsInline
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/10">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 ring-1 ring-white/40 shadow-lg">
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                </div>
                                <span className="text-[10px] font-bold text-white/90 drop-shadow-md tracking-wide">Video</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                            <ImageIcon className="w-6 h-6 opacity-40" />
                            <span className="text-[10px] font-medium opacity-60">Görsel Yok</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
                <div className="absolute top-2 right-6 flex gap-2 z-10">
                    <button
                        onClick={(e) => onEditClick(e, guide)}
                        className="text-slate-300 hover:text-blue-500 transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => onDeleteClick(e, guide.id)}
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

export default GuideCard;
