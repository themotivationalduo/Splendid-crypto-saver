import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthVault } from '../context/AuthVaultContext';
import { encryptData } from '../utils/crypto';
import { PlusCircle, Wallet, Key, Layers, ShieldCheck, Wand2, Settings2, RefreshCw, Tag } from 'lucide-react';

export function AddEntry() {
  const { user, cryptoKey } = useAuthVault();
  const navigate = useNavigate();
  
  const [label, setLabel] = useState('');
  const [chain, setChain] = useState('Ethereum');
  const [category, setCategory] = useState('Wallet');
  const [publicAddress, setPublicAddress] = useState('');
  const [secret, setSecret] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(32);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(false);

  const CHAINS = ['Ethereum', 'Bitcoin', 'Solana', 'BNB Chain', 'Polygon', 'Arbitrum', 'Optimism', 'Other'];
  const CATEGORIES = ['Wallet', 'Exchange', 'DeFi', 'Social', 'Seed Phrase', 'Other'];

  const generateSecret = (e: React.MouseEvent) => {
    e.preventDefault();
    let charset = '';
    if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (!charset) {
       alert('Please select at least one character type.');
       return;
    }

    const randomArray = new Uint8Array(genLength * 4);
    window.crypto.getRandomValues(randomArray);
    let result = '';
    let i = 0;
    // Calculate the maximum valid byte value to avoid modulo bias
    const maxValid = Math.floor(256 / charset.length) * charset.length;

    while (result.length < genLength) {
      if (i >= randomArray.length) {
        window.crypto.getRandomValues(randomArray);
        i = 0;
      }
      const byte = randomArray[i++];
      if (byte < maxValid) {
        result += charset[byte % charset.length];
      }
    }
    setSecret(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cryptoKey) return;
    
    setError('');
    setLoading(true);

    try {
      // Zero-Knowledge Encryption before leaving the client
      const { ciphertext, iv } = await encryptData(cryptoKey, secret);

      await addDoc(collection(db, 'users', user.uid, 'vault'), {
        label,
        chain,
        category,
        publicAddress,
        encryptedSecret: ciphertext,
        iv,
        createdAt: Date.now()
      });

      // Clear form and go back to dashboard
      setLabel('');
      setPublicAddress('');
      setSecret('');
      setShowGenerator(false);
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message || "Failed to encrypt and save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="text-emerald-400" />
          Add Secure Entry
        </h2>
        <p className="text-slate-400 text-sm">Your secret is encrypted locally before saving.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Layers size={14} /> Label / Title
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              placeholder="e.g. MetaMask Main Wallet"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                Blockchain Network
              </label>
              <select
                value={chain}
                onChange={e => setChain(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none"
              >
                {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Tag size={14} /> Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Wallet size={14} /> Public Address
            </label>
            <input
              type="text"
              required
              value={publicAddress}
              onChange={e => setPublicAddress(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm"
              placeholder="0x..."
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1 mb-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Key size={14} /> Secret Phrase / Private Key
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-md border border-cyan-500/20"
              >
                <Wand2 size={12} /> {showGenerator ? 'Hide Generator' : 'Generate Secret'}
              </button>
            </div>

            {showGenerator && (
              <div className="mb-4 p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Settings2 size={14} /> Generator Settings
                  </h4>
                  <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{genLength} chars</span>
                </div>
                
                <div>
                  <input 
                    type="range" 
                    min="8" max="128" 
                    value={genLength} 
                    onChange={(e) => setGenLength(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>8</span>
                    <span>128</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded border-slate-700 bg-slate-800" />
                    A-Z
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded border-slate-700 bg-slate-800" />
                    a-z
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded border-slate-700 bg-slate-800" />
                    0-9
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded border-slate-700 bg-slate-800" />
                    !@#$
                  </label>
                </div>

                <button
                  type="button"
                  onClick={generateSecret}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                >
                  <RefreshCw size={16} /> Generate & Fill Below
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                required
                value={secret}
                onChange={e => setSecret(e.target.value)}
                className="w-full bg-slate-950/50 border border-emerald-500/30 rounded-xl py-3 px-4 text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm min-h-[100px] resize-y"
                placeholder="Enter 12/24 word seed phrase or private key..."
              />
              <div className="absolute top-3 right-3 text-emerald-500/50 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                <ShieldCheck size={14} /> Local Encrypt
              </div>
            </div>
            <p className="text-xs text-slate-500 ml-1 mt-1">This field will be AES-256-GCM encrypted before saving to Firebase.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] mt-4 disabled:opacity-50"
          >
            {loading ? 'Encrypting & Saving...' : 'Secure & Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
