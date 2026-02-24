import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NProgress from 'nprogress';

import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Component to handle NProgress and ScrollToTop
const NavigationHandler = () => {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
      window.scrollTo(0, 0);
    }, 100); // Small delay to show progress on quick transitions

    return () => clearTimeout(timer);
  }, [location]);

  return null;
};

// Custom Spinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0f172a] text-blue-600">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
    </div>
    <div className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Yükleniyor...</div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

      <AuthProvider>
        <Toaster position="top-right" richColors />
        <NavigationHandler />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
