import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Monitor, ShoppingCart, Archive, Settings, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { getErrorById, CATEGORIES } from '../data/mockData';

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
    blue: { text: 'text-blue-400', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', border: 'border-blue-500' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500', bgLight: 'bg-orange-500/10', border: 'border-orange-500' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', border: 'border-purple-500' },
    slate: { text: 'text-slate-400', bg: 'bg-slate-500', bgLight: 'bg-slate-500/10', border: 'border-slate-500' }
};

const ErrorDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getErrorById(id).then(data => {
            setError(data);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Yükleniyor...</div>;
    if (!error) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Hata bulunamadı.</div>;

    const category = CATEGORIES.find(c => c.id === error.category);
    const colorStyle = COLOR_STYLES[category?.color || 'slate'];

    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100 flex flex-col">
            {/* Header */}
            <header className="bg-[#1e293b] border-b border-slate-700/50 sticky top-0 z-10">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-md ${colorStyle.bgLight} border border-${colorStyle.border}/20 ${colorStyle.text} font-mono font-bold text-sm tracking-wider`}>
                                {error.code || 'SYS-000'}
                            </span>
                            <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                                {category?.name || 'Genel'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Content: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                                {error.title}
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                {error.summary}
                            </p>
                        </div>

                        {/* Solution Steps */}
                        <div className="bg-[#1e293b] rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-700/50 bg-[#253248] flex items-center gap-3">
                                <CheckCircle className={`w-6 h-6 ${colorStyle.text}`} />
                                <h2 className="text-xl font-bold text-white">Çözüm Adımları</h2>
                            </div>
                            <div className="p-8">
                                <div className="prose prose-invert max-w-none">
                                    <ul className="space-y-4">
                                        {error.solution.split('\n').map((step, index) => (
                                            <li key={index} className="flex gap-4 items-start text-slate-300">
                                                <span className={`flex-shrink-0 w-8 h-8 rounded-full ${colorStyle.bgLight} ${colorStyle.text} flex items-center justify-center font-bold text-sm`}>
                                                    {index + 1}
                                                </span>
                                                <span className="mt-1 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="flex items-center justify-between p-6 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center text-slate-400">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Son Güncelleme</p>
                                    <p className="text-white font-medium">{error.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center text-slate-400">
                                    {getCategoryIcon(error.category)}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Kategori</p>
                                    <p className="text-white font-medium">{category?.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Image */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-[#1e293b] rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl group">
                                <div className="aspect-[4/5] w-full bg-[#0f172a] relative overflow-hidden">
                                    {error.imageUrl ? (
                                        <img
                                            src={error.imageUrl}
                                            alt={error.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                                            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                            <span className="text-sm font-medium">Görsel Mevcut Değil</span>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-60"></div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4 text-amber-400">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-wide">Hata Görseli</span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Bu görsel, hatanın ekranda veya cihazda nasıl göründüğünü temsil eder. Karşılaştığınız durum ile eşleşip eşleşmediğini kontrol edin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ErrorDetailPage;
