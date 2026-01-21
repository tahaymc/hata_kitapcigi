import React, { useState } from 'react';
import GuideCard from './GuideCard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Wrapper for Sortable Item
const SortableGuideCard = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.guide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <GuideCard {...props} dragHandleProps={listeners} />
        </div>
    );
};

const GuideGrid = ({
    guides,
    categories,
    onCardClick,
    onCategoryClick,
    selectedDate, // Add selectedDate prop
    onDateClick,
    onCodeClick,
    onResetViewClick,
    onEditClick,
    onDeleteClick,
    onImageClick,
    isAdmin,
    onDragEnd // Callback from HomePage
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Only enable DND if Admin and valid onDragEnd is provided
    const enableDnd = isAdmin && onDragEnd;
    const [activeId, setActiveId] = useState(null);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEndWrapper = (event) => {
        setActiveId(null);
        if (onDragEnd) onDragEnd(event);
    };

    // Helper to render a card
    const renderCard = (guide, isSortable = false) => {
        const key = guide.id;
        const commonProps = {
            guide,
            categories,
            onCardClick,
            onCategoryClick,
            selectedDate, // Pass selectedDate
            onDateClick,
            onCodeClick,
            onResetViewClick,
            onEditClick,
            onDeleteClick,
            onImageClick,
            isAdmin
        };

        if (isSortable) {
            return <SortableGuideCard key={key} {...commonProps} />;
        }
        return <GuideCard key={key} {...commonProps} />;
    };

    if (guides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Kılavuz Bulunamadı
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Henüz eklenmiş bir kullanım kılavuzu yok veya arama kriterlerine uygun kayıt bulunamadı.
                </p>
            </div>
        );
    }

    const content = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map(guide => renderCard(guide, enableDnd))}
        </div>
    );

    if (enableDnd) {
        const items = guides.map(g => g.id);
        const activeGuide = activeId ? guides.find(g => g.id === activeId) : null;

        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEndWrapper}
            >
                <SortableContext
                    items={items}
                    strategy={rectSortingStrategy}
                >
                    {content}
                </SortableContext>
                <DragOverlay>
                    {activeId && activeGuide ? (
                        <div style={{ transform: 'scale(1.05)', cursor: 'grabbing' }}>
                            <GuideCard
                                guide={activeGuide}
                                categories={categories}
                                onCardClick={() => { }}
                                onCategoryClick={() => { }}
                                selectedDate={selectedDate} // Pass selectedDate
                                onDateClick={() => { }}
                                onCodeClick={() => { }}
                                onResetViewClick={() => { }}
                                onEditClick={() => { }}
                                onDeleteClick={() => { }}
                                onImageClick={() => { }}
                                isAdmin={isAdmin}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    }

    return content;
};

export default GuideGrid;
