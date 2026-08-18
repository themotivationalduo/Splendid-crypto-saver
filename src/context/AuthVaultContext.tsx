import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { deriveKey, generateSalt } from '../utils/crypto';

interface AuthVaultContextType {
  user: User | null;
  cryptoKey: CryptoKey | null;
  salt: string | null;
  loading: boolean;
  error: string | null;
  unlockVault: (password: string) => Promise<void>;
  lockVault: () => void;
  signOut: () => Promise<void>;
  hasSalt: boolean;
  setInitialSalt: (password: string) => Promise<void>;
}

const AuthVaultContext = createContext<AuthVaultContextType | undefined>(undefined);

export function AuthVaultProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSalt, setHasSalt] = useState(false);

  const lockTimer = useRef<number | null>(null);

  const resetTimer = () => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    if (cryptoKey) {
      lockTimer.current = window.setTimeout(() => {
        lockVault();
      }, 5 * 60 * 1000); // 5 minutes inactivity lock
    }
  };

  useEffect(() => {
    const handleActivity = () => resetTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, [cryptoKey]);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      setUser(u);
      setError(null);
      
      if (u) {
        let retries = 3;
        let success = false;
        const localSaltKey = `sscs_salt_${u.uid}`;
        
        while (retries > 0 && !success && isMounted) {
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid));
            if (!isMounted) return;
            
            if (userDoc.exists() && userDoc.data().salt) {
              const fetchedSalt = userDoc.data().salt;
              setSalt(fetchedSalt);
              setHasSalt(true);
              localStorage.setItem(localSaltKey, fetchedSalt);
            } else {
              setSalt(null);
              setHasSalt(false);
            }
            success = true;
            setError(null);
          } catch (err: any) {
            console.error(`Error fetching user salt (${retries} retries left):`, err);
            
            // Fallback to local storage if available
            const cachedSalt = localStorage.getItem(localSaltKey);
            if (cachedSalt) {
              console.log("Using cached salt from localStorage due to network error.");
              setSalt(cachedSalt);
              setHasSalt(true);
              success = true;
              setError(null);
              break;
            }
            
            // If it's an offline error, wait and retry.
            if (err.message && err.message.toLowerCase().includes('offline')) {
              retries -= 1;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              } else {
                if (isMounted) {
                  setError("Offline Error: Your browser is blocking the database connection. Please open the app in a new tab (top right corner) to allow Firebase to connect securely.");
                }
              }
            } else {
              if (isMounted) {
                setError("Database error: " + (err.message || "Failed to load account data. Please open the app in a new tab."));
              }
              break;
            }
          }
        }
      } else {
        setSalt(null);
        setHasSalt(false);
        setCryptoKey(null);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const setInitialSalt = async (password: string) => {
    if (!user) return;
    const newSalt = generateSalt();
    const localSaltKey = `sscs_salt_${user.uid}`;
    
    // Save locally immediately to avoid offline blocking
    localStorage.setItem(localSaltKey, newSalt);
    setSalt(newSalt);
    setHasSalt(true);

    try {
      await setDoc(doc(db, 'users', user.uid), { salt: newSalt }, { merge: true });
    } catch (e) {
      console.warn("Failed to sync salt to Firebase immediately. It is saved in localStorage.", e);
    }
    
    const key = await deriveKey(password, newSalt);
    setCryptoKey(key);
    resetTimer();
  };

  const unlockVault = async (password: string) => {
    if (!salt) throw new Error("No salt found for user");
    const key = await deriveKey(password, salt);
    setCryptoKey(key);
    resetTimer();
  };

  const lockVault = () => {
    setCryptoKey(null);
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
  };

  const signOut = async () => {
    lockVault();
    await firebaseSignOut(auth);
  };

  return (
    <AuthVaultContext.Provider value={{ user, cryptoKey, salt, loading, error, unlockVault, lockVault, signOut, hasSalt, setInitialSalt }}>
      {children}
    </AuthVaultContext.Provider>
  );
}

export function useAuthVault() {
  const context = useContext(AuthVaultContext);
  if (context === undefined) {
    throw new Error('useAuthVault must be used within an AuthVaultProvider');
  }
  return context;
}
