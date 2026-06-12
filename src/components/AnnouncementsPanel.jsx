import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, Plus, Edit2, Trash2, AlertTriangle, X, Calendar, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/api';
import { formatDate, sanitizeRichHtml, getCategoryIcon } from '../utils/helpers';
import { COLOR_STYLES } from '../utils/constants';
import TextEditorToolbar from './TextEditorToolbar';
import RichTextEditor from './RichTextEditor';

/**
 * AnnouncementsPanel — "Duyurular" alanı
 * --------------------------------------------------------------------------
 * Ana sayfada öne çıkanların yanında görünür. Adminler (admin + super_admin)
 * duyuru ekler/düzenler/siler; herkes görür. Acil duyurular kırmızı vurgulu.
 * Açıklama, çözüm adımlarıyla aynı zengin metin editörünü (kalın/italik/renk)
 * kullanır. Kartlara tıklanınca tam içerik detay penceresinde açılır.
 *
 * Props:
 *   isAdmin : ekle/düzenle/sil yetkisi (canManageContent)
 */

const emptyForm = { title: '', body: '', is_urgent: false, department_id: '' };

const findDept = (departments, id) =>
    id != null && id !== '' ? (departments || []).find(d => String(d.id) === String(id)) : null;

// Departman etiketi (renk/ikon departmandan). Departman yoksa "Genel".
const DeptBadge = ({ dept, className = '' }) => {
    const style = dept ? (COLOR_STYLES[dept.color] || COLOR_STYLES.slate) : COLOR_STYLES.slate;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${style.bgLight} ${style.text} ${style.borderLight} ${className}`}>
            {dept?.icon && getCategoryIcon(null, 'w-3 h-3', dept.icon)}
            {dept ? dept.name : 'Genel'}
        </span>
    );
};

const AnnouncementForm = ({ form, setForm, onSave, onCancel, saving, departments = [] }) => {
    const editorRef = useRef(null);
    const handleFormat = (type, value) => editorRef.current?.format(type, value);

    return (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-900/10 p-3 flex flex-col gap-2.5">
            <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Başlık"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Zengin metin editörü (çözüm adımlarıyla aynı) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <TextEditorToolbar onFormat={handleFormat} />
                <RichTextEditor
                    ref={editorRef}
                    className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 min-h-[5rem] max-h-[220px]"
                    placeholder="Açıklama (isteğe bağlı)…"
                    value={form.body}
                    onChange={(val) => setForm(f => ({ ...f, body: val }))}
                />
            </div>

            {/* Departman seçimi */}
            <select
                value={form.department_id ?? ''}
                onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Genel (departman yok)</option>
                {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={form.is_urgent}
                    onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-rose-500"
                />
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Acil olarak işaretle
            </label>

            <div className="flex items-center gap-2 justify-end">
                <button
                    onClick={onCancel}
                    disabled={saving}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white disabled:opacity-50"
                >
                    Vazgeç
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
};

const AnnouncementCard = ({ a, isAdmin, onView, onEdit, onDelete, onCopyLink, departments }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={() => onView(a)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(a); } }}
        className={`group relative w-full text-left rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer pl-4 pr-3 py-2.5 flex items-center gap-3 ${a.is_urgent
            ? 'bg-gradient-to-r from-rose-50 to-white dark:from-rose-900/15 dark:to-[#1e293b] border-rose-200 dark:border-rose-800/60 hover:border-rose-300 dark:hover:border-rose-700'
            : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700'}`}
    >
        {/* Sol vurgu çubuğu (hover'da kalınlaşır) */}
        <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${a.is_urgent ? 'bg-rose-500' : 'bg-blue-500'} group-hover:w-2 transition-all duration-200`} />

        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl flex-none shadow-sm ${a.is_urgent ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-500' : 'bg-blue-100 dark:bg-blue-500/15 text-blue-500'}`}>
            {a.is_urgent ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
        </span>

        <div className="flex-1 min-w-0">
            <h3 className={`text-[13px] font-bold leading-tight line-clamp-1 ${a.is_urgent ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                {a.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex-none">
                    <Calendar className="w-3 h-3" />
                    {formatDate(a.created_at)}
                </span>
                <DeptBadge dept={findDept(departments, a.department_id)} />
            </div>
        </div>

        <div className="flex-none flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onCopyLink(a.id); }} className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Linki kopyala">
                <Link2 className="w-3.5 h-3.5" />
            </button>
            {isAdmin && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(a); }} className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Düzenle">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(a.id); }} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </>
            )}
        </div>
    </div>
);

const AnnouncementDetail = ({ a, onClose, onCopyLink, departments }) => (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <span className={`absolute left-0 top-0 bottom-0 w-2 ${a.is_urgent ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                        {a.is_urgent && <AlertTriangle className="w-5 h-5 text-rose-500 flex-none mt-0.5" />}
                        <h3 className={`text-lg font-black leading-tight break-words ${a.is_urgent ? 'text-rose-600 dark:text-rose-300' : 'text-slate-800 dark:text-white'}`}>
                            {a.title}
                        </h3>
                    </div>
                    <div className="mt-2">
                        <DeptBadge dept={findDept(departments, a.department_id)} />
                    </div>
                </div>
                <div className="flex-none flex items-center gap-2">
                    <button onClick={() => onCopyLink(a.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold border border-blue-100 dark:border-blue-800 transition-all" title="Linki kopyala">
                        <Link2 className="w-4 h-4" /> <span className="hidden sm:inline">Linki Kopyala</span>
                    </button>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 hover:rotate-90 transition-all duration-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="px-6 py-5">
                {a.body ? (
                    <div
                        className="rich-content text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words font-medium"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(a.body) }}
                    />
                ) : (
                    <p className="text-sm text-slate-400 italic">Açıklama yok.</p>
                )}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(a.created_at)}
                </div>
            </div>
        </div>
    </div>
);

const AnnouncementsListModal = ({ items, onClose, onCopyLink, departments }) => (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl max-h-[88vh] bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Üst vurgu çubuğu */}
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-blue-500 rounded-b-full shadow z-10" />

            {/* Başlık */}
            <div className="relative flex items-center justify-between gap-3 px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 to-transparent dark:from-blue-900/15">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-500/15 text-blue-500 shadow-sm flex-none">
                        <Megaphone className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Tüm Duyurular</h3>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{items.length} duyuru</p>
                    </div>
                </div>
                <button onClick={onClose} className="flex-none w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500 hover:rotate-90 transition-all duration-300 shadow-sm border border-slate-100 dark:border-slate-700">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Gövde — tek sütun, alt alta liste */}
            <div className="overflow-y-auto custom-scrollbar p-6 bg-slate-50/60 dark:bg-transparent">
                <div className="flex flex-col gap-3">
                    {items.map(a => (
                        <div
                            key={a.id}
                            className={`relative rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden pl-5 pr-4 py-3.5 ${a.is_urgent
                                ? 'bg-rose-50 dark:bg-rose-900/15 border-rose-200 dark:border-rose-800/60'
                                : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700/70'}`}
                        >
                            <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${a.is_urgent ? 'bg-rose-500' : 'bg-blue-500'}`} />

                            {a.is_urgent && (
                                <div className="mb-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/15 px-2 py-0.5 rounded-full">
                                        <AlertTriangle className="w-3 h-3" /> Acil
                                    </span>
                                </div>
                            )}

                            <h4 className={`text-[15px] font-extrabold leading-snug break-words ${a.is_urgent ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                {a.title}
                            </h4>

                            {a.body && (
                                <div
                                    className="rich-content text-[13px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap break-words font-medium"
                                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(a.body) }}
                                />
                            )}

                            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <DeptBadge dept={findDept(departments, a.department_id)} />
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 flex-none">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(a.created_at)}
                                    </span>
                                </div>
                                <button onClick={() => onCopyLink(a.id)} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-none" title="Linki kopyala">
                                    <Link2 className="w-3.5 h-3.5" /> Linki kopyala
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const AnnouncementsPanel = ({ isAdmin = false, departments = [] }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null | 'new' | id
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        let alive = true;
        getAnnouncements().then(d => {
            if (!alive) return;
            const list = Array.isArray(d) ? d : [];
            setItems(list);
            setLoading(false);
            // Derin bağlantı: /?duyuru=<id> ile gelindiyse o duyuruyu aç
            try {
                const id = new URLSearchParams(window.location.search).get('duyuru');
                if (id) {
                    const found = list.find(x => String(x.id) === String(id));
                    if (found) setViewing(found);
                }
            } catch { /* yok say */ }
        });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!viewing && !showAll) return;
        const onKey = (e) => { if (e.key === 'Escape') { setViewing(null); setShowAll(false); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewing, showAll]);

    const startNew = () => { setForm(emptyForm); setEditing('new'); };
    const startEdit = (a) => { setForm({ title: a.title || '', body: a.body || '', is_urgent: !!a.is_urgent, department_id: a.department_id ?? '' }); setEditing(a.id); };
    const cancel = () => { setEditing(null); setForm(emptyForm); };

    const save = async () => {
        if (!form.title.trim()) { toast.error('Başlık zorunludur'); return; }
        setSaving(true);
        try {
            if (editing === 'new') {
                const created = await addAnnouncement(form);
                setItems(prev => [created, ...prev]);
                toast.success('Duyuru eklendi');
            } else {
                const updated = await updateAnnouncement(editing, form);
                setItems(prev => prev.map(i => i.id === editing ? updated : i));
                toast.success('Duyuru güncellendi');
            }
            cancel();
        } catch (e) {
            toast.error(e.message || 'İşlem başarısız');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
        const ok = await deleteAnnouncement(id);
        if (ok) { setItems(prev => prev.filter(i => i.id !== id)); toast.success('Duyuru silindi'); }
        else toast.error('Duyuru silinemedi');
    };

    const copyLink = (id) => {
        const url = `${window.location.origin}/?duyuru=${id}`;
        try { navigator.clipboard.writeText(url); } catch { /* yok say */ }
        toast.success('Duyuru bağlantısı kopyalandı!', { description: 'Paylaşmak için yapıştırabilirsiniz.' });
    };

    // Acil olanlar üstte, sonra en yeni (yerel düzenlemelerde de stabil kalsın).
    const sorted = [...items].sort((a, b) =>
        (Number(b.is_urgent) - Number(a.is_urgent)) ||
        (new Date(b.created_at) - new Date(a.created_at))
    );

    // Panelde en fazla 3 göster; fazlası "Tümü" pop-up'ında.
    const visible = sorted.slice(0, 3);

    return (
        <section className="animate-[fadeIn_.2s_ease-out]">
            <div className="flex items-center gap-2 mb-3 px-0.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-500">
                    <Megaphone className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                    Duyurular
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200/60 dark:from-blue-500/20 to-transparent ml-2" />
                {sorted.length > 3 && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        Tümü ({sorted.length})
                    </button>
                )}
                {isAdmin && editing === null && (
                    <button
                        onClick={startNew}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Ekle
                    </button>
                )}
            </div>

            {/* Yeni ekleme formu — listenin dışında, üstte sabit */}
            {editing === 'new' && (
                <div className="mb-2.5">
                    <AnnouncementForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} departments={departments} />
                </div>
            )}

            {/* Liste — 3+ duyuruda taşmasın diye yükseklik sınırlı + kaydırmalı */}
            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                    <div className="text-xs text-slate-400 px-1 py-4">Yükleniyor…</div>
                ) : sorted.length === 0 && editing !== 'new' ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        Henüz duyuru yok.
                    </div>
                ) : (
                    visible.map(a => editing === a.id ? (
                        <AnnouncementForm key={a.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} departments={departments} />
                    ) : (
                        <AnnouncementCard key={a.id} a={a} isAdmin={isAdmin} onView={setViewing} onEdit={startEdit} onDelete={remove} onCopyLink={copyLink} departments={departments} />
                    ))
                )}
            </div>

            {viewing && <AnnouncementDetail a={viewing} onClose={() => setViewing(null)} onCopyLink={copyLink} departments={departments} />}
            {showAll && <AnnouncementsListModal items={sorted} onClose={() => setShowAll(false)} onCopyLink={copyLink} departments={departments} />}
        </section>
    );
};

export default AnnouncementsPanel;
