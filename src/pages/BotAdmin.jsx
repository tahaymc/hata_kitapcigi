import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Bot, Save, RefreshCw, LogOut, QrCode, Power,
    Activity, AlertCircle, CheckCircle, Clock, Wifi, WifiOff,
    Image as ImageIcon, MessageSquare, Settings as SettingsIcon, ScrollText
} from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import {
    getBotSettings, updateBotSettings,
    getBotStatus, getBotQr, getBotLogs,
    restartBot, logoutBot
} from '../services/api';

const STATUS_LABEL = {
    starting: 'Başlatılıyor',
    connecting: 'Bağlanıyor',
    qr_required: 'QR kodu bekleniyor',
    connected: 'Bağlı',
    disconnected: 'Bağlantı kesildi',
    logged_out: 'Oturum kapatılmış',
    unknown: 'Bilinmiyor'
};

const STATUS_COLOR = {
    connected: 'emerald',
    qr_required: 'amber',
    starting: 'sky',
    connecting: 'sky',
    disconnected: 'rose',
    logged_out: 'rose',
    unknown: 'slate'
};

const StatusBadge = ({ status }) => {
    const c = STATUS_COLOR[status] || 'slate';
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-${c}-100 dark:bg-${c}-900/30 text-${c}-700 dark:text-${c}-300`}>
            {status === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {STATUS_LABEL[status] || status}
        </span>
    );
};

const BotAdmin = () => {
    const { isSuperAdmin, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [qr, setQr] = useState(null);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const logBoxRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            navigate('/');
        }
    }, [authLoading, isSuperAdmin, navigate]);

    const loadStatus = async () => {
        try {
            const s = await getBotStatus();
            setStatus(s);
            setStatusError(s.liveError || null);
        } catch (e) {
            setStatusError(e.message);
        }
    };

    const loadSettings = async () => {
        try {
            const s = await getBotSettings();
            setSettings(s);
        } catch (e) {
            toast.error('Ayarlar alınamadı: ' + e.message);
        }
    };

    const loadLogs = async () => {
        try {
            const r = await getBotLogs(200);
            setLogs(r.logs || []);
            requestAnimationFrame(() => {
                if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
            });
        } catch {
            // ignore
        }
    };

    const loadQr = async () => {
        try {
            const r = await getBotQr();
            setQr(r?.dataUrl || null);
        } catch {
            setQr(null);
        }
    };

    useEffect(() => {
        if (!isSuperAdmin) return;
        loadStatus();
        loadSettings();
        loadLogs();
        loadQr();
        const t = setInterval(() => {
            loadStatus();
            loadLogs();
            if (status?.live?.status === 'qr_required' || !status) loadQr();
        }, 5000);
        return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdmin, user?.id]);

    const liveStatus = status?.live?.status || status?.stored?.status || 'unknown';
    const stats = status?.live?.stats || status?.stored?.stats || {};

    const handleSettingsChange = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleListChange = (key, value) => {
        const arr = value
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        setSettings((prev) => ({ ...prev, [key]: arr }));
    };

    const handleSaveSettings = async (e) => {
        e?.preventDefault();
        if (!settings) return;
        setSavingSettings(true);
        try {
            const payload = { ...settings };
            delete payload.id;
            delete payload.updated_at;
            delete payload._missing;
            const updated = await updateBotSettings(payload);
            setSettings(updated);
            toast.success('Bot ayarları kaydedildi.');
        } catch (e) {
            toast.error('Kaydedilemedi: ' + e.message);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleRestart = async () => {
        if (!confirm('Bot yeniden başlatılsın mı?')) return;
        setActionLoading('restart');
        try {
            await restartBot();
            toast.success('Bot yeniden başlatıldı.');
            setTimeout(loadStatus, 1500);
        } catch (e) {
            toast.error('Yeniden başlatılamadı: ' + e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        if (!confirm('WhatsApp oturumu kapatılsın mı? Yeni QR kod gerekecek.')) return;
        setActionLoading('logout');
        try {
            await logoutBot();
            toast.success('Oturum kapatıldı, yeni QR oluşturuluyor.');
            setTimeout(() => { loadStatus(); loadQr(); }, 2000);
        } catch (e) {
            toast.error('Oturum kapatılamadı: ' + e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const lastHeartbeat = status?.stored?.last_heartbeat_at;
    const lastSeenText = useMemo(() => {
        if (!lastHeartbeat) return 'Hiç ulaşılamadı';
        const diff = Date.now() - new Date(lastHeartbeat).getTime();
        if (diff < 60_000) return 'Az önce';
        if (diff < 3600_000) return `${Math.floor(diff / 60_000)} dk önce`;
        if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} saat önce`;
        return new Date(lastHeartbeat).toLocaleString('tr-TR');
    }, [lastHeartbeat]);

    if (authLoading) return null;
    if (!isSuperAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-12">
            <PageTransition>
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-4 justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                <Bot className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold">WhatsApp Bot Yönetimi</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Botu izle, ayarla ve kontrol et.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                ← Ana Sayfa
                            </button>
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Admin Panel
                            </button>
                        </div>
                    </motion.div>

                    {/* Status + Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    <h2 className="font-bold text-lg">Bağlantı Durumu</h2>
                                </div>
                                <StatusBadge status={liveStatus} />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <Stat label="İşlenen Görsel" value={stats.imagesProcessed || 0} icon={<ImageIcon className="w-4 h-4" />} />
                                <Stat label="Eşleşme" value={stats.matched || 0} icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} />
                                <Stat label="Eşleşmeyen" value={stats.unmatched || 0} icon={<AlertCircle className="w-4 h-4 text-amber-500" />} />
                                <Stat label="Hata" value={stats.failed || 0} icon={<AlertCircle className="w-4 h-4 text-rose-500" />} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <Field label="Bağlı Numara" value={status?.live?.jid || status?.stored?.jid || '—'} />
                                <Field label="Son Bağlantı" value={(status?.live?.connectedAt || status?.stored?.connected_at) ? new Date(status?.live?.connectedAt || status?.stored?.connected_at).toLocaleString('tr-TR') : '—'} />
                                <Field label="Son Heartbeat" value={lastSeenText} />
                                <Field label="Son Hata" value={status?.live?.lastError || status?.stored?.last_error || '—'} mono />
                            </div>

                            {statusError && (
                                <div className="text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                                    Canlı bot bağlantısı yok: {statusError}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    onClick={handleRestart}
                                    disabled={actionLoading === 'restart'}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                                    Yeniden Başlat
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={actionLoading === 'logout'}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Oturumu Kapat
                                </button>
                                <button
                                    onClick={() => { loadStatus(); loadQr(); loadLogs(); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-bold rounded-xl"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Yenile
                                </button>
                            </div>
                        </div>

                        {/* QR */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <QrCode className="w-5 h-5 text-blue-600" />
                                <h2 className="font-bold text-lg">QR Kod</h2>
                            </div>
                            {qr ? (
                                <img src={qr} alt="WhatsApp QR" className="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500 py-12">
                                    <Power className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                    {liveStatus === 'connected'
                                        ? 'Bot bağlı, QR gerekmiyor.'
                                        : 'QR kodu hazır olduğunda burada görünecek.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    {settings && (
                        <motion.form
                            onSubmit={handleSaveSettings}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-6"
                        >
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <SettingsIcon className="w-5 h-5 text-blue-600" />
                                    <h2 className="font-bold text-lg">Bot Ayarları</h2>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                                </button>
                            </div>

                            {settings._missing && (
                                <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs">
                                    bot_settings tablosu henüz oluşturulmamış. Aşağıda kaydet'e basıldığında oluşturulacak.
                                    SQL şeması için: <code>bot/sql/bot_settings.sql</code>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Toggles */}
                                <div className="space-y-3">
                                    <Toggle label="Bot etkin" checked={settings.enabled} onChange={(v) => handleSettingsChange('enabled', v)} />
                                    <Toggle label="Grup mesajlarını dinle" checked={settings.listen_groups} onChange={(v) => handleSettingsChange('listen_groups', v)} />
                                    <Toggle label="Detaylı adımları gönder" checked={settings.reply_with_steps} onChange={(v) => handleSettingsChange('reply_with_steps', v)} />
                                    <Toggle label="Görselleri gönder" checked={settings.reply_with_images} onChange={(v) => handleSettingsChange('reply_with_images', v)} />
                                    <Toggle label="Video linkini gönder" checked={settings.reply_with_video} onChange={(v) => handleSettingsChange('reply_with_video', v)} />
                                </div>

                                {/* Numerics */}
                                <div className="space-y-3">
                                    <NumberInput
                                        label="OCR güven eşiği (%)"
                                        value={settings.confidence_threshold}
                                        onChange={(v) => handleSettingsChange('confidence_threshold', v)}
                                        min={0} max={100}
                                    />
                                    <NumberInput
                                        label="Eşleşme skoru eşiği (0-180)"
                                        value={settings.match_score_threshold}
                                        onChange={(v) => handleSettingsChange('match_score_threshold', v)}
                                        min={0} max={180}
                                    />
                                    <TextInput
                                        label="OCR dilleri (Tesseract)"
                                        value={settings.ocr_languages}
                                        onChange={(v) => handleSettingsChange('ocr_languages', v)}
                                        placeholder="eng+tur"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <TextArea
                                    label="Eşleşme bulunamadı mesajı"
                                    value={settings.fallback_message}
                                    onChange={(v) => handleSettingsChange('fallback_message', v)}
                                    rows={4}
                                />
                                <TextArea
                                    label="Hata mesajı"
                                    value={settings.error_message}
                                    onChange={(v) => handleSettingsChange('error_message', v)}
                                    rows={4}
                                />
                                <TextArea
                                    label="Devre dışı mesajı"
                                    value={settings.disabled_message}
                                    onChange={(v) => handleSettingsChange('disabled_message', v)}
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <TextArea
                                    label="İzin verilen numara prefiksleri (her satıra bir tane veya virgülle)"
                                    value={(settings.allowlist || []).join('\n')}
                                    onChange={(v) => handleListChange('allowlist', v)}
                                    rows={4}
                                    placeholder="905..."
                                />
                                <TextArea
                                    label="Engellenen numara prefiksleri"
                                    value={(settings.blocklist || []).join('\n')}
                                    onChange={(v) => handleListChange('blocklist', v)}
                                    rows={4}
                                />
                            </div>
                        </motion.form>
                    )}

                    {/* Logs */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <ScrollText className="w-5 h-5 text-blue-600" />
                                <h2 className="font-bold text-lg">Canlı Loglar</h2>
                            </div>
                            <span className="text-xs text-slate-500"><Clock className="w-3 h-3 inline" /> 5sn'de bir yenilenir</span>
                        </div>
                        <div
                            ref={logBoxRef}
                            className="h-72 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 whitespace-pre-wrap"
                        >
                            {logs.length === 0 ? (
                                <div className="text-slate-500">Henüz log yok…</div>
                            ) : (
                                logs.map((line, i) => <div key={i}>{line}</div>)
                            )}
                        </div>
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

const Stat = ({ label, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            {icon}{label}
        </div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

const Field = ({ label, value, mono }) => (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className={`text-sm ${mono ? 'font-mono break-all' : ''}`}>{value || '—'}</div>
    </div>
);

const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/40">
        <span className="text-sm font-medium">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </label>
);

const NumberInput = ({ label, value, onChange, min, max }) => (
    <label className="block">
        <span className="text-sm font-medium block mb-1">{label}</span>
        <input
            type="number"
            value={value ?? ''}
            min={min}
            max={max}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
    </label>
);

const TextInput = ({ label, value, onChange, placeholder }) => (
    <label className="block">
        <span className="text-sm font-medium block mb-1">{label}</span>
        <input
            type="text"
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
    </label>
);

const TextArea = ({ label, value, onChange, rows = 3, placeholder }) => (
    <label className="block">
        <span className="text-sm font-medium block mb-1">{label}</span>
        <textarea
            value={value ?? ''}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
    </label>
);

export default BotAdmin;
