import React, { useState, useEffect } from 'react';
import {
    X, Plus, Edit2, Trash2, Save, User, UserCheck, Briefcase,
    ShoppingCart, Archive, Monitor, Settings, Tag, Truck, Wifi,
    Printer, CreditCard, Smartphone, Package, AlertTriangle,
    HelpCircle, Database, Zap, Thermometer, BookOpen, Shield
} from 'lucide-react';

const ICON_OPTIONS = {
    shoppingCart: ShoppingCart,
    archive: Archive,
    monitor: Monitor,
    settings: Settings,
    tag: Tag,
    truck: Truck,
    wifi: Wifi,
    printer: Printer,
    creditCard: CreditCard,
    smartphone: Smartphone,
    package: Package,
    alertTriangle: AlertTriangle,
    helpCircle: HelpCircle,
    database: Database,
    zap: Zap,
    thermometer: Thermometer,
    bookOpen: BookOpen,
    shield: Shield
};

const COLOR_STYLES = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const PeopleManagerModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('people'); // 'people' or 'departments'
    const [people, setPeople] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [departmentFormData, setDepartmentFormData] = useState({ name: '', color: 'blue', icon: 'settings' });
    const [personFormData, setPersonFormData] = useState({ name: '', role: '', department_id: '', color: 'blue' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [peopleRes, departmentsRes] = await Promise.all([
                fetch('/api/people'),
                fetch('/api/departments')
            ]);

            if (peopleRes.ok) setPeople(await peopleRes.json());
            if (departmentsRes.ok) setDepartments(await departmentsRes.json());
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Department Handlers ---
    const handleDepartmentSubmit = async (e) => {
        e.preventDefault();
        if (!departmentFormData.name.trim()) return;

        try {
            if (editingId) {
                const res = await fetch(`/api/departments/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(departmentFormData)
                });
                if (res.ok) {
                    const updated = await res.json();
                    setDepartments(departments.map(d => d.id === editingId ? updated : d));
                    resetDepartmentForm();
                }
            } else {
                const res = await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(departmentFormData)
                });
                if (res.ok) {
                    const created = await res.json();
                    setDepartments([...departments, created]);
                    resetDepartmentForm();
                }
            }
        } catch (error) {
            console.error("Error saving department:", error);
        }
    };

    const deleteDepartment = async (id) => {
        if (!window.confirm("Bu departmanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        try {
            const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDepartments(departments.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error("Error deleting department:", error);
        }
    };

    const startEditDepartment = (dept) => {
        setEditingId(dept.id);
        setDepartmentFormData({ name: dept.name, color: dept.color, icon: dept.icon || 'settings' });
    };

    const resetDepartmentForm = () => {
        setEditingId(null);
        setDepartmentFormData({ name: '', color: 'blue', icon: 'settings' });
    };

    // --- Person Handlers ---
    const handlePersonSubmit = async (e) => {
        e.preventDefault();
        if (!personFormData.name.trim()) return;

        // If a department is selected, use its color
        let finalColor = personFormData.color;
        if (personFormData.department_id) {
            const selectedDept = departments.find(d => d.id.toString() === personFormData.department_id.toString());
            if (selectedDept) {
                finalColor = selectedDept.color;
            }
        }

        const payload = { ...personFormData, color: finalColor };

        try {
            if (editingId) {
                const res = await fetch(`/api/people/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const updated = await res.json();
                    // Manually inject department object for optimistic update (or re-fetch)
                    if (payload.department_id) {
                        const dept = departments.find(d => d.id.toString() === payload.department_id.toString());
                        updated.department = dept;
                    }
                    setPeople(people.map(p => p.id === editingId ? updated : p));
                    resetPersonForm();
                }
            } else {
                const res = await fetch('/api/people', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const created = await res.json();
                    if (payload.department_id) {
                        const dept = departments.find(d => d.id.toString() === payload.department_id.toString());
                        created.department = dept;
                    }
                    setPeople([...people, created]);
                    resetPersonForm();
                }
            }
        } catch (error) {
            console.error("Error saving person:", error);
        }
    };

    const deletePerson = async (id) => {
        if (!window.confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPeople(people.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Error deleting person:", error);
        }
    };

    const startEditPerson = (person) => {
        setEditingId(person.id);
        setPersonFormData({
            name: person.name,
            role: person.role || '',
            department_id: person.department_id || '',
            color: person.color || 'blue'
        });
    };

    const resetPersonForm = () => {
        setEditingId(null);
        setPersonFormData({ name: '', role: '', department_id: '', color: 'blue' });
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ekip Yönetimi</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Personel ve departmanları yönetin</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => { setActiveTab('people'); setEditingId(null); }}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'people' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Personel Listesi
                    </button>
                    <button
                        onClick={() => { setActiveTab('departments'); setEditingId(null); }}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'departments' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Departmanlar
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {activeTab === 'departments' ? (
                        <>
                            {/* Department Form */}
                            <form onSubmit={handleDepartmentSubmit} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    {editingId ? <Edit2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-blue-500" />}
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {editingId ? 'Departmanı Düzenle' : 'Yeni Departman Ekle'}
                                    </h3>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Departman Adı</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Örn: Bilgi İşlem"
                                        value={departmentFormData.name}
                                        onChange={e => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 ml-1">Departman İkonu</label>
                                    <div className="grid grid-cols-6 gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-32 overflow-y-auto custom-scrollbar">
                                        {Object.entries(ICON_OPTIONS).map(([key, IconComponent]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setDepartmentFormData({ ...departmentFormData, icon: key })}
                                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${departmentFormData.icon === key
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                title={key}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 ml-1">Departman Rengi</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.keys(COLOR_STYLES).map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setDepartmentFormData({ ...departmentFormData, color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform ${COLOR_STYLES[color].split(' ')[0]} ${departmentFormData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110 border-white dark:border-slate-900' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    {editingId && (
                                        <button type="button" onClick={resetDepartmentForm} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                                    )}
                                    <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5">
                                        <Save className="w-3.5 h-3.5" /> {editingId ? 'Güncelle' : 'Ekle'}
                                    </button>
                                </div>
                            </form>

                            {/* Department List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Kayıtlı Departmanlar ({departments.length})</h3>
                                <div className="grid gap-2">
                                    {departments.map(dept => {
                                        const IconComponent = ICON_OPTIONS[dept.icon] || Briefcase;
                                        return (
                                            <div key={dept.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-xl hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${COLOR_STYLES[dept.color || 'blue']}`}>
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{dept.name}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => startEditDepartment(dept)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteDepartment(dept.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Person Form */}
                            <form onSubmit={handlePersonSubmit} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    {editingId ? <Edit2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-blue-500" />}
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {editingId ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Ad Soyad</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Örn: Ahmet Yılmaz"
                                            value={personFormData.name}
                                            onChange={e => setPersonFormData({ ...personFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Ünvan / Rol</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Örn: Mağaza Müdürü"
                                            value={personFormData.role}
                                            onChange={e => setPersonFormData({ ...personFormData, role: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Departman</label>
                                    <select
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={personFormData.department_id}
                                        onChange={e => setPersonFormData({ ...personFormData, department_id: e.target.value })}
                                    >
                                        <option value="">Departman Seçiniz...</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">* Departman seçildiğinde, departmanın rengi otomatik uygulanır.</p>
                                </div>

                                {!personFormData.department_id && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 ml-1">Renk Seçimi</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.keys(COLOR_STYLES).map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setPersonFormData({ ...personFormData, color })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${COLOR_STYLES[color].split(' ')[0]} ${personFormData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 border-white' : 'border-transparent hover:scale-110 opacity-70'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    {editingId && (
                                        <button type="button" onClick={resetPersonForm} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                                    )}
                                    <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5">
                                        <Save className="w-3.5 h-3.5" /> {editingId ? 'Güncelle' : 'Ekle'}
                                    </button>
                                </div>
                            </form>

                            {/* People List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Kayıtlı Personel ({people.length})</h3>
                                <div className="grid gap-2">
                                    {people.map(person => (
                                        <div key={person.id} className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-xl hover:shadow-sm transition-all hover:border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${COLOR_STYLES[person.department ? person.department.color : (person.color || 'slate')]} border`}>
                                                    {person.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{person.name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {person.role || 'Personel'}
                                                        {person.department && <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-${person.department.color}-100 text-${person.department.color}-700 border border-${person.department.color}-200`}>{person.department.name}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditPerson(person)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => deletePerson(person.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PeopleManagerModal;
