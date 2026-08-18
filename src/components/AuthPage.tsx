import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <ShieldCheck className="text-emerald-400 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide text-center">
            SPLENDID SECURED<br/>CRYPTO SAVER <span className="text-2xl">🔐</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm text-center">
            {isLogin ? 'Sign in to access your vault' : 'Create an account to secure your keys'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="satoshin@bitcoin.org"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Account Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-slate-500 ml-1 mt-1">This is your Firebase login password, distinct from your local Master Vault Password.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Enter Vault' : 'Create Account')}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
