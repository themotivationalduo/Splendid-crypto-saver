import React from 'react';
import { useAuthVault } from '../context/AuthVaultContext';
import { Settings as SettingsIcon, UserCircle, Shield, Clock, Hash, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const { user, salt, lockVault, signOut } = useAuthVault();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-emerald-400" />
          Account & Security
        </h2>
        <p className="text-slate-400 text-sm">Manage your zero-knowledge profile and session settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="text-emerald-400 w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Firebase Profile</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Account Email</label>
              <div className="text-slate-200 mt-1 font-medium">{user?.email}</div>
            </div>
            
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">User UID</label>
              <div className="text-slate-400 mt-1 font-mono text-xs truncate bg-slate-950 p-2 rounded-lg border border-slate-800/50">
                {user?.uid}
              </div>
            </div>
          </div>
        </div>

        {/* Security Parameters */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 blur-[50px]" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Shield className="text-cyan-400 w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Zero-Knowledge Core</h3>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Hash size={12} /> Crypto Salt (Hex)
              </label>
              <div className="text-cyan-400 mt-1 font-mono text-xs break-all bg-slate-950 p-2 rounded-lg border border-slate-800/50">
                {salt || 'Not initialized'}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Shield size={12} /> Key Derivation
              </label>
              <div className="text-slate-300 mt-1 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                PBKDF2-HMAC-SHA256 (600,000 iterations)
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Session Lock
              </label>
              <div className="text-slate-300 mt-1 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Auto-locks after 5 minutes of inactivity
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800/50">
          <button
            onClick={lockVault}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
          >
            Lock Vault Now
          </button>
          <button
            onClick={signOut}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold py-3 rounded-xl transition-all"
          >
            Sign Out Everything
          </button>
        </div>

      </div>
    </div>
  );
}
