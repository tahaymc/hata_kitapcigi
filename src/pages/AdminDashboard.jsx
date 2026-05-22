import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { UserPlus, User, Mail, Lock, Shield, ArrowLeft, Users, Trash2 } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import PeopleManagerModal from '../components/PeopleManagerModal';
import { useAuth } from '../context/AuthContext';
import { createUser, getUsers, updateUserRole, deleteUser } from '../services/api';

const AdminDashboard = () => {
    const { isAdmin, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user'
    });
    const [formLoading, setFormLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [busyuserId, setBusyUserId] = useState(null);
    const [isPeopleOpen, setIsPeopleOpen] = useState(false);

    // Yetki koruması: yönetici değilse ana sayfaya yönlendir
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/');
        }
    }, [authLoading, isAdmin, navigate]);

    const loadUsers = async () => {
        try {
            setUsersLoading(true);
            const list = await getUsers();
            setUsers(list);
        } catch (err) {
            toast.error(err.message || 'Kullanıcılar alınamadı');
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            await createUser(formData);
            toast.success('Kullanıcı başarıyla oluşturuldu.');
            setFormData({ email: '', password: '', name: '', role: 'user' });
            loadUsers();
        } catch (err) {
            toast.error(err.message || 'Bir hata oluştu');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRoleChange = async (u, newRole) => {
        setBusyUserId(u.id);
        try {
            await updateUserRole(u.id, newRole);
            toast.success(`${u.name || u.email} rolü güncellendi.`);
            setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role: newRole, access_role: newRole } : p));
        } catch (err) {
            toast.error(err.message || 'Rol güncellenemedi');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleDeleteUser = async (u) => {
        if (!window.confirm(`${u.name || u.email} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
        setBusyUserId(u.id);
        try {
            await deleteUser(u.id);
            toast.success('Kullanıcı silindi.');
            setUsers(prev => prev.filter(p => p.id !== u.id));
        } catch (err) {
            toast.error(err.message || 'Kullanıcı silinemedi');
        } finally {
            setBusyUserId(null);
        }
    };

    if (authLoading || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-12 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
            <PageTransition>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-10"
                    >
                        <button
                            onClick={() => navigate('/')}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"
                            title="Ana sayfaya dön"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Yönetici Paneli</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Kullanıcı ve yetki yönetimi</p>
                        </div>

                        <button
                            onClick={() => setIsPeopleOpen(true)}
                            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md transition-all"
                        >
                            <Users className="w-4 h-4" />
                            <span>Ekip Yönetimi</span>
                        </button>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Kullanıcı Oluşturma Formu */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="lg:col-span-5"
                        >
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-8">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 backdrop-blur-sm">
                                    <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Yeni Kullanıcı Ekle
                                    </h2>
                                </div>

                                <div className="p-6 space-y-6">
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Ad Soyad</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                    placeholder="Örn: Ahmet Yılmaz"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">E-posta Adresi</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                    placeholder="ornek@sirket.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Şifre</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="password"
                                                    required
                                                    minLength={6}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Rol</label>
                                            <div className="relative">
                                                <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                <select
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                >
                                                    <option value="user">Kullanıcı (sadece içerik)</option>
                                                    <option value="admin">Yönetici (panel + bot)</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {formLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    <span>Kullanıcı Oluştur</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>

                        {/* Kullanıcı Listesi & Yetki Yönetimi */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="lg:col-span-7"
                        >
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-between">
                                    <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        Kullanıcılar & Yetkiler
                                    </h2>
                                    <span className="text-xs font-bold text-slate-400">{users.length} kayıt</span>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {usersLoading ? (
                                        <div className="p-10 flex justify-center">
                                            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="p-10 text-center text-sm text-slate-400">Henüz kullanıcı yok.</div>
                                    ) : (
                                        users.map((u) => {
                                            const isSelf = u.auth_id === user?.id;
                                            const role = (u.access_role === 'admin' || u.role === 'admin') ? 'admin' : 'user';
                                            const busy = busyuserId === u.id;
                                            return (
                                                <div key={u.id} className="flex items-center gap-4 p-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                            {u.name || '—'}
                                                            {isSelf && <span className="ml-2 text-[10px] font-bold text-blue-500 uppercase">(siz)</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                                                    </div>

                                                    <select
                                                        value={role}
                                                        disabled={isSelf || busy}
                                                        onChange={(e) => handleRoleChange(u, e.target.value)}
                                                        className="px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={isSelf ? 'Kendi rolünüzü değiştiremezsiniz' : 'Rolü değiştir'}
                                                    >
                                                        <option value="user">Kullanıcı</option>
                                                        <option value="admin">Yönetici</option>
                                                    </select>

                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        disabled={isSelf || busy}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                        title={isSelf ? 'Kendinizi silemezsiniz' : 'Kullanıcıyı sil'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </PageTransition>

            {isPeopleOpen && (
                <PeopleManagerModal onClose={() => setIsPeopleOpen(false)} />
            )}
        </div>
    );
};

export default AdminDashboard;
