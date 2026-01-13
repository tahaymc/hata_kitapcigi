import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import ErrorCard from './ErrorCard';
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
const SortableErrorCard = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.error.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <ErrorCard {...props} dragHandleProps={listeners} />
        </div>
    );
};

const ErrorGrid = ({
    errors,
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
    viewMode = 'grid',
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

    // Helper to render a card (standard props)
    const renderCard = (error, isSortable = false) => {
        // Extract key to avoid spreading it into props (React Warning Fix)
        const key = error.id;

        const commonProps = {
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
            viewMode
        };

        if (isSortable) {
            return <SortableErrorCard key={key} {...commonProps} />;
        }
        return <ErrorCard key={key} {...commonProps} />;
    };

    if (errors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Sonuç Bulunamadı
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Arama kriterlerinize uygun kayıt bulunmamaktadır.
                </p>
            </div>
        );
    }

    const content = (
        <div className={viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            : "flex flex-col gap-4 max-w-5xl mx-auto"
        }>
            {errors.map(error => renderCard(error, enableDnd))}
        </div>
    );

    if (enableDnd) {
        // Create a list of IDs for SortableContext
        const items = errors.map(e => e.id);
        const activeError = activeId ? errors.find(e => e.id === activeId) : null;

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
                    {activeId && activeError ? (
                        <div style={{ transform: 'scale(1.05)', cursor: 'grabbing' }}>
                            <ErrorCard
                                error={activeError}
                                categories={categories}
                                selectedDate={selectedDate}
                                onCardClick={() => { }} // Disable clicks during drag
                                onCategoryClick={() => { }}
                                onDateClick={() => { }}
                                onCodeClick={() => { }}
                                onEditClick={() => { }}
                                onDeleteClick={() => { }}
                                onResetViewClick={() => { }}
                                onImageClick={() => { }}
                                isAdmin={isAdmin}
                                viewMode={viewMode}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    }

    return content;
};

export default ErrorGrid;
