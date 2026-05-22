import React from 'react';
import { ShoppingCart, Archive, Monitor, Settings } from 'lucide-react';
import { ICON_OPTIONS } from './constants';

// Yapıştırılan zengin metni (Word, Google Gemini/Docs, web) temizler.
// Bu kaynaklar inline 'style' (font-family/color ... !important dahil),
// 'class' ve framework artığı (_ngcontent, data-*, aria-*) öznitelikleri
// taşır; bunlar site temasını (Inter fontu, koyu mod rengi) ezer.
// Etiketleri ve <font color> gibi kasıtlı biçimlendirmeyi korur,
// yalnızca stil bozan öznitelikleri kaldırır.
export const sanitizeRichHtml = (html) => {
    if (!html || typeof html !== 'string') return html || '';
    // HTML etiketi yoksa olduğu gibi bırak (düz metin)
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.body.querySelectorAll('*').forEach((el) => {
            [...el.attributes].forEach((attr) => {
                const name = attr.name.toLowerCase();
                const keep =
                    name === 'href' ||
                    name === 'src' ||
                    name === 'alt' ||
                    name === 'color'; // <font color="..."> toolbar rengi korunur
                if (!keep) el.removeAttribute(attr.name);
            });
        });
        return doc.body.innerHTML;
    } catch {
        return html;
    }
};


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



export const formatDate = (dateString) => {
    if (!dateString) return 'Tarih Belirtilmedi';
    try {
        const date = new Date(dateString);
        // Geçersiz tarih kontrolü
        if (isNaN(date.getTime())) return 'Geçersiz Tarih';

        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

export const formatDisplayDate = formatDate; // Alias for backward compatibility

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
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};
