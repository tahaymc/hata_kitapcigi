import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, List, Calendar, Edit2, Eye, X, Image as ImageIcon, Shield, Lock, ArrowRight, Moon, Sun, Plus, Save, Trash2, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, BookOpen, Users, UserCog } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, searchErrors, getAllErrors, CATEGORIES, incrementViewCount, addError, updateError, deleteError } from '../data/mockData';
// Lazy Load Modals
const ErrorDetailModal = React.lazy(() => import('../components/ErrorDetailModal'));
const PeopleManagerModal = React.lazy(() => import('../components/PeopleManagerModal'));
const AddErrorModal = React.lazy(() => import('../components/AddErrorModal'));
const EditErrorModal = React.lazy(() => import('../components/EditErrorModal'));

import CategoryMoreDropdown from '../components/CategoryMoreDropdown';
import { COLOR_STYLES } from '../utils/constants';
import { getCategoryIcon, getCategoryColor, formatDisplayDate } from '../utils/helpers';





const HomePage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedError, setSelectedError] = useState(null); // For Modal
    const [previewGallery, setPreviewGallery] = useState(null); // For Quick Image View { images: [], index: 0 }
    const [hoverSlideshow, setHoverSlideshow] = useState({ id: null, index: 0 }); // For Card Hover Effect
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Category Click Handler for Modal & Page
    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedError(null);
    };

    // Date Click Handler for Modal & Page
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setSelectedError(null);
    };

    // Code Click Handler for Modal & Page (Toggles Search)
    const handleCodeClick = (code) => {
        setSearchTerm(prev => prev === code ? '' : code);
        setSelectedError(null);
    };

    // Hover Slideshow Effect
    useEffect(() => {
        let interval;
        if (hoverSlideshow.id) {
            interval = setInterval(() => {
                setHoverSlideshow(prev => {
                    if (prev.id !== hoverSlideshow.id) return prev;
                    // Find the error to know how many images it has
                    const error = errors.find(e => e.id === hoverSlideshow.id);
                    if (!error) return prev;

                    const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                    if (images.length <= 1) return prev;

                    return { ...prev, index: (prev.index + 1) % images.length };
                });
            }, 1000); // Switch every 1 second
        }
        return () => clearInterval(interval);
    }, [hoverSlideshow.id, errors]);

    // Prevent body scroll and handle Escape key when preview gallery is open
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setPreviewGallery(null);
            }
        };

        if (previewGallery) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [previewGallery]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // Custom Dropdown State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Login Modal State
    const [isPeopleManagerOpen, setIsPeopleManagerOpen] = useState(false); // People Manager Modal State

    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Edit Modal State
    const [editingError, setEditingError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Admin Credentials State
    const [adminCredentials, setAdminCredentials] = useState({ username: 'admin', password: 'admin' });
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [credentialsForm, setCredentialsForm] = useState({
        newUsername: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const storedCreds = localStorage.getItem('adminCredentials');
        if (storedCreds) {
            setAdminCredentials(JSON.parse(storedCreds));
        }
    }, []);

    // Prevent body scroll for all modals
    useEffect(() => {
        if (isAddModalOpen || isLoginModalOpen || isEditModalOpen || selectedError || isCredentialsModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAddModalOpen, isLoginModalOpen, isEditModalOpen, selectedError, isCredentialsModalOpen]);

    useEffect(() => {
        const adminAuth = localStorage.getItem('isAdminAuthenticated');
        if (adminAuth === 'true') {
            setIsAdmin(true);
        }
    }, []);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Default fallback style
    const defaultStyle = COLOR_STYLES['slate'];

    const [allErrors, setAllErrors] = useState([]); // Store all errors locally

    // URL Params for Category
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }

        const dateParam = searchParams.get('date');
        if (dateParam) {
            setSelectedDate(dateParam);
        }
    }, [searchParams]);

    useEffect(() => {
        getCategories().then(setCategories);
        // Fetch all errors once
        getAllErrors().then(data => {
            setAllErrors(data);
            setErrors(data);
        });
    }, []);

    // Close Credentials Modal on ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isCredentialsModalOpen) {
                setIsCredentialsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCredentialsModalOpen]);

    // Filter locally when search/filter changes
    useEffect(() => {
        let filtered = allErrors;

        if (selectedCategory) {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }

        if (selectedDate) {
            filtered = filtered.filter(e => e.date === selectedDate);
        }

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.summary && e.summary.toLowerCase().includes(q)) ||
                (e.code && e.code.toLowerCase().includes(q))
            );
        }

        setErrors(filtered);
    }, [searchTerm, selectedCategory, selectedDate, allErrors]);

    const handleAddCategory = async (name, color, icon) => {
        try {
            // Using absolute URL isn't necessary if proxy is set up or relative path works, but sticking to relative '/api'
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, icon })
            });
            if (response.ok) {
                const newCat = await response.json();
                setCategories([...categories, newCat]);
                return newCat.id;
            }
        } catch (e) {
            console.error('Failed to add category', e);
        }
        return null;
    };

    const handleUpdateCategory = async (id, name, color, icon) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, icon })
            });
            if (response.ok) {
                const updatedCat = await response.json();
                setCategories(categories.map(c => c.id === id ? updatedCat : c));
                return true;
            }
        } catch (e) {
            console.error('Failed to update category', e);
        }
        return false;
    };

    const handleDeleteCategory = async (id) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setCategories(categories.filter(c => c.id !== id));
                return true;
            }
        } catch (e) {
            console.error('Failed to delete category', e);
        }
        return false;
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginData.username === adminCredentials.username && loginData.password === adminCredentials.password) {
            localStorage.setItem('isAdminAuthenticated', 'true');
            setIsAdmin(true);
            setIsLoginModalOpen(false);
            setLoginData({ username: '', password: '' });
        } else {
            alert("Hatalı kullanıcı adı veya şifre!");
        }
    };

    const handleUpdateCredentials = (e) => {
        e.preventDefault();

        if (credentialsForm.currentPassword !== adminCredentials.password) {
            alert("Mevcut şifre hatalı!");
            return;
        }

        if (credentialsForm.newPassword !== credentialsForm.confirmPassword) {
            alert("Yeni şifreler eşleşmiyor!");
            return;
        }

        if (credentialsForm.newPassword.length < 4) {
            alert("Yeni şifre en az 4 karakter olmalıdır!");
            return;
        }

        const newCreds = {
            username: credentialsForm.newUsername || adminCredentials.username,
            password: credentialsForm.newPassword
        };

        setAdminCredentials(newCreds);
        localStorage.setItem('adminCredentials', JSON.stringify(newCreds));
        setIsCredentialsModalOpen(false);
        setCredentialsForm({ newUsername: '', currentPassword: '', newPassword: '', confirmPassword: '' });
        alert("Giriş bilgileri başarıyla güncellendi!");
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        setIsAdmin(false);
    };



    const handleAddSuccess = (newError) => {
        setErrors([newError, ...errors]);
    };

    const handleEditSuccess = (updatedError) => {
        setErrors(prev => prev.map(e => e.id === updatedError.id ? updatedError : e));
        setEditingError(null);
    };

    const handleDeleteClick = async (e, errorId) => {
        if (e) e.stopPropagation();
        if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteError(errorId);
            const updatedErrors = await searchErrors(searchTerm, selectedCategory, selectedDate);
            setErrors(updatedErrors);
            setSelectedError(null); // Close modal if open
        }
    };

    const handleEditClick = (e, error) => {
        if (e) e.stopPropagation();
        setEditingError(error);
        setIsEditModalOpen(true);
    };



    const handleCardClick = async (error) => {
        // Attempt to increment view count
        const updatedError = await incrementViewCount(error.id);

        if (updatedError) {
            // Merge existing error (with assignees) with updated viewCount
            // We MUST do this because the View Count API returns only the error columns, not the assignees relation
            const mergedError = { ...error, ...updatedError };

            // Update local list state if successful
            setErrors(prev => prev.map(e => e.id === error.id ? mergedError : e));
            setSelectedError(mergedError);
        } else {
            // Fallback: If API fails (e.g. Vercel static deployment), still open the modal with existing data
            setSelectedError(error);
        }
    };

    return (
        <React.Suspense fallback={<div className="fixed inset-0 bg-white/50 dark:bg-slate-900/50 z-[200]" />}>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
                {/* Header */}
                <header className="sticky top-0 z-[100] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-md transition-all duration-300">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>
                    <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory(null);
                            setSelectedDate(null);
                            setViewMode('grid');
                            navigate('/');
                        }}>
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300 ring-2 ring-white/20 overflow-hidden">
                                <div className="absolute inset-0 animate-[shine_3s_infinite] bg-gradient-to-tr from-transparent via-white/75 to-transparent skew-x-12 transform translate-x-[-150%]"></div>
                                <BookOpen className="w-6 h-6 relative z-10" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black leading-none tracking-tight">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 animate-gradient-x">ENPLUS Sistem</span>
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="h-0.5 w-4 bg-blue-500 rounded-full animate-pulse"></span>
                                    <p className="text-[11px] font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 animate-gradient-x">Çözüm Kitapçığı</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-slate-800/30 p-1.5 pl-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50 transition-all"
                            >
                                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <div className={`hidden md:flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700/50`}>
                                <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{isAdmin ? 'Yönetici' : 'Misafir'}</span>
                            </div>

                            {isAdmin ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 group"
                                        title="Yeni Ekle"
                                    >
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => setIsPeopleManagerOpen(true)}
                                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        title="Personel Yönetimi"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsCredentialsModalOpen(true)}
                                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        title="Kullanıcı Bilgilerini Değiştir"
                                    >
                                        <UserCog className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                                        title="Çıkış Yap"
                                    >
                                        <span className="sr-only">Çıkış</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                                >
                                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Giriş</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-10">
                    {/* Search Section */}
                    <div className="mb-12 relative z-[60]">
                        <div className="max-w-3xl mx-auto relative z-10">
                            <div className="flex items-center bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 group hover:scale-[1.01]">
                                {/* Search Input */}
                                <div className="flex-1 relative flex items-center h-full">
                                    <div className="absolute left-6 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-16 pr-4 py-5 bg-transparent border-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 transition-all"
                                        placeholder="Hata kodu, başlık veya anahtar kelime..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                            </div>

                            {/* Category Selection Bar */}
                            <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 mt-2 p-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-100 px-4 md:px-0 relative z-30">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] active:scale-95 whitespace-nowrap h-[42px] ${!selectedCategory
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-500/20 dark:bg-white dark:text-slate-900 dark:border-white'
                                        : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-blue-500/10'
                                        }`}
                                >
                                    <LayoutGrid className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                                    <span>Tümü</span>
                                </button>
                                {categories.slice(0, 4).map(c => {
                                    const style = COLOR_STYLES[c.color] || defaultStyle;
                                    const isSelected = selectedCategory === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCategory(isSelected ? null : c.id)}
                                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] active:scale-95 whitespace-nowrap h-[42px] ${isSelected
                                                ? `${style.buttonSelected} scale-[1.02]`
                                                : `bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${style.buttonUnselectedHover} ${style.hoverShadow}`
                                                }`}
                                        >
                                            {getCategoryIcon(c.id, `w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isSelected ? 'text-white' : style.text}`, c.icon)}
                                            <span>{c.name}</span>
                                        </button>
                                    );
                                })}

                                {/* More Categories Dropdown */}
                                {categories.length > 4 && (
                                    <CategoryMoreDropdown
                                        categories={categories.slice(4)}
                                        selectedCategory={selectedCategory}
                                        onSelect={setSelectedCategory}
                                    />
                                )}
                            </div>

                        </div>

                        {/* View Toggle (Desktop) */}
                        <div className="hidden md:flex absolute right-0 top-0 h-full items-center">
                            <div className="bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 flex">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                                    title="Kart Görünümü"
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                                    title="Liste Görünümü"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* View Toggle (Mobile) */}
                        <div className="flex md:hidden justify-center mt-6">
                            <div className="flex bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div >

                    {/* Active Filters Indicator */}
                    {
                        (selectedDate || selectedCategory) && (
                            <div className="flex justify-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all group"
                                    >
                                        <Calendar className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                        <span>{formatDisplayDate(selectedDate)}</span>
                                        <div className="bg-slate-700 rounded-full p-0.5 group-hover:bg-slate-600 ml-1">
                                            <X className="w-3 h-3" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        )
                    }

                    {/* Categories & View Toggle Loop Removed */}

                    {/* Results */}
                    {
                        errors.length > 0 ? (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                                {errors.map((error, index) => {
                                    const cat = categories.find(c => c.id === error.category);
                                    const colorKey = cat ? cat.color : 'slate';
                                    const style = COLOR_STYLES[colorKey] || defaultStyle;

                                    return viewMode === 'grid' ? (
                                        // Card View
                                        <div
                                            key={error.id}
                                            className={`bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 shadow-sm hover:shadow-2xl border border-slate-200 dark:border-slate-800 ${style.hoverBorder} transition-all duration-300 group cursor-pointer relative hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full overflow-hidden`}
                                            onClick={() => handleCardClick(error)}
                                            onDoubleClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            {/* Top Accent Line */}
                                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1.5 ${style.bar.split(' ')[0]} rounded-b-full shadow-sm`} />

                                            {/* Header: Title and Code/Icon */}
                                            {/* Header: Title and Code/Icon */}
                                            <div className="flex items-start gap-4 mb-4 mt-2">
                                                {/* Left: Category Icon */}
                                                <div className="flex-none">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCategory(error.category);
                                                        }}
                                                        className={`p-1.5 rounded-full border shadow-sm transition-transform group-hover:scale-110 cursor-pointer hover:opacity-80 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                                                        title={`Kategoriye git: ${cat?.name || 'Bilinmeyen'}`}
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            {getCategoryIcon(error.category, "w-5 h-5", cat?.icon)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center: Title */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-extrabold text-sm md:text-base leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {error.title}
                                                    </h3>
                                                </div>

                                                {/* Right: Code */}
                                                <div className="flex-none">
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCodeClick(error.code);
                                                        }}
                                                        className={`px-3 py-1 rounded-lg border font-mono font-bold text-[10px] sm:text-xs tracking-tight whitespace-nowrap shadow-sm transition-all cursor-pointer hover:opacity-80 ${style.bgLight} ${style.text} ${style.borderLight}`}
                                                    >
                                                        {error.code || 'SYS-000'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Middle Section: Description */}
                                            <div className="flex-1 mb-4 min-h-[60px]">
                                                <div
                                                    className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 font-medium"
                                                    dangerouslySetInnerHTML={{ __html: error.summary }}
                                                />
                                            </div>

                                            {/* Footer Metadata (Pills) */}
                                            <div className="relative flex items-center justify-between gap-2 mb-4">
                                                {/* Category Pill (Left) */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCategory(error.category);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border truncate max-w-[30%] text-center cursor-pointer hover:opacity-80 transition-opacity z-20 relative ${style.bgLight} ${style.text} ${style.borderLight}`}
                                                    title={`Kategoriye git: ${categories.find(c => c.id === error.category)?.name}`}
                                                >
                                                    {categories.find(c => c.id === error.category)?.name}
                                                </div>

                                                {/* Date Pill (Absolute Center) */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDate(selectedDate === error.date ? null : error.date);
                                                    }}
                                                    className={`absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 ${selectedDate === error.date
                                                        ? style.buttonSelected
                                                        : `bg-white dark:bg-slate-900 ${style.text} ${style.borderLight} hover:${style.bgLight}`
                                                        }`}
                                                    title={`Tarihe göre filtrele: ${formatDisplayDate(error.date)}`}
                                                >
                                                    <Calendar className={`w-3 h-3 ${selectedDate === error.date ? 'text-white' : 'currentColor'}`} />
                                                    <span>{formatDisplayDate(error.date)}</span>
                                                </div>

                                                {/* View Count & Assignee Pill (Right) */}
                                                <div className="flex items-center justify-end gap-2">
                                                    {error.assignees && error.assignees.length > 0 ? (
                                                        <div className="flex -space-x-2">
                                                            {error.assignees.slice(0, 3).map(person => (
                                                                <div key={person.id} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] bg-${person.color || 'slate'}-100 text-${person.color || 'slate'}-700 border border-${person.color || 'slate'}-200 shadow-sm relative z-10`} title={person.name}>
                                                                    {person.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            ))}
                                                            {error.assignees.length > 3 && (
                                                                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] bg-slate-100 text-slate-500 border border-slate-200 shadow-sm relative z-0">
                                                                    +{error.assignees.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : error.assignee ? (
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] bg-${error.assignee.color || 'slate'}-100 text-${error.assignee.color || 'slate'}-700 border border-${error.assignee.color || 'slate'}-200 shadow-sm`} title={error.assignee.name}>
                                                            {error.assignee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    ) : null}
                                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${style.bgLight} ${style.text} ${style.borderLight}`}>
                                                        <Eye className="w-4 h-4" />
                                                        <span>{error.viewCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom: Image */}
                                            {/* Bottom: Image Section */}
                                            <div className="mt-auto pt-4">
                                                <div className="flex items-center gap-2 mb-2 px-1 opacity-60">
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hata Görseli</span>
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                </div>
                                                <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative group/image border-4 ${style.borderLight} transition-colors`}>
                                                    {(error.imageUrl || (error.imageUrls && error.imageUrls.length > 0)) ? (
                                                        <>
                                                            <img
                                                                src={error.imageUrls?.[0] || error.imageUrl}
                                                                alt={error.title}
                                                                loading={index < 6 ? "eager" : "lazy"}
                                                                fetchpriority={index === 0 ? "high" : "auto"}
                                                                decoding="async"
                                                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/image:scale-105 cursor-zoom-in relative z-10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                                                    setPreviewGallery({ images, index: 0 });
                                                                }}
                                                            />
                                                            {/* Hover Overlay - Passes clicks to card (pointer-events-none), Button catches click (pointer-events-auto) */}
                                                            <div className="absolute inset-0 bg-slate-900/5 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none z-20">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                                                        setPreviewGallery({ images, index: 0 });
                                                                    }}
                                                                    className="pointer-events-auto transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                                                >
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    <span>Büyüt</span>
                                                                </button>
                                                            </div>
                                                            {(error.imageUrls && error.imageUrls.length > 1) && (
                                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/10 shadow-sm z-20">
                                                                    +{error.imageUrls.length - 1}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                                            <ImageIcon className="w-6 h-6 opacity-40" />
                                                            <span className="text-[10px] font-medium opacity-60">Görsel Yok</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Admin Actions */}
                                            {isAdmin && (
                                                <div className="absolute top-2 right-6 flex gap-2 z-10">
                                                    <button
                                                        onClick={(e) => handleEditClick(e, error)}
                                                        className="text-slate-300 hover:text-blue-500 transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, error.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // List View
                                        <div
                                            key={error.id}
                                            className={`bg-white dark:bg-[#1e293b] py-5 px-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl border border-slate-100 dark:border-slate-800 ${style.hoverBorder} transition-all duration-300 group cursor-pointer relative hover:-translate-y-1 hover:scale-[1.01] flex items-center gap-6 hover:z-50`}
                                            onClick={() => handleCardClick(error)}
                                            onDoubleClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 ${style.bar.replace('w-1', '')} bg-${style.bar.split(' ')[0].replace('bg-', '')} rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[2px_0_8px_-2px_rgba(0,0,0,0.5)]`}></div>

                                            <div className={`w-12 h-12 bg-slate-50 dark:bg-[#0f172a] rounded-xl flex flex-shrink-0 items-center justify-center border border-slate-200 dark:border-slate-700/50 ${style.text} ${style.groupHoverBg} transition-all`}>
                                                {getCategoryIcon(error.category, "w-6 h-6", cat?.icon)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCodeClick(error.code);
                                                        }}
                                                        className={`px-2 py-0.5 rounded ${style.bgLight} border ${style.borderLight} ${style.text} font-mono font-bold text-[10px] tracking-wider cursor-pointer hover:opacity-80`}
                                                    >
                                                        {error.code || 'SYS-000'}
                                                    </span>
                                                    <h3 className={`text-lg font-bold text-slate-800 dark:text-white ${style.groupHoverText} transition-colors truncate flex-1`}>
                                                        {error.title}
                                                    </h3>

                                                </div>
                                                <div
                                                    className="text-slate-500 dark:text-slate-400 text-sm truncate"
                                                    dangerouslySetInnerHTML={{ __html: error.summary }}
                                                />
                                            </div>

                                            <div className="hidden md:flex flex-row items-center gap-3 min-w-fit">
                                                {error.assignees && error.assignees.length > 0 ? (
                                                    <div className="flex -space-x-2 mr-2">
                                                        {error.assignees.slice(0, 3).map(person => (
                                                            <div key={person.id} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-${person.color || 'slate'}-100 text-${person.color || 'slate'}-700 border border-${person.color || 'slate'}-200 shadow-sm relative z-10`} title={person.name}>
                                                                {person.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        ))}
                                                        {error.assignees.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-500 border border-slate-200 shadow-sm relative z-0">
                                                                +{error.assignees.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : error.assignee ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-${error.assignee.color || 'slate'}-100 text-${error.assignee.color || 'slate'}-700 border border-${error.assignee.color || 'slate'}-200 shadow-sm`} title={error.assignee.name}>
                                                        {error.assignee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : null}

                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCategory(error.category);
                                                    }}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bgLight} ${style.text} border ${style.borderLight} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                                                >
                                                    {categories.find(c => c.id === error.category)?.name}
                                                </span>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDate(selectedDate === error.date ? null : error.date);
                                                    }}
                                                    className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border shadow-sm cursor-pointer transition-colors ${selectedDate === error.date
                                                        ? style.buttonSelected
                                                        : `bg-white dark:bg-slate-900 ${style.text} ${style.borderLight} hover:${style.bgLight}`
                                                        }`}
                                                >
                                                    <Calendar className={`w-3 h-3 ${selectedDate === error.date ? 'text-white' : 'currentColor'}`} />
                                                    <span>{formatDisplayDate(error.date)}</span>
                                                </div>

                                                {/* Static Image Preview Button with Hover Pop */}
                                                {(error.imageUrl || (error.imageUrls && error.imageUrls.length > 0)) && (
                                                    <div
                                                        className="relative group/preview"
                                                        onMouseEnter={() => setHoverSlideshow({ id: error.id, index: 0 })}
                                                        onMouseLeave={() => setHoverSlideshow({ id: null, index: 0 })}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const images = error.imageUrls || (error.imageUrl ? [error.imageUrl] : []);
                                                                setPreviewGallery({ images, index: 0 });
                                                            }}
                                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-600/50"
                                                            title="Büyütmek için tıkla"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>

                                                        {/* Hover Popup */}
                                                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-48 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl opacity-0 invisible group-hover/preview:opacity-100 group-hover/preview:visible transition-all duration-300 z-20 pointer-events-none">
                                                            <div className="aspect-[3/4] w-full bg-[#0f172a] rounded-lg overflow-hidden relative">
                                                                <img
                                                                    src={
                                                                        hoverSlideshow.id === error.id
                                                                            ? ((error.imageUrls && error.imageUrls.length > 0) ? error.imageUrls[hoverSlideshow.index] : error.imageUrl)
                                                                            : (error.imageUrl || (error.imageUrls && error.imageUrls[0]))
                                                                    }
                                                                    alt="Önizleme"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end justify-center p-2">
                                                                    <span className="text-[10px] text-white font-medium">Tıkla ve Büyüt</span>
                                                                </div>
                                                                {(error.imageUrls && error.imageUrls.length > 1) && (
                                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-[2px] rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                                        <span>{hoverSlideshow.id === error.id ? hoverSlideshow.index + 1 : 1}</span>
                                                                        <span className="opacity-60">/</span>
                                                                        <span>{error.imageUrls.length}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Arrow Pointer */}
                                                            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 border-t border-r border-slate-700 transform rotate-45"></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700/50">
                                                        <button
                                                            onClick={(e) => handleEditClick(e, error)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                            title="Düzenle"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, error.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-50">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-[#1e293b] rounded-full flex items-center justify-center mb-6 mx-auto">
                                    <Search className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-400 dark:text-slate-300">Sonuç Bulunamadı</h3>
                            </div>
                        )
                    }

                    {/* Detail Modal */}
                    {
                        selectedError && (
                            <ErrorDetailModal
                                error={selectedError}
                                onClose={() => setSelectedError(null)}
                                onCategoryClick={handleCategoryClick}
                                onDateClick={handleDateClick}
                                onCodeClick={handleCodeClick}
                                categories={categories}
                                isAdmin={isAdmin}
                                onEdit={(e) => handleEditClick(e, selectedError)}
                                onDelete={(e) => handleDeleteClick(e, selectedError.id)}
                            />
                        )
                    }

                    {/* Login Modal */}
                    {
                        isLoginModalOpen && (
                            <div
                                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                                onClick={() => setIsLoginModalOpen(false)}
                            >
                                <div
                                    className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Decorative Gradient */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

                                    <div className="text-center mb-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/20 mb-1 overflow-hidden">
                                                <div className="absolute inset-0 animate-[shine_3s_infinite] bg-gradient-to-tr from-transparent via-white/75 to-transparent skew-x-12 transform translate-x-[-150%]"></div>
                                                <BookOpen className="w-7 h-7 relative z-10" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <h1 className="text-xl font-black leading-none tracking-tight">
                                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-400 dark:via-sky-300 dark:to-blue-400 animate-gradient-x">ENPLUS Sistem</span>
                                                </h1>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className="h-0.5 w-4 bg-blue-500 rounded-full animate-pulse"></span>
                                                    <p className="text-[11px] font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-400 dark:via-sky-300 dark:to-blue-400 animate-gradient-x">Hata Kitapçığı</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Kullanıcı Adı</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                value={loginData.username}
                                                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Şifre</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                value={loginData.password}
                                                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                                        >
                                            <span>Giriş Yap</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </form>

                                    <button
                                        className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                        onClick={() => setIsLoginModalOpen(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* Quick Image Preview Gallery Modal */}
                    {
                        previewGallery && (
                            <div
                                className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                                onClick={() => setPreviewGallery(null)}
                            >
                                <button
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                                    onClick={() => setPreviewGallery(null)}
                                >
                                    <X className="w-8 h-8" />
                                </button>

                                {/* Navigation Arrows */}
                                {previewGallery.images.length > 1 && (
                                    <>
                                        <button
                                            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewGallery(prev => ({ ...prev, index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1 }));
                                            }}
                                        >
                                            <ChevronLeft className="w-8 h-8" />
                                        </button>
                                        <button
                                            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewGallery(prev => ({ ...prev, index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0 }));
                                            }}
                                        >
                                            <ChevronRight className="w-8 h-8" />
                                        </button>
                                    </>
                                )}

                                <img
                                    src={previewGallery.images[previewGallery.index]}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Counter Bubble */}
                                {previewGallery.images.length > 1 && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm border border-white/10">
                                        {previewGallery.index + 1} / {previewGallery.images.length}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Add Error Modal */}
                    {/* Add Error Modal */}
                    <AddErrorModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onSuccess={handleAddSuccess}
                        categories={categories}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                        showToast={showToast}
                    />

                    {/* Edit Error Modal */}
                    <EditErrorModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setEditingError(null);
                        }}
                        onSuccess={handleEditSuccess}
                        errorToEdit={editingError}
                        categories={categories}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                        showToast={showToast}
                    />

                    {/* Credentials Update Modal */}
                    {isCredentialsModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" style={{ margin: 0 }}>
                            <div
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                                onClick={() => setIsCredentialsModalOpen(false)}
                            ></div>
                            <div className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bilgileri Güncelle</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Yönetici giriş bilgilerini değiştirin</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCredentialsModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateCredentials} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            Yeni Kullanıcı Adı (İsteğe bağlı)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                                placeholder={adminCredentials.username}
                                                value={credentialsForm.newUsername}
                                                onChange={e => setCredentialsForm({ ...credentialsForm, newUsername: e.target.value })}
                                            />
                                            <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            Mevcut Şifre <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                                placeholder="••••••"
                                                value={credentialsForm.currentPassword}
                                                onChange={e => setCredentialsForm({ ...credentialsForm, currentPassword: e.target.value })}
                                            />
                                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Yeni Şifre
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                                    placeholder="••••••"
                                                    value={credentialsForm.newPassword}
                                                    onChange={e => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                                                />
                                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                Şifre Tekrar
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                                    placeholder="••••••"
                                                    value={credentialsForm.confirmPassword}
                                                    onChange={e => setCredentialsForm({ ...credentialsForm, confirmPassword: e.target.value })}
                                                />
                                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCredentialsModalOpen(false)}
                                            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Güncelle
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {/* People Manager Modal */}
                    {isPeopleManagerOpen && (
                        <PeopleManagerModal onClose={() => setIsPeopleManagerOpen(false)} />
                    )}
                </main >
                {/* Aesthetic Toasts Container */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 animate-in fade-in slide-in-from-bottom-6 duration-500 ${toast.type === 'success' ? 'bg-emerald-600/90 text-white shadow-emerald-500/20' : 'bg-red-600/90 text-white shadow-red-500/20'} w-full`}
                        >
                            <div className="flex-shrink-0 p-1.5 rounded-xl bg-white/20">
                                {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm leading-tight">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4 opacity-70" />
                            </button>
                        </div>
                    ))}
                </div>
            </div >
        </React.Suspense>
    );
};

export default HomePage;
