import React, { useMemo } from 'react';
import { Eye, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon, formatDate } from '../utils/helpers';

/**
 * HighlightsBar — "En Çok Görüntülenen" ve "Yeni Eklenen" yatay şeritleri
 * --------------------------------------------------------------------------
 * Ana sayfada favori şeridinin altında, öne çıkan kayıtları küçük kartlarla
 * gösterir (salt görüntüleme; favori/sürükleme yok).
 *
 * Alan farkları tolere edilir:
 *   - görüntülenme: viewCount (hata) | view_count (eğitim)
 *   - tarih       : created_at (eğitim) | date (hata)
 *
 * Props:
 *   items       : aktif sekmenin TÜM kayıtları (filtrelenmemiş allErrors/allGuides)
 *   categories  : renk/ikon için kategori listesi
 *   kind        : 'errors' | 'guides'  (başlık metni)
 *   onCardClick : (item) => void
 *   limit       : her şeritte en fazla kart (varsayılan 12)
 */

const getViews = (it) => it.viewCount ?? it.view_count ?? 0;
const getDateVal = (it) => it.created_at || it.date || null;

const HighlightCard = ({ item, categories, onCardClick, metric }) => {
    const cat = categories.find(c => c.id === item.category);
    const style = COLOR_STYLES[cat?.color] || COLOR_STYLES.slate;
    return (
        <button
            onClick={() => onCardClick(item)}
            className={`group w-full text-left bg-white dark:bg-[#1e293b] rounded-xl border ${style.borderLight} dark:border-slate-700/70 px-3 py-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5`}
        >
            <span className={`inline-flex p-1.5 rounded-lg ${style.bgLight} ${style.text} flex-none`}>
                {getCategoryIcon(item.category, 'w-4 h-4', cat?.icon)}
            </span>

            <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-bold leading-tight line-clamp-1 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    {item.code && (
                        <span className={`font-mono font-bold text-[9px] ${style.text} flex-none`}>
                            {item.code}
                        </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                        {cat?.name || ''}
                    </span>
                </div>
            </div>

            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex-none">
                {metric === 'views' ? (
                    <><Eye className="w-3.5 h-3.5" />{getViews(item)}</>
                ) : (
                    <><Clock className="w-3.5 h-3.5" />{formatDate(getDateVal(item))}</>
                )}
            </span>
        </button>
    );
};

const Strip = ({ title, icon, accent, items, categories, onCardClick, metric }) => {
    if (!items.length) return null;
    return (
        <section className="animate-[fadeIn_.2s_ease-out]">
            <div className="flex items-center gap-2 mb-3 px-0.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${accent.bg} ${accent.text}`}>
                    {icon}
                </span>
                <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                    {title}
                </h2>
                <div className={`flex-1 h-px bg-gradient-to-r ${accent.line} to-transparent ml-2`} />
            </div>
            <div className="flex flex-col gap-2.5 max-w-[640px]">
                {items.map(it => (
                    <HighlightCard key={it.id} item={it} categories={categories} onCardClick={onCardClick} metric={metric} />
                ))}
            </div>
        </section>
    );
};

const HighlightsBar = ({ items = [], categories = [], kind = 'errors', onCardClick, limit = 3 }) => {
    const mostViewed = useMemo(() => (
        items
            .filter(it => getViews(it) > 0)
            .slice()
            .sort((a, b) => getViews(b) - getViews(a))
            .slice(0, limit)
    ), [items, limit]);

    const newest = useMemo(() => (
        items
            .slice()
            .sort((a, b) => {
                const ta = getDateVal(a) ? new Date(getDateVal(a)).getTime() : 0;
                const tb = getDateVal(b) ? new Date(getDateVal(b)).getTime() : 0;
                if (tb !== ta) return tb - ta;
                return (b.id || 0) - (a.id || 0); // tarih eşitse daha yeni id öne
            })
            .slice(0, limit)
    ), [items, limit]);

    const isGuides = kind === 'guides';

    if (!mostViewed.length && !newest.length) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Strip
                title={isGuides ? 'En Çok Görüntülenen Eğitimler' : 'En Çok Görüntülenen Çözümler'}
                icon={<TrendingUp className="w-4 h-4" />}
                accent={{ bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-500', line: 'from-rose-200/60 dark:from-rose-500/20' }}
                items={mostViewed}
                categories={categories}
                onCardClick={onCardClick}
                metric="views"
            />
            <Strip
                title={isGuides ? 'Yeni Eklenen Eğitimler' : 'Yeni Eklenen Çözümler'}
                icon={<Sparkles className="w-4 h-4" />}
                accent={{ bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-500', line: 'from-emerald-200/60 dark:from-emerald-500/20' }}
                items={newest}
                categories={categories}
                onCardClick={onCardClick}
                metric="date"
            />
        </div>
    );
};

export default HighlightsBar;
