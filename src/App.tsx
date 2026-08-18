import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthVault } from './context/AuthVaultContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/AuthPage';
import { UnlockVaultPage } from './components/UnlockVaultPage';
import { Dashboard } from './components/Dashboard';
import { AddEntry } from './components/AddEntry';
import { Backups } from './components/Backups';
import { Settings } from './components/Settings';

function ProtectedLayout() {
  const { user, cryptoKey } = useAuthVault();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!cryptoKey) {
    return <Navigate to="/unlock" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 font-sans relative overflow-hidden">
      {/* Background Ambience Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />

      <Navbar />
      
      <main className="pt-24 pb-20 sm:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, cryptoKey, loading, error, signOut } = useAuthVault();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors mb-3"
          >
            Retry Connection
          </button>
          <button
            onClick={signOut}
            className="w-full text-slate-500 hover:text-red-400 text-sm font-medium py-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Semi-Public */}
      <Route 
        path="/login" 
        element={user ? (cryptoKey ? <Navigate to="/dashboard" replace /> : <Navigate to="/unlock" replace />) : <AuthPage />} 
      />
      <Route 
        path="/unlock" 
        element={!user ? <Navigate to="/login" replace /> : (cryptoKey ? <Navigate to="/dashboard" replace /> : <UnlockVaultPage />)} 
      />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add" element={<AddEntry />} />
        <Route path="backups" element={<Backups />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
