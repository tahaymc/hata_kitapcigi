import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useErrors from '../hooks/useErrors';
import useGuides from '../hooks/useGuides';
import {
    getCategories,
    getDepartments,
    getAllErrors,
    incrementViewCount,
    resetViewCount,
    addError,
    updateError,
    deleteError,
    reorderErrors,
    deleteGuide,
    addGuide,
    updateGuide,
    addCategory,
    updateCategory,
    deleteCategory,
    incrementGuideViewCount,
    resetGuideViewCount,
    reorderGuides
} from '../services/api';

import { COLOR_STYLES } from '../utils/constants';
import { arrayMove } from '@dnd-kit/sortable';
import { Calendar, X, LayoutGrid } from 'lucide-react';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ErrorGrid from '../components/ErrorGrid';
import GuideGrid from '../components/GuideGrid';
import DepartmentBar from '../components/DepartmentBar';
import FavoritesBar from '../components/FavoritesBar';
import HighlightsBar from '../components/HighlightsBar';
import AnnouncementsPanel from '../components/AnnouncementsPanel';
import useFavorites from '../hooks/useFavorites';
import { getCategoryIcon, formatDisplayDate } from '../utils/helpers';
import ErrorDetailModal from '../components/ErrorDetailModal';
import PageTransition from '../components/ui/PageTransition';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const importAddErrorModal = () => import('../components/AddErrorModal');
const importEditErrorModal = () => import('../components/EditErrorModal');
const importAddGuideModal = () => import('../components/AddGuideModal');
const importEditGuideModal = () => import('../components/EditGuideModal');

const AddErrorModal = React.lazy(importAddErrorModal);
const EditErrorModal = React.lazy(importEditErrorModal);
const AddGuideModal = React.lazy(importAddGuideModal);
const EditGuideModal = React.lazy(importEditGuideModal);

const HomePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);

    const { errors, allErrors, loading: errorsLoading, filters: errorFilters, setFilters: setErrorFilters, addLocalError, updateLocalError, setLocalErrors, removeLocalError } = useErrors();
    const { guides, allGuides, loading: guidesLoading, filters: guideFilters, setFilters: setGuideFilters, addLocalGuide, updateLocalGuide, removeLocalGuide, setLocalGuides } = useGuides();

    const [activeTab, setActiveTab] = useState('errors');

    const { isFavorite, toggle: toggleFavorite, reorder: reorderFavorites, favoriteIds } = useFavorites(activeTab);

    // Şeritte yalnız görünür favoriler sürüklenir; görünmeyen favorilerin
    // (aktif filtre dışı kalanların) sırasını koruyarak tam listeye birleştir.
    const handleReorderFavorites = (visibleOrderedIds) => {
        const visibleSet = new Set(visibleOrderedIds.map(String));
        let vi = 0;
        const merged = favoriteIds.map(id =>
            visibleSet.has(String(id)) ? visibleOrderedIds[vi++] : id
        );
        reorderFavorites(merged);
    };

    const errorsActive = activeTab === 'errors';
    const filters = errorsActive ? errorFilters : guideFilters;
    const setFilters = errorsActive ? setErrorFilters : setGuideFilters;
    const loading = errorsActive ? errorsLoading : guidesLoading;

    const searchTerm = filters.query;
    const selectedCategory = filters.category;

    const setSelectedCategory = (cat) => setFilters(prev => ({ ...prev, category: cat }));
    const setSearchTerm = (term) => setFilters(prev => ({ ...prev, query: term }));
    const selectedDate = filters.date;
    const setSelectedDate = (date) => setFilters(prev => ({ ...prev, date: date }));

    const [selectedError, setSelectedError] = useState(null);
    const [previewGallery, setPreviewGallery] = useState(null);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    const { canManageContent, profile, signIn, signOut, changePassword } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddGuideModalOpen, setIsAddGuideModalOpen] = useState(false);

    const [editingError, setEditingError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditGuideModalOpen, setIsEditGuideModalOpen] = useState(false);

    useEffect(() => {
        setSelectedCategory(null);
    }, [activeTab]);

    useEffect(() => {
        if (!id) {
            setSelectedError(null);
            return;
        }
        const isGuidePath = window.location.pathname.startsWith('/guide');
        const targetList = isGuidePath ? guides : errors;
        if (targetList.length > 0) {
            const item = targetList.find(i => String(i.id) === String(id));
            if (item) {
                if (isGuidePath) {
                    setSelectedError({ ...item, type: 'guide', date: item.created_at, solutionSteps: item.steps, solutionType: 'steps' });
                } else {
                    setSelectedError(item);
                }
            }
        }
    }, [id, errors, guides]);

    const handleAddCategory = async (name, color, icon, departmentId) => {
        try {
            const newCat = await addCategory({ name, color, icon, type: activeTab, department_id: departmentId ? Number(departmentId) : null });
            setCategories(prev => [...prev, newCat]);
            showToast('Kategori başarıyla eklendi', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast('Kategori eklenemedi', 'error');
            return false;
        }
    };

    const handleUpdateCategory = async (id, name, color, icon, departmentId) => {
        try {
            const updatedCat = await updateCategory(id, { name, color, icon, type: activeTab, department_id: departmentId ? Number(departmentId) : null });
            setCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
            showToast('Kategori güncellendi', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast('Kategori güncellenemedi', 'error');
            return false;
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            if (selectedCategory === id) setSelectedCategory(null);
            showToast('Kategori silindi', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast('Kategori silinemedi', 'error');
            return false;
        }
    };

    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

    const showToast = (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
    };

    useEffect(() => {
        if (isAddModalOpen || isLoginModalOpen || isEditModalOpen || isEditGuideModalOpen || selectedError || isCredentialsModalOpen || previewGallery) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isAddModalOpen, isLoginModalOpen, isEditModalOpen, isEditGuideModalOpen, selectedError, isCredentialsModalOpen, previewGallery]);

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    useEffect(() => { getCategories().then(setCategories); }, []);
    useEffect(() => { getDepartments().then(setDepartments); }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsCredentialsModalOpen(false);
                setPreviewGallery(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCredentialsModalOpen]);

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedError(null);
    };
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setSelectedError(null);
    };
    const handleCodeClick = (code) => {
        setSearchTerm(searchTerm === code ? '' : code);
        setSelectedError(null);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signIn(loginData.email.trim(), loginData.password.trim());
            setIsLoginModalOpen(false);
            setLoginData({ email: '', password: '' });
            toast.success("Giriş başarılı!");
        } catch (error) {
            console.error("Login failed:", error);
            toast.error(error?.message || "Hatalı e-posta veya şifre!");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Yeni şifreler eşleşmiyor!");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("Yeni şifre en az 6 karakter olmalıdır!");
            return;
        }
        try {
            await changePassword(passwordForm.newPassword);
            setIsCredentialsModalOpen(false);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            toast.success("Şifreniz başarıyla güncellendi!");
        } catch (error) {
            console.error("Password change failed:", error);
            toast.error(error?.message || "Şifre güncellenemedi.");
        }
    };

    const handleLogout = async () => {
        try { await signOut(); } catch (error) { console.error("Logout failed:", error); }
    };

    const handleAddSuccess = (newError) => addLocalError(newError);
    const handleAddGuideSuccess = (newGuide) => {
        addLocalGuide(newGuide);
        showToast('Eğitim başarıyla eklendi', 'success');
    };
    const handleEditSuccess = (updatedError) => {
        updateLocalError(updatedError);
        setEditingError(null);
    };
    const handleEditGuideSuccess = (updatedGuide) => {
        updateLocalGuide(updatedGuide);
        setEditingError(null);
        setIsEditGuideModalOpen(false);
    };

    const handleDeleteClick = async (e, id) => {
        if (e) e.stopPropagation();
        if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            if (activeTab === 'errors') { await deleteError(id); removeLocalError(id); }
            else { await deleteGuide(id); removeLocalGuide(id); }
            setSelectedError(null);
        }
    };

    const handleEditClick = (e, error) => {
        if (e) e.stopPropagation();
        setEditingError(error);
        setIsEditModalOpen(true);
    };
    const handleEditGuideClick = (e, guide) => {
        if (e) e.stopPropagation();
        setEditingError(guide);
        setIsEditGuideModalOpen(true);
    };

    // Arama önerisinden seçim: aktif moda göre hata/eğitim detayını açar
    // (kart tıklamasıyla aynı davranış).
    const handleSuggestionSelect = (item) => {
        if (errorsActive) handleCardClick(item);
        else navigate(`/guide/${item.id}`);
    };

    const handleCardClick = (error) => {
        navigate(`/error/${error.id}`);
        incrementViewCount(error.id).then(updatedError => {
            if (updatedError) {
                const mergedError = { ...error, ...updatedError };
                updateLocalError(mergedError);
                setSelectedError(current => current?.id === error.id ? mergedError : current);
            }
        }).catch(err => console.error("Failed to increment view count", err));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = errors.findIndex((e) => e.id === active.id);
            const newIndex = errors.findIndex((e) => e.id === over.id);
            const newErrors = arrayMove(errors, oldIndex, newIndex);
            setLocalErrors(newErrors);
            reorderErrors(newErrors.map(e => e.id)).catch(err => {
                console.error('Reorder persistence failed:', err);
                showToast('Sıralama kaydedilirken hata oluştu', 'error');
            });
        }
    };

    const errorCategories = categories.filter(c => c.type === 'errors' || !c.type);
    const guideCategories = categories.filter(c => c.type === 'guides');

    const favoriteItems = useMemo(() => {
        const src = activeTab === 'errors' ? errors : guides;
        const byId = new Map(src.map(x => [String(x.id), x]));
        return favoriteIds.map(id => byId.get(String(id))).filter(Boolean);
    }, [activeTab, errors, guides, favoriteIds]);

    const categoryCounts = useMemo(() => {
        const src = activeTab === 'errors' ? errors : guides;
        const map = {};
        for (const item of src) {
            const cid = item.category;
            if (cid == null) continue;
            map[cid] = (map[cid] || 0) + 1;
        }
        return map;
    }, [activeTab, errors, guides]);

    const handleGuideDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = guides.findIndex((g) => g.id === active.id);
            const newIndex = guides.findIndex((g) => g.id === over.id);
            const newGuides = arrayMove(guides, oldIndex, newIndex);
            setLocalGuides(newGuides);
            reorderGuides(newGuides.map(g => g.id)).catch(err => {
                console.error('Reorder persistence failed:', err);
                showToast('Sıralama kaydedilirken hata oluştu', 'error');
            });
        }
    };

    const handleResetGuideView = async (e, guide) => {
        if (e) e.stopPropagation();
        if (window.confirm('Görüntülenme sayısını sıfırlamak istediğinize emin misiniz?')) {
            await resetGuideViewCount(guide.id);
            updateLocalGuide({ ...guide, viewCount: 0, view_count: 0 });
            showToast('Görüntülenme sayısı sıfırlandı.', 'success');
        }
    };

    const handleDeleteGuideClick = async (e, id) => {
        if (e) e.stopPropagation();
        if (window.confirm('Bu eğitimi silmek istediğinize emin misiniz?')) {
            await deleteGuide(id);
            removeLocalGuide(id);
            showToast('Eğitim başarıyla silindi', 'success');
            setSelectedError(null);
        }
    };

    const handleImageClick = (guide) => {
        if (!guide) return;
        const items = [];
        if (guide.videoUrl || guide.video_url) items.push({ type: 'video', url: guide.videoUrl || guide.video_url });
        const imgs = guide.image_urls || (guide.image_url ? [guide.image_url] : []);
        imgs.forEach(url => items.push({ type: 'image', url }));
        if (items.length > 0) setPreviewGallery({ items, index: 0 });
    };

    return (
        <React.Suspense fallback={<div className="fixed inset-0 bg-white/50 dark:bg-slate-900/50 z-[200]" />}>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
                <PageTransition>
                    <Header
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        isAdmin={canManageContent}
                        onLoginClick={() => setIsLoginModalOpen(true)}
                        onLogoutClick={handleLogout}
                        onAddClick={() => activeTab === 'errors' ? setIsAddModalOpen(true) : setIsAddGuideModalOpen(true)}
                        onCredentialsClick={() => setIsCredentialsModalOpen(true)}
                        onLogoClick={() => { setFilters({ query: '', category: null, date: null }); navigate('/'); }}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        searchProps={{
                            searchTerm,
                            setSearchTerm,
                            placeholder: activeTab === 'errors' ? "Hata kodu, başlık veya anahtar kelime..." : "Eğitim başlığı veya içeriğinde ara...",
                            items: errorsActive ? allErrors : allGuides,
                            onSelect: handleSuggestionSelect
                        }}
                    />

                    {/* ÜST YATAY DEPARTMAN BANDI (modül seçici + departmanlar tek satırda) */}
                    <DepartmentBar
                        categories={categories}
                        departments={departments}
                        selectedCategory={selectedCategory}
                        onSelectCategory={handleCategoryClick}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        counts={categoryCounts}
                    />

                    {/* Ana içerik — tam genişlik */}
                    <main className="max-w-[1920px] mx-auto w-full px-6 py-6">
                        <div className="md:hidden mb-5">
                            <SearchBar
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                placeholder={activeTab === 'errors' ? "Hata çözümü veya anahtar kelime..." : "Eğitimlerde ara..."}
                                className="shadow-sm"
                                items={errorsActive ? allErrors : allGuides}
                                onSelect={handleSuggestionSelect}
                            />
                        </div>

                        <FavoritesBar
                            items={favoriteItems}
                            categories={categories}
                            kind={activeTab}
                            onCardClick={(item) => activeTab === 'errors' ? handleCardClick(item) : navigate(`/guide/${item.id}`)}
                            onUnfavorite={(id) => toggleFavorite(id)}
                            onReorder={handleReorderFavorites}
                        />

                        {/* Öne çıkanlar (en çok görüntülenen + yeni eklenenler) ve Duyurular.
                            Yalnızca filtresiz ana görünümde gösterilir. */}
                        {!searchTerm && !selectedCategory && !selectedDate && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start">
                                <div className="lg:col-span-2">
                                    <HighlightsBar
                                        items={errorsActive ? allErrors : allGuides}
                                        categories={categories}
                                        kind={activeTab}
                                        onCardClick={(item) => {
                                            if (activeTab === 'errors') {
                                                handleCardClick(item);
                                            } else {
                                                navigate(`/guide/${item.id}`);
                                                incrementGuideViewCount(item.id).then(u => { if (u) updateLocalGuide({ ...item, ...u }); });
                                            }
                                        }}
                                    />
                                </div>
                                <AnnouncementsPanel isAdmin={canManageContent} departments={departments} />
                            </div>
                        )}

                        {/* Öne çıkanlar ile tüm liste arasında estetik ayraç başlığı.
                            Yalnızca filtresiz ana görünümde (öne çıkanlar görünürken) gösterilir. */}
                        {!searchTerm && !selectedCategory && !selectedDate && (
                            <div className="flex items-center gap-4 mt-10 mb-6">
                                <div className="flex items-center gap-2.5 flex-none">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                        <LayoutGrid className="w-4 h-4" />
                                    </span>
                                    <h2 className="text-base font-extrabold text-slate-700 dark:text-slate-200 tracking-tight whitespace-nowrap">
                                        {activeTab === 'errors' ? 'Tüm Çözümler' : 'Tüm Eğitimler'}
                                    </h2>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                            </div>
                        )}

                        {selectedDate && (
                            <div className="flex items-center justify-end mb-6">
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all group"
                                >
                                    <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="hidden sm:inline">{new Date(selectedDate).toLocaleDateString('tr-TR')}</span>
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center ml-1 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 group-hover:text-red-500 transition-colors">
                                        <X className="w-3 h-3" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {activeTab === 'errors' ? (
                            <ErrorGrid
                                errors={errors}
                                categories={categories}
                                selectedDate={selectedDate}
                                onCardClick={handleCardClick}
                                onCategoryClick={handleCategoryClick}
                                onDateClick={handleDateClick}
                                onCodeClick={handleCodeClick}
                                onEditClick={handleEditClick}
                                onDeleteClick={handleDeleteClick}
                                onResetViewClick={async (e, error) => {
                                    if (e) e.stopPropagation();
                                    if (window.confirm('Görüntülenme sayısını sıfırlamak istediğinize emin misiniz?')) {
                                        await resetViewCount(error.id);
                                        updateLocalError({ ...error, viewCount: 0, view_count: 0 });
                                        showToast('Görüntülenme sayısı sıfırlandı.', 'success');
                                    }
                                }}
                                onImageClick={(error) => {
                                    const items = [];
                                    if (error.videoUrl || error.video_url) items.push({ type: 'video', url: error.videoUrl || error.video_url });
                                    const imgs = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                    imgs.forEach(url => items.push({ type: 'image', url }));
                                    if (items.length > 0) setPreviewGallery({ items, index: 0 });
                                }}
                                isAdmin={canManageContent}
                                onDragEnd={handleDragEnd}
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                            />
                        ) : (
                            <GuideGrid
                                guides={guides}
                                categories={categories}
                                selectedDate={selectedDate}
                                onCardClick={(guide) => {
                                    navigate(`/guide/${guide.id}`);
                                    incrementGuideViewCount(guide.id).then(updatedGuide => {
                                        if (updatedGuide) {
                                            // View endpoint'i assignees döndürmüyor; mevcut
                                            // guide ile merge ederek ilgili personeli koru.
                                            const mergedGuide = { ...guide, ...updatedGuide };
                                            updateLocalGuide(mergedGuide);
                                        }
                                    });
                                }}
                                onCategoryClick={handleCategoryClick}
                                onDateClick={handleDateClick}
                                onCodeClick={handleCodeClick}
                                onResetViewClick={handleResetGuideView}
                                onEditClick={handleEditGuideClick}
                                onDeleteClick={handleDeleteGuideClick}
                                onImageClick={handleImageClick}
                                isAdmin={canManageContent}
                                onDragEnd={handleGuideDragEnd}
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                            />
                        )}
                    </main>

                    {selectedError && (
                        <ErrorDetailModal
                            error={selectedError}
                            onClose={() => navigate('/')}
                            isAdmin={canManageContent}
                            onEdit={(e) => {
                                if (selectedError.type === 'guide' || activeTab === 'guides') handleEditGuideClick(e, selectedError);
                                else handleEditClick(e, selectedError);
                            }}
                            onDelete={(e) => handleDeleteClick(e, selectedError.id)}
                            categories={categories}
                            onCategoryClick={handleCategoryClick}
                            onDateClick={handleDateClick}
                            onCodeClick={handleCodeClick}
                        />
                    )}

                    {isAddModalOpen && (
                        <AddErrorModal isOpen={true} onClose={() => setIsAddModalOpen(false)} onSuccess={handleAddSuccess}
                            categories={errorCategories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory}
                            onDeleteCategory={handleDeleteCategory} showToast={showToast} />
                    )}
                    {isAddGuideModalOpen && (
                        <AddGuideModal isOpen={true} onClose={() => setIsAddGuideModalOpen(false)} onSuccess={handleAddGuideSuccess}
                            categories={guideCategories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory}
                            onDeleteCategory={handleDeleteCategory} showToast={showToast} />
                    )}
                    {isEditModalOpen && editingError && (
                        <EditErrorModal isOpen={true} errorToEdit={editingError}
                            onClose={() => { setIsEditModalOpen(false); setEditingError(null); }}
                            onSuccess={handleEditSuccess} categories={errorCategories} departments={departments} onAddCategory={handleAddCategory}
                            onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} showToast={showToast} />
                    )}
                    {isEditGuideModalOpen && editingError && (
                        <EditGuideModal isOpen={true} guideToEdit={editingError}
                            onClose={() => { setIsEditGuideModalOpen(false); setEditingError(null); }}
                            onSuccess={handleEditGuideSuccess} categories={guideCategories} departments={departments} onAddCategory={handleAddCategory}
                            onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} showToast={showToast} />
                    )}

                    {isLoginModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">Yönetici Girişi</h3>
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-posta</label>
                                            <input type="email" required autoComplete="email"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şifre</label>
                                            <input type="password" required
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all">Giriş Yap</button>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={() => setIsLoginModalOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">Vazgeç</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isCredentialsModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                                <div className="p-8">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">Şifre Değiştir</h3>
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-posta</label>
                                            <input type="email" readOnly disabled
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                                value={profile?.email || ''} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yeni Şifre</label>
                                            <input type="password" required minLength={6} autoComplete="new-password"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yeni Şifre (Tekrar)</label>
                                            <input type="password" required minLength={6} autoComplete="new-password"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all">Şifreyi Güncelle</button>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={() => setIsCredentialsModalOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">Vazgeç</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {previewGallery && (() => {
                        const items = previewGallery.items || (previewGallery.images ? previewGallery.images.map(url => ({ type: 'image', url })) : []);
                        const currentItem = items[previewGallery.index];
                        return (
                            <div className="fullscreen-viewer fixed inset-0 bg-black/95 z-[250] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewGallery(null)}>
                                <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
                                    <button onClick={() => setPreviewGallery(null)} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                                    <div className="w-full flex-1 relative flex items-center justify-center min-h-0">
                                        {currentItem?.type === 'video' ? (
                                            <video src={currentItem.url} className="max-w-full max-h-full rounded-lg shadow-2xl" controls autoPlay onClick={(e) => e.stopPropagation()} />
                                        ) : (
                                            <img src={currentItem?.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                                        )}
                                        {items.length > 1 && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); setPreviewGallery(prev => ({ ...prev, index: prev.index === 0 ? items.length - 1 : prev.index - 1 })); }}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/75 hover:bg-black/75 hover:text-white backdrop-blur-sm transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setPreviewGallery(prev => ({ ...prev, index: (prev.index + 1) % items.length })); }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/75 hover:bg-black/75 hover:text-white backdrop-blur-sm transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2 overflow-x-auto overflow-y-hidden max-w-full p-2">
                                        {items.map((item, idx) => (
                                            <button key={idx} onClick={(e) => { e.stopPropagation(); setPreviewGallery(prev => ({ ...prev, index: idx })); }}
                                                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${idx === previewGallery.index ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                                {item.type === 'video' ? (
                                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <img src={item.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </PageTransition>
            </div>
        </React.Suspense>
    );
};

export default HomePage;
