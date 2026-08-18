import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthVault } from '../context/AuthVaultContext';
import { decryptData } from '../utils/crypto';
import { Search, Copy, Eye, EyeOff, Trash2, Wallet, Layers, ShieldAlert, Key } from 'lucide-react';

interface VaultEntry {
  id: string;
  label: string;
  chain: string;
  category?: string;
  publicAddress: string;
  encryptedSecret: string;
  iv: string;
  createdAt: number;
}

export function Dashboard() {
  const { user, cryptoKey } = useAuthVault();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [decryptedSecrets, setDecryptedSecrets] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Load cached vault entries to prevent blank screens offline
    const localVaultKey = `sscs_vault_${user.uid}`;
    const cachedVault = localStorage.getItem(localVaultKey);
    if (cachedVault) {
      try {
        setEntries(JSON.parse(cachedVault));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse cached vault");
      }
    }

    const q = query(collection(db, 'users', user.uid, 'vault'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: VaultEntry[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as VaultEntry);
      });
      setEntries(data);
      localStorage.setItem(localVaultKey, JSON.stringify(data));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching vault entries:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const handleReveal = async (entry: VaultEntry) => {
    if (revealed[entry.id]) {
      setRevealed(prev => ({ ...prev, [entry.id]: false }));
      return;
    }

    if (!cryptoKey) return;

    if (!decryptedSecrets[entry.id]) {
      try {
        const plaintext = await decryptData(cryptoKey, entry.encryptedSecret, entry.iv);
        setDecryptedSecrets(prev => ({ ...prev, [entry.id]: plaintext }));
      } catch (err) {
        alert("Failed to decrypt this entry. Invalid key or corrupted data.");
        return;
      }
    }
    setRevealed(prev => ({ ...prev, [entry.id]: true }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      await deleteDoc(doc(db, 'users', user.uid, 'vault', id));
    }
  };

  const filteredEntries = entries.filter(e => 
    e.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.chain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.publicAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="text-emerald-400" />
            Your Secure Vault
          </h2>
          <p className="text-slate-400 text-sm">Encrypted with zero-knowledge architecture</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search label, network..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/50 rounded-2xl border-dashed">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">Vault is empty</h3>
          <p className="text-slate-500 text-sm mt-1">Add your first crypto secret to secure it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{entry.label}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium tracking-wider uppercase border border-slate-700">
                      {entry.chain}
                    </span>
                    {entry.category && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400 text-[10px] font-medium tracking-wider uppercase border border-cyan-800/50">
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Wallet size={12} /> Public Address
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-2 border border-slate-800/50 group/addr">
                    <span className="text-xs text-slate-300 font-mono truncate flex-1">{entry.publicAddress}</span>
                    <button 
                      onClick={() => copyToClipboard(entry.publicAddress)}
                      className="text-slate-500 hover:text-emerald-400 transition-colors p-1"
                      title="Copy Address"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Key size={12} /> Secret Phrase / Private Key
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                    <span className="text-xs font-mono flex-1 overflow-hidden">
                      {revealed[entry.id] 
                        ? <span className="text-emerald-400 break-all">{decryptedSecrets[entry.id]}</span>
                        : <span className="text-slate-600 tracking-widest">••••••••••••••••••••••••</span>
                      }
                    </span>
                    <button 
                      onClick={() => handleReveal(entry)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
                      title={revealed[entry.id] ? "Hide Secret" : "Reveal Secret"}
                    >
                      {revealed[entry.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    {revealed[entry.id] && (
                      <button 
                        onClick={() => copyToClipboard(decryptedSecrets[entry.id])}
                        className="text-slate-500 hover:text-emerald-400 transition-colors p-1"
                        title="Copy Secret"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
