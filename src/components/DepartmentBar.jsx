import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, ChevronDown, X } from 'lucide-react';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon } from '../utils/helpers';

/**
 * DepartmentBar — Üst yatay departman navigasyonu (TEK SATIR / kompakt)
 * --------------------------------------------------------------------------
 * Header'ın altına yapışan cam efektli (glassmorphism) tek satır:
 *   [ Çözümler | Eğitimler ]  ｜  Tümü  Bilgi İşlem ▾  Muhasebe ▾  ...
 *
 * MASAÜSTÜ (lg+): Departmana hover → alt kategoriler mega-menü olarak iner.
 * MOBİL (<lg): Modül seçici üstte; departman chip'leri kaydırmalı; departmana
 *   basınca alt kategoriler TAM EKRAN overlay olarak açılır.
 *
 * Renk departmandan gelir (migration 0001). Departman verisi yoksa düz şeride düşer.
 *
 * Props:
 *   categories, departments, selectedCategory, onSelectCategory,
 *   activeTab, setActiveTab, counts?
 */
const DepartmentBar = ({
    categories = [],
    departments = [],
    selectedCategory,
    onSelectCategory,
    activeTab,
    setActiveTab,
    counts = null,
}) => {
    const tabCategories = useMemo(
        () => categories.filter(c => c.type === activeTab || (!c.type && activeTab === 'errors')),
        [categories, activeTab]
    );

    const categoriesByDept = useMemo(() => {
        const map = new Map();
        for (const c of tabCategories) {
            const key = c.department_id ?? '__none__';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(c);
        }
        return map;
    }, [tabCategories]);

    const visibleDepartments = useMemo(() => {
        return [...departments]
            .filter(d => (categoriesByDept.get(d.id) || []).length > 0)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'tr'));
    }, [departments, categoriesByDept]);

    const orphanCategories = categoriesByDept.get('__none__') || [];
    const useFlatFallback = visibleDepartments.length === 0;
    const countFor = (catId) => (counts && counts[catId] != null ? counts[catId] : null);

    // ---- Masaüstü hover mega-menü state ----
    const [hoverDeptId, setHoverDeptId] = useState(null);
    const closeTimer = useRef(null);
    const openMega = useCallback((deptId) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setHoverDeptId(deptId);
    }, []);
    const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setHoverDeptId(null), 160);
    }, []);
    useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    // ---- Mobil tam ekran overlay state ----
    const [mobileDeptId, setMobileDeptId] = useState(null);

    useEffect(() => {
        setHoverDeptId(null);
        setMobileDeptId(null);
    }, [activeTab]);

    useEffect(() => {
        document.body.style.overflow = mobileDeptId ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileDeptId]);

    const handleSelect = (catId) => {
        onSelectCategory(selectedCategory === catId ? null : catId);
        setHoverDeptId(null);
        setMobileDeptId(null);
    };
    const handleSelectAll = () => {
        onSelectCategory(null);
        setHoverDeptId(null);
        setMobileDeptId(null);
    };

    const hoverDept = visibleDepartments.find(d => d.id === hoverDeptId);
    const mobileDept = visibleDepartments.find(d => d.id === mobileDeptId);
    const deptHasSelected = (dept) =>
        (categoriesByDept.get(dept.id) || []).some(s => s.id === selectedCategory);

    // Modül seçici (Çözümler / Eğitimler) — segment
    const ModuleSegment = ({ size = 'desktop' }) => {
        const pad = size === 'desktop' ? 'px-4 py-1.5' : 'flex-1 py-2 justify-center';
        return (
            <div className={`inline-flex bg-slate-200/50 dark:bg-slate-700/40 rounded-xl p-1 backdrop-blur-sm ${size === 'mobile' ? 'flex w-full' : ''}`}>
                <button
                    onClick={() => setActiveTab && setActiveTab('errors')}
                    className={`flex items-center gap-1.5 ${pad} rounded-lg text-[13px] font-bold transition-all ${activeTab === 'errors'
                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-900/5'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                >
                    Çözümler
                </button>
                <button
                    onClick={() => setActiveTab && setActiveTab('guides')}
                    className={`flex items-center gap-1.5 ${pad} rounded-lg text-[13px] font-bold transition-all ${activeTab === 'guides'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-900/5'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                >
                    Eğitimler
                </button>
            </div>
        );
    };

    return (
        <div className="sticky top-[68px] md:top-[76px] z-[90] bg-gradient-to-b from-blue-50/80 to-slate-50/60 dark:from-slate-900/80 dark:to-[#0f172a]/60 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="max-w-[1920px] mx-auto px-6">

                {/* ===================== MASAÜSTÜ (lg+) — TEK SATIR ===================== */}
                <div
                    className="hidden lg:flex items-center gap-4 py-2.5 relative"
                    onMouseLeave={scheduleClose}
                >
                    {/* Modül seçici */}
                    <div className="flex-none" onMouseEnter={() => setHoverDeptId(null)}>
                        <ModuleSegment size="desktop" />
                    </div>

                    {/* Dikey ayraç */}
                    <div className="flex-none w-px h-6 bg-slate-300/50 dark:bg-slate-600/50" />

                    {/* Departmanlar */}
                    <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto custom-scrollbar">
                        {/* Tümü */}
                        <button
                            onClick={handleSelectAll}
                            onMouseEnter={() => setHoverDeptId(null)}
                            className={`flex-none flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all ${!selectedCategory
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Tümü</span>
                        </button>

                        {useFlatFallback ? (
                            tabCategories.map(c => {
                                const style = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                                const isSel = selectedCategory === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelect(c.id)}
                                        className={`flex-none flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${isSel
                                            ? `${style.bgLight} ${style.text}`
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })
                        ) : (
                            <>
                                {visibleDepartments.map(dept => {
                                    const style = COLOR_STYLES[dept.color] || COLOR_STYLES.slate;
                                    const active = hoverDeptId === dept.id;
                                    const hasSel = deptHasSelected(dept);
                                    return (
                                        <div key={dept.id} onMouseEnter={() => openMega(dept.id)} className="flex-none">
                                            <button
                                                onClick={() => openMega(dept.id)}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${active || hasSel
                                                    ? `${style.bgLight} ${style.text}`
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                                                    }`}
                                            >
                                                <span className={`inline-flex ${active || hasSel ? style.text : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {getCategoryIcon(dept.id, 'w-4 h-4', dept.icon)}
                                                </span>
                                                <span>{dept.name}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${active ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {orphanCategories.map(c => {
                                    const style = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                                    const isSel = selectedCategory === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c.id)}
                                            onMouseEnter={() => setHoverDeptId(null)}
                                            className={`flex-none flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${isSel
                                                ? `${style.bgLight} ${style.text}`
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70'
                                                }`}
                                        >
                                            {c.name}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* ---- MEGA-MENÜ ---- */}
                    {hoverDept && (
                        <div
                            onMouseEnter={() => openMega(hoverDept.id)}
                            onMouseLeave={scheduleClose}
                            className="absolute left-0 right-0 top-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-900/10 p-5 mt-2 z-[95] animate-[fadeIn_.15s_ease-out]"
                        >
                            {(() => {
                                const style = COLOR_STYLES[hoverDept.color] || COLOR_STYLES.slate;
                                const subs = categoriesByDept.get(hoverDept.id) || [];
                                return (
                                    <>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <span className={`inline-flex p-1.5 rounded-lg ${style.bgLight} ${style.text}`}>
                                                {getCategoryIcon(hoverDept.id, 'w-5 h-5', hoverDept.icon)}
                                            </span>
                                            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{hoverDept.name}</span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${style.bgLight} ${style.text}`}>
                                                {subs.length} kategori
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5">
                                            {subs.map(s => {
                                                const isSel = selectedCategory === s.id;
                                                const cnt = countFor(s.id);
                                                const subStyle = COLOR_STYLES[s.color] || COLOR_STYLES.slate;
                                                return (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleSelect(s.id)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${isSel
                                                            ? `${subStyle.bgLight} ${subStyle.text}`
                                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        <span className={`inline-flex p-1.5 rounded-lg ${subStyle.bgLight} ${subStyle.text} group-hover:scale-105 transition-transform`}>
                                                            {getCategoryIcon(s.id, 'w-4 h-4', s.icon)}
                                                        </span>
                                                        <span className="flex-1 text-sm font-bold truncate">{s.name}</span>
                                                        {cnt != null && (
                                                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{cnt}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* ===================== MOBİL (<lg) ===================== */}
                <div className="lg:hidden py-3 space-y-3">
                    {/* Modül seçici (tam genişlik) */}
                    <ModuleSegment size="mobile" />

                    {/* Departman chip'leri */}
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar -mx-1 px-1 snap-x">
                        <button
                            onClick={handleSelectAll}
                            className={`snap-start flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${!selectedCategory
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                                : 'bg-white/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Tümü</span>
                        </button>

                        {useFlatFallback
                            ? tabCategories.map(c => {
                                const style = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                                const isSel = selectedCategory === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelect(c.id)}
                                        className={`snap-start flex-none px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${isSel
                                            ? style.buttonSelected
                                            : 'bg-white/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })
                            : visibleDepartments.map(dept => {
                                const style = COLOR_STYLES[dept.color] || COLOR_STYLES.slate;
                                const hasSel = deptHasSelected(dept);
                                return (
                                    <button
                                        key={dept.id}
                                        onClick={() => setMobileDeptId(dept.id)}
                                        className={`snap-start flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${hasSel
                                            ? `${style.bgLight} ${style.text} ${style.border}`
                                            : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70'
                                            }`}
                                    >
                                        <span className={`inline-flex ${hasSel ? style.text : 'text-slate-400'}`}>
                                            {getCategoryIcon(dept.id, 'w-4 h-4', dept.icon)}
                                        </span>
                                        <span>{dept.name}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                    </button>
                                );
                            })}

                        {!useFlatFallback && orphanCategories.map(c => {
                            const isSel = selectedCategory === c.id;
                            const style = COLOR_STYLES[c.color] || COLOR_STYLES.slate;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelect(c.id)}
                                    className={`snap-start flex-none px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${isSel
                                        ? style.buttonSelected
                                        : 'bg-white/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ===== MOBİL TAM EKRAN ALT KATEGORİ OVERLAY ===== */}
            {mobileDept && (() => {
                const style = COLOR_STYLES[mobileDept.color] || COLOR_STYLES.slate;
                const subs = categoriesByDept.get(mobileDept.id) || [];
                return (
                    <div className="lg:hidden fixed inset-0 z-[150] flex flex-col bg-white dark:bg-[#0f172a] animate-[fadeIn_.15s_ease-out]">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <span className={`inline-flex p-2 rounded-xl ${style.bgLight} ${style.text}`}>
                                {getCategoryIcon(mobileDept.id, 'w-5 h-5', mobileDept.icon)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate">{mobileDept.name}</h3>
                                <p className="text-xs font-semibold text-slate-400">{subs.length} kategori</p>
                            </div>
                            <button
                                onClick={() => setMobileDeptId(null)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <button
                                onClick={handleSelectAll}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <LayoutGrid className="w-5 h-5" />
                                <span>Tümünü göster</span>
                            </button>
                            {subs.map(s => {
                                const isSel = selectedCategory === s.id;
                                const cnt = countFor(s.id);
                                const subStyle = COLOR_STYLES[s.color] || COLOR_STYLES.slate;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelect(s.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${isSel
                                            ? `${subStyle.buttonSelected}`
                                            : 'bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <span className={`inline-flex p-1.5 rounded-lg ${isSel ? 'bg-white/20' : `${subStyle.bgLight} ${subStyle.text}`}`}>
                                            {getCategoryIcon(s.id, 'w-5 h-5', s.icon)}
                                        </span>
                                        <span className="flex-1 text-left">{s.name}</span>
                                        {cnt != null && (
                                            <span className={`text-xs font-bold ${isSel ? 'text-white/80' : 'text-slate-400'}`}>{cnt}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default DepartmentBar;
