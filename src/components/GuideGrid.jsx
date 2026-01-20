import React from 'react';
import GuideCard from './GuideCard';

const GuideGrid = ({
    guides,
    categories,
    onCardClick,
    onCategoryClick,
    onEditClick,
    onDeleteClick,
    onImageClick,
    isAdmin
}) => {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map(guide => (
                <GuideCard
                    key={guide.id}
                    guide={guide}
                    categories={categories}
                    onCardClick={onCardClick}
                    onCategoryClick={onCategoryClick}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onImageClick={onImageClick}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
};

export default GuideGrid;
