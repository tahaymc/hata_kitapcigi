import React from 'react';
import { Calendar } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import ErrorCard from './ErrorCard';


const ErrorGrid = ({
    errors,
    viewMode,
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
    onMouseEnter,
    isAdmin,
    defaultStyle = COLOR_STYLES['slate']
}) => {

    if (errors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Calendar className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Sonuç Bulunamadı</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Aradığınız kriterlere uygun bir kayıt bulunamadı. Filtreleri değiştirip tekrar deneyin.</p>
            </div>
        );
    }

    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
            {errors.map((error) => (
                <ErrorCard
                    key={error.id}
                    error={error}
                    categories={categories}
                    selectedDate={selectedDate}
                    viewMode={viewMode}
                    isAdmin={isAdmin}
                    defaultStyle={defaultStyle}
                    onCardClick={onCardClick}
                    onCategoryClick={onCategoryClick}
                    onDateClick={onDateClick}
                    onCodeClick={onCodeClick}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onResetViewClick={onResetViewClick}
                    onImageClick={onImageClick}
                />
            ))}
        </div>
    );
};

export default ErrorGrid;
