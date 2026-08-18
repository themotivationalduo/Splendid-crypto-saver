import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthVault } from '../context/AuthVaultContext';
import { ShieldCheck, Lock, LogOut, LayoutDashboard, PlusCircle, DownloadCloud, Settings } from 'lucide-react';

export function Navbar() {
  const { user, cryptoKey, lockVault, signOut } = useAuthVault();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!user) return null;

  const tabs = [
    { id: '/dashboard', label: 'Vault', icon: LayoutDashboard },
    { id: '/add', label: 'Add', icon: PlusCircle },
    { id: '/backups', label: 'Backups', icon: DownloadCloud },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Floating Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={24} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h1 className="font-bold text-lg hidden sm:block tracking-wide">
              SPLENDID SECURED CRYPTO SAVER <span className="text-xl">🔐</span>
            </h1>
            <h1 className="font-bold text-lg sm:hidden tracking-wide">
              SSCS <span className="text-xl">🔐</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
              {tabs.map(tab => {
                const isActive = location.pathname.startsWith(tab.id);
                return (
                  <Link
                    key={tab.id}
                    to={tab.id}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {cryptoKey && (
              <button
                onClick={lockVault}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Lock size={16} />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Mobile Navigation */}
      <nav
        className={`sm:hidden fixed bottom-0 w-full z-50 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } bg-slate-900/90 backdrop-blur-md border-t border-slate-800/50 pb-safe`}
      >
        <div className="flex justify-around p-2">
          {tabs.map(tab => {
            const isActive = location.pathname.startsWith(tab.id);
            return (
              <Link
                key={tab.id}
                to={tab.id}
                className={`flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl transition-colors ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={20} className="mb-1" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
