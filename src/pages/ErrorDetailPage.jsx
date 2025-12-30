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

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    // If it is already in DD.MM.YYYY format (legacy data)
    if (dateStr.includes('.') && dateStr.split('.').length === 3) return dateStr;
    // If it is YYYY-MM-DD (new standard)
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    }
    return dateStr;
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

                        {/* Solution Steps - Redesigned to Neutral Card Theme */}
                        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>

                            {/* Header */}
                            <div className="flex flex-col gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${colorStyle.text}`} />
                                    <span className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Çözüm Adımları</span>
                                    <div className="h-px flex-1 bg-slate-700/50 ml-2"></div>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none pl-2">
                                <ul className="space-y-4">
                                    {error.solution.split('\n').map((step, index) => (
                                        <li key={index} className="flex gap-4 items-start text-slate-300">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0f172a] border border-slate-700 shadow-sm relative overflow-hidden flex items-center justify-center group">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                                <span className="font-bold text-sm text-slate-200 pl-1">{index + 1}</span>
                                            </div>
                                            <span className="mt-1 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Footer Info: Date, Category, Related People */}
                        <div className="space-y-3">
                            {/* Compact Info Row - Redesigned */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Date Card */}
                                <div className="bg-[#1e293b] px-4 py-3 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group flex items-center gap-3">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                    <div className="p-2 rounded-lg bg-[#0f172a] shadow-sm border border-slate-700 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="pl-1">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">Tarih</p>
                                        <p className="text-sm font-bold text-slate-200 leading-none">{formatDisplayDate(error.date)}</p>
                                    </div>
                                </div>

                                {/* Category Card */}
                                <div className="bg-[#1e293b] px-4 py-3 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group flex items-center gap-3">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                    <div className={`p-2 rounded-lg bg-[#0f172a] shadow-sm border border-slate-700 ${colorStyle.text}`}>
                                        {React.cloneElement(getCategoryIcon(error.category), { className: "w-4 h-4" })}
                                    </div>
                                    <div className="pl-1">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">Kategori</p>
                                        <p className="text-sm font-bold text-slate-200 leading-none">{category?.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Refined Related People Section - More Prominent per request - Neutral Card, Category Accent */}
                            {error.relatedPeople && error.relatedPeople.length > 0 && (
                                <div className="mt-2">
                                    <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
                                        {/* Category Colored Accent Bar - Thicker and Solid to match Cards */}
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorStyle.border.replace('border-', 'bg-')} shadow-[1px_0_2px_rgba(0,0,0,0.1)]`}></div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest pl-2">İlgili Kişiler</span>
                                                <div className="h-px w-full bg-slate-700/50"></div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-2">
                                                {error.relatedPeople.map((person, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-[#0f172a] border border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105">
                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm bg-gradient-to-br ${Object.values(COLOR_STYLES)[idx % 5].text.replace('text-', 'from-').split(' ')[0]} ${Object.values(COLOR_STYLES)[(idx + 1) % 5].text.replace('text-', 'to-').split(' ')[0].replace('400', '500')}`}>
                                                            {person.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-200">{person}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
