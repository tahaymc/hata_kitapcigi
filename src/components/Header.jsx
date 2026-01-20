import React from 'react';
import { BookOpen, Sun, Moon, Plus, Users, UserCog, Shield, LogOut } from 'lucide-react';
import SearchBar from './SearchBar';

const Header = ({
    isDarkMode,
    setIsDarkMode,
    isAdmin,
    onLoginClick,
    onLogoutClick,
    onAddClick,
    onPeopleClick,
    onCredentialsClick,
    onLogoClick,
    searchProps // New prop to pass search bar functionality
}) => {
    return (
        <header className="sticky top-0 z-[100] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>
            <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
                {/* Logo Section */}
                <div className="flex items-center gap-3 group cursor-pointer flex-shrink-0" onClick={onLogoClick}>
                    <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300 ring-2 ring-white/20 overflow-hidden">
                        <div className="absolute inset-0 animate-[shine_3s_infinite] bg-gradient-to-tr from-transparent via-white/75 to-transparent skew-x-12 transform translate-x-[-150%]"></div>
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 relative z-10" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-xl font-black leading-none tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 animate-gradient-x">ENPLUS Sistem</span>
                        </h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="h-0.5 w-4 bg-blue-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] md:text-[11px] font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 animate-gradient-x">Çözüm Kitapçığı</p>
                        </div>
                    </div>
                </div>

                {/* Center Search Bar */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-xl">
                    <SearchBar {...searchProps} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4 bg-slate-100/50 dark:bg-slate-800/30 p-1.5 pl-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm flex-shrink-0">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50 transition-all"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <div className={`hidden lg:flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700/50`}>
                        <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{isAdmin ? 'Yönetici' : 'Misafir'}</span>
                    </div>

                    {isAdmin ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onAddClick}
                                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 group"
                                title="Yeni Ekle"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            </button>
                            <button
                                onClick={onPeopleClick}
                                className="hidden sm:block p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                title="Personel Yönetimi"
                            >
                                <Users className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onCredentialsClick}
                                className="hidden sm:block p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                title="Kullanıcı Bilgilerini Değiştir"
                            >
                                <UserCog className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onLogoutClick}
                                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                                title="Çıkış Yap"
                            >
                                <span className="sr-only">Çıkış</span>
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            <span>Giriş</span>
                        </button>
                    )}
                </div>
            </div>


        </header>
    );
};

export default Header;
