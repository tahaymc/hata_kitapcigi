import { toast } from 'sonner';
import PageTransition from '../components/ui/PageTransition';

// ... (existing imports)

const AdminDashboard = () => {
    const { isAdmin, isSuperAdmin, userDepartmentId } = useAuth();
    const navigate = useNavigate();

    // Form State (removed 'message' state)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user',
        department_id: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    // ... (existing useEffects)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            await createUser(formData);
            toast.success('Kullanıcı başarıyla oluşturuldu.');
            setFormData({ email: '', password: '', name: '', role: 'user', department_id: '' });
            loadData(); // Refresh list
        } catch (err) {
            toast.error(err.message || 'Bir hata oluştu');
        } finally {
            setFormLoading(false);
        }
    };

    // ... (existing loading/auth checks)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 lg:p-12 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
            <PageTransition>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        // ... (keep creating existing structure, simplified for brevity here, tool handles context)
                        className="flex items-center gap-4 mb-10"
                    >
                        {/* ... header content ... */}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form Section - Only for Super Admins */}
                        {isSuperAdmin && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="lg:col-span-4"
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
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Rol</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                        <select
                                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
                                                            value={formData.role}
                                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                        >
                                                            <option value="user">Kullanıcı</option>
                                                            <option value="admin">Yönetici</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Departman</label>
                                                    {/* Using simplified select for now since DepartmentSelect component is assumed available or HTML select */}
                                                    <select
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
                                                        value={formData.department_id}
                                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {departments.map((dept) => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </option>
                                                        ))}
                                                    </select>
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
                        )}

                        {/* ... User List Section ... */}
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default AdminDashboard;
