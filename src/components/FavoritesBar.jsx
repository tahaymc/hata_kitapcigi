import React, { useMemo, useState } from 'react';
import { Star, ChevronRight, GripVertical } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon } from '../utils/helpers';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * FavoritesBar — "Favorilerim" yatay kaydırmalı şerit
 * --------------------------------------------------------------------------
 * Sayfanın üstünde, yıldızlanan kayıtları küçük kartlar halinde gösterir.
 * Giriş gerektirmez; favoriler localStorage'dan gelir (useFavorites).
 *
 * Kartlar sürükle-bırak ile yeniden sıralanabilir (diğer kart grid'leri gibi).
 *
 * Props:
 *   items        : favori OBJELERİ (HomePage, favoriteIds'i tam kayıtlarla eşler)
 *   categories   : kategori listesi (renk/ikon için)
 *   onCardClick  : (item) => void   — karta tıklanınca aç
 *   onUnfavorite : (id) => void     — küçük yıldız ile çıkar
 *   onReorder    : (orderedIds[]) => void  — görünür kartların YENİ sırası
 *   kind         : 'errors' | 'guides'  (başlık metni için)
 *
 * items boşsa hiçbir şey render etmez (şerit görünmez).
 */

// Tek favori kart içeriği (sürüklenebilir sarmalayıcıdan ayrı, overlay'de de kullanılır)
const FavoriteCardInner = ({ item, cat, style, onCardClick, onUnfavorite, dragHandleProps }) => (
    <button
        onClick={() => onCardClick(item)}
        className={`group relative w-60 text-left bg-white dark:bg-[#1e293b] rounded-2xl border ${style.borderLight} dark:border-slate-700/70 p-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
    >
        {/* Üst: ikon + kod + sürükleme + çıkar */}
        <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex p-1.5 rounded-lg ${style.bgLight} ${style.text} flex-none`}>
                {getCategoryIcon(item.category, 'w-4 h-4', cat?.icon)}
            </span>
            {item.code && (
                <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${style.bgLight} ${style.text} truncate`}>
                    {item.code}
                </span>
            )}
            <div className="ml-auto flex items-center gap-0.5 flex-none">
                {dragHandleProps && (
                    <span
                        {...dragHandleProps.attributes}
                        {...dragHandleProps.listeners}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-grab active:cursor-grabbing touch-none"
                        title="Sıralamak için sürükleyin"
                    >
                        <GripVertical className="w-4 h-4" />
                    </span>
                )}
                <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onUnfavorite(item.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onUnfavorite(item.id); } }}
                    className="p-1 rounded-md text-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Favorilerden çıkar"
                >
                    <Star className="w-4 h-4" fill="currentColor" />
                </span>
            </div>
        </div>

        {/* Başlık */}
        <h3 className="text-[13px] font-bold leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[34px]">
            {item.title}
        </h3>

        {/* Alt: kategori + git oku */}
        <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[70%]">
                {cat?.name || ''}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </div>
    </button>
);

// Sürüklenebilir sarmalayıcı
const SortableFavoriteCard = ({ item, cat, style, onCardClick, onUnfavorite }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(item.id) });
    const wrapStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };
    return (
        <div ref={setNodeRef} style={wrapStyle} className="snap-start flex-none">
            <FavoriteCardInner
                item={item}
                cat={cat}
                style={style}
                onCardClick={onCardClick}
                onUnfavorite={onUnfavorite}
                dragHandleProps={{ attributes, listeners }}
            />
        </div>
    );
};

const FavoritesBar = ({ items = [], categories = [], onCardClick, onUnfavorite, onReorder, kind = 'errors' }) => {
    const label = kind === 'guides' ? 'Favori Eğitimlerim' : 'Favori Çözümlerim';

    const cards = useMemo(() => items.filter(Boolean), [items]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );
    const [activeId, setActiveId] = useState(null);

    const styleFor = (item) => {
        const cat = categories.find(c => c.id === item.category);
        return { cat, style: COLOR_STYLES[cat?.color] || COLOR_STYLES.slate };
    };

    if (cards.length === 0) return null;

    const enableDnd = typeof onReorder === 'function' && cards.length > 1;

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = cards.findIndex(c => String(c.id) === String(active.id));
        const newIndex = cards.findIndex(c => String(c.id) === String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(cards, oldIndex, newIndex);
        onReorder(newOrder.map(c => String(c.id)));
    };

    const activeCard = activeId != null ? cards.find(c => String(c.id) === String(activeId)) : null;

    const list = (
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 -mx-1 px-1 snap-x">
            {cards.map(item => {
                const { cat, style } = styleFor(item);
                return enableDnd ? (
                    <SortableFavoriteCard
                        key={item.id}
                        item={item}
                        cat={cat}
                        style={style}
                        onCardClick={onCardClick}
                        onUnfavorite={onUnfavorite}
                    />
                ) : (
                    <div key={item.id} className="snap-start flex-none">
                        <FavoriteCardInner
                            item={item}
                            cat={cat}
                            style={style}
                            onCardClick={onCardClick}
                            onUnfavorite={onUnfavorite}
                        />
                    </div>
                );
            })}
        </div>
    );

    return (
        <section className="mb-6 animate-[fadeIn_.2s_ease-out]">
            {/* Başlık */}
            <div className="flex items-center gap-2 mb-3 px-0.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-500">
                    <Star className="w-4 h-4" fill="currentColor" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                    {label}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {cards.length}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent dark:from-amber-500/20 ml-2" />
            </div>

            {/* Yatay kaydırmalı küçük kartlar */}
            {enableDnd ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={cards.map(c => String(c.id))} strategy={horizontalListSortingStrategy}>
                        {list}
                    </SortableContext>
                    <DragOverlay>
                        {activeCard ? (() => {
                            const { cat, style } = styleFor(activeCard);
                            return (
                                <div style={{ cursor: 'grabbing' }}>
                                    <FavoriteCardInner
                                        item={activeCard}
                                        cat={cat}
                                        style={style}
                                        onCardClick={() => { }}
                                        onUnfavorite={() => { }}
                                    />
                                </div>
                            );
                        })() : null}
                    </DragOverlay>
                </DndContext>
            ) : list}
        </section>
    );
};

export default FavoritesBar;
