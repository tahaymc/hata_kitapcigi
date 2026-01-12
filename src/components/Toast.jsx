import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (message && duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    const variants = {
        hidden: { opacity: 0, y: -20, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, x: 20, scale: 0.9 }
    };

    const styles = {
        success: {
            bg: 'bg-white dark:bg-slate-800',
            border: 'border-green-500',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            title: 'text-green-600 dark:text-green-400'
        },
        error: {
            bg: 'bg-white dark:bg-slate-800',
            border: 'border-red-500',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            title: 'text-red-600 dark:text-red-400'
        },
        info: {
            bg: 'bg-white dark:bg-slate-800',
            border: 'border-blue-500',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            title: 'text-blue-600 dark:text-blue-400'
        }
    };

    const currentStyle = styles[type] || styles.success;

    return (
        <AnimatePresence>
            {message && (
                <div className="fixed top-20 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
                    <motion.div
                        layout
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={variants}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border-l-4 ${currentStyle.bg} ${currentStyle.border} min-w-[300px] max-w-md`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {currentStyle.icon}
                        </div>
                        <div className="flex-1 mr-2">
                            <p className={`text-sm font-bold ${currentStyle.title} mb-0.5`}>
                                {type === 'error' ? 'Hata' : type === 'info' ? 'Bilgi' : 'Başarılı'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-tight">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
