import React from 'react';
import { X, Calendar, Monitor, ShoppingCart, Archive, Settings, CheckCircle, AlertTriangle, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
        case 'kasa': return <ShoppingCart className="w-6 h-6" />;
        case 'reyon': return <Archive className="w-6 h-6" />;
        case 'depo': return <Archive className="w-6 h-6" />;
        case 'sistem': return <Monitor className="w-6 h-6" />;
        default: return <Settings className="w-6 h-6" />;
    }
};

const COLOR_STYLES = {
    blue: { text: 'text-blue-400', bgLight: 'bg-blue-500/10', border: 'border-blue-500', ring: 'ring-blue-500' },
    emerald: { text: 'text-emerald-400', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500', ring: 'ring-emerald-500' },
    orange: { text: 'text-orange-400', bgLight: 'bg-orange-500/10', border: 'border-orange-500', ring: 'ring-orange-500' },
    purple: { text: 'text-purple-400', bgLight: 'bg-purple-500/10', border: 'border-purple-500', ring: 'ring-purple-500' },
    slate: { text: 'text-slate-400', bgLight: 'bg-slate-500/10', border: 'border-slate-500', ring: 'ring-slate-500' }
};

const ErrorDetailModal = ({ error, onClose }) => {
    const [isImageEnlarged, setIsImageEnlarged] = React.useState(false);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!error) return null;

    const category = CATEGORIES.find(c => c.id === error.category);
    const colorStyle = COLOR_STYLES[category?.color || 'slate'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f172a] rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-[#1e293b]">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-md ${colorStyle.bgLight} border border-${colorStyle.border}/20 ${colorStyle.text} font-mono font-bold text-sm tracking-wider`}>
                            {error.code || 'SYS-000'}
                        </span>
                        <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                            {category?.name || 'Genel'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight">
                                    {error.title}
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    {error.summary}
                                </p>
                            </div>

                            {/* Solution Steps */}
                            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg">
                                <div className="px-6 py-4 border-b border-slate-700/50 bg-[#253248] flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${colorStyle.text}`} />
                                    <h3 className="text-lg font-bold text-white">Çözüm Adımları</h3>
                                </div>
                                <div className="p-6">
                                    <ul className="space-y-4">
                                        {error.solution.split('\n').map((step, index) => (
                                            <li key={index} className="flex gap-4 items-start text-slate-300">
                                                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${colorStyle.bgLight} ${colorStyle.text} flex items-center justify-center font-bold text-xs ring-1 ${colorStyle.ring}/30`}>
                                                    {index + 1}
                                                </span>
                                                <span className="mt-0.5 leading-relaxed text-sm md:text-base">{step.replace(/^\d+\.\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="flex flex-col sm:flex-row gap-4 p-5 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-slate-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tarih</p>
                                        <p className="text-white text-sm font-medium">{error.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-slate-400">
                                        {getCategoryIcon(error.category)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kategori</p>
                                        <p className="text-white text-sm font-medium">{category?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Right Content: Image */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-0 space-y-4">
                                <div
                                    className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl group cursor-pointer"
                                    onClick={() => error.imageUrl && setIsImageEnlarged(true)}
                                >
                                    <div className="aspect-[3/4] w-full bg-[#0f172a] relative overflow-hidden">
                                        {error.imageUrl ? (
                                            <>
                                                <img
                                                    src={error.imageUrl}
                                                    alt={error.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {/* Hover Overlay with Magnifying Glass */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 group-hover:bg-black/40 backdrop-blur-[0px] group-hover:backdrop-blur-[2px]">
                                                    <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 text-white shadow-xl transform scale-50 opacity-0 translate-y-4 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                                                        <ZoomIn className="w-8 h-8" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                                                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <span className="text-xs font-medium">Görsel Yok</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-60 pointer-events-none"></div>
                                    </div>
                                    <div className="p-4 bg-[#1e293b]">
                                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="font-bold text-xs uppercase tracking-wide">Hata Görseli</span>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Hatanın sistemdeki veya ekrandaki temsili görüntüsüdür.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Image Overlay */}
            {isImageEnlarged && (
                <div
                    className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsImageEnlarged(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setIsImageEnlarged(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={error.imageUrl}
                        alt={error.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ErrorDetailModal;
