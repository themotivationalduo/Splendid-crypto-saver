import React, { useState } from 'react';
import { useAuthVault } from '../context/AuthVaultContext';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function UnlockVaultPage() {
  const { hasSalt, setInitialSalt, unlockVault, signOut } = useAuthVault();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!hasSalt) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Master password must be at least 8 characters');
        }
        await setInitialSalt(password);
      } else {
        // We use a small timeout to let the UI update to "Processing..." before the heavy crypto operation blocks the thread
        await new Promise(resolve => setTimeout(resolve, 50));
        await unlockVault(password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Operation failed. If you recently created your vault, your device might be incompatible with the previous iteration count. Please reset your vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetVault = async () => {
    if (window.confirm("Are you ABSOLUTELY sure? This will delete your salt and lock you out of all existing encrypted data. You will need to start over.")) {
      try {
        await setInitialSalt(password || "default-reset-pass");
        window.location.reload();
      } catch (e) {
        alert("Failed to reset vault.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <KeyRound className="text-cyan-400 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {hasSalt ? 'Unlock Your Vault' : 'Setup Master Password'}
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-sm">
            {hasSalt 
              ? 'Enter your Master Password to derive your zero-knowledge encryption key.'
              : 'Create a strong Master Password. This is used to derive your local encryption key. We NEVER store this password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2 items-center">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {!hasSalt && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
              <h3 className="text-emerald-400 text-sm font-semibold mb-1 flex items-center gap-1">
                <CheckCircle2 size={16} /> Zero-Knowledge Architecture
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you lose this Master Password, your crypto secrets cannot be recovered. It is not sent to our servers.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
              Master Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
              placeholder="••••••••••••"
            />
          </div>

          {!hasSalt && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                Confirm Master Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder="••••••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] mt-4 disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? 'Processing...' : (hasSalt ? 'Decrypt & Unlock' : 'Initialize Vault')}
          </button>
        </form>

        {hasSalt && error && (
          <div className="mt-4 text-center">
            <button
              onClick={handleResetVault}
              className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
            >
              Emergency: Reset Vault (Destructive)
            </button>
          </div>
        )}

        <div className="mt-6 text-center border-t border-slate-800/50 pt-4">
          <button
            onClick={signOut}
            className="text-sm text-slate-500 hover:text-red-400 transition-colors"
          >
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
