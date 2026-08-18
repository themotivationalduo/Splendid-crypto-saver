import React, { useState, useRef } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthVault } from '../context/AuthVaultContext';
import { DownloadCloud, UploadCloud, FileJson, AlertTriangle } from 'lucide-react';

export function Backups() {
  const { user, salt } = useAuthVault();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user || !salt) return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'vault'));
      const entries = snapshot.docs.map(doc => doc.data());

      const backupData = {
        version: 1,
        timestamp: Date.now(),
        salt: salt,
        entries: entries
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sscs_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ text: 'Backup exported successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to export backup.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error("Invalid backup format: missing entries.");
      }

      if (data.salt && data.salt !== salt) {
        throw new Error("Salt mismatch: This backup was encrypted with a different Master Password or account.");
      }

      const batch = writeBatch(db);
      const vaultRef = collection(db, 'users', user.uid, 'vault');

      let importCount = 0;
      data.entries.forEach((entry: any) => {
        if (entry.encryptedSecret && entry.iv) {
          const newDocRef = doc(vaultRef);
          batch.set(newDocRef, entry);
          importCount++;
        }
      });

      if (importCount > 0) {
        await batch.commit();
        setMessage({ text: `Successfully imported ${importCount} entries.`, type: 'success' });
      } else {
        setMessage({ text: 'No valid entries found in backup.', type: 'error' });
      }

    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Failed to import backup.', type: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileJson className="text-cyan-400" />
          Backups & Sync
        </h2>
        <p className="text-slate-400 text-sm">Download an offline copy of your encrypted vault or restore from a file.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-slate-700 transition-colors flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <DownloadCloud className="text-cyan-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Export Encrypted Backup</h3>
          <p className="text-sm text-slate-400 mb-8 flex-1">
            Download a `.json` file containing your encrypted ciphertexts, IVs, and salt. Secrets remain fully encrypted and safe to store anywhere.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Download Backup'}
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-slate-700 transition-colors flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
            <UploadCloud className="text-emerald-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Import Encrypted Backup</h3>
          <p className="text-sm text-slate-400 mb-8 flex-1">
            Upload an offline `.json` backup file. The backup must match your current Master Password salt to be decrypted successfully.
          </p>
          
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Select JSON File'}
          </button>
        </div>
      </div>
    </div>
  );
}
