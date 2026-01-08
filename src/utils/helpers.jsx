import React from 'react';
import { ShoppingCart, Archive, Monitor, Settings } from 'lucide-react';
import { ICON_OPTIONS } from './constants';
import { CATEGORIES } from '../data/mockData';

export const getCategoryIcon = (categoryId, className = "w-6 h-6", iconName = null) => {
    // If iconName is provided (from category object), use it
    if (iconName && ICON_OPTIONS[iconName]) {
        const IconComponent = ICON_OPTIONS[iconName];
        return <IconComponent className={className} />;
    }

    // Fallback for legacy hardcoded categories
    switch (categoryId) {
        case 'kasa': return <ShoppingCart className={className} />;
        case 'reyon': return <Archive className={className} />;
        case 'depo': return <Archive className={className} />;
        case 'sistem': return <Monitor className={className} />;
        default: return <Settings className={className} />;
    }
};

export const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.color : 'slate';
};

export const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('.') && dateStr.split('.').length === 3) return dateStr;
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    }
    return dateStr;
};

export const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};
