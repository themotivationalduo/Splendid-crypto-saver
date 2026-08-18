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
  isPasswordOptional: boolean;
  setInitialSalt: (password: string, isOptional?: boolean) => Promise<void>;
  timeoutMinutes: number;
  setTimeoutMinutes: (min: number) => void;
}

const AuthVaultContext = createContext<AuthVaultContextType | undefined>(undefined);

export function AuthVaultProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSalt, setHasSalt] = useState(false);
  const [isPasswordOptional, setIsPasswordOptional] = useState(false);
  const [timeoutMinutes, setTimeoutMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem('sscs_timeout');
    return saved ? parseInt(saved, 10) : 5;
  });

  const lockTimer = useRef<number | null>(null);

  const setTimeoutMinutes = (min: number) => {
    localStorage.setItem('sscs_timeout', min.toString());
    setTimeoutMinutesState(min);
  };

  const resetTimer = () => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    if (cryptoKey && timeoutMinutes > 0) {
      lockTimer.current = window.setTimeout(() => {
        lockVault();
      }, timeoutMinutes * 60 * 1000);
    }
  };

  // Re-run resetTimer whenever timeoutMinutes changes
  useEffect(() => {
    resetTimer();
  }, [timeoutMinutes, cryptoKey]);

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
        let retries = 2;
        let success = false;
        const localSaltKey = `sscs_salt_${u.uid}`;
        
        while (retries > 0 && !success && isMounted) {
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid));
            if (!isMounted) return;
            
            if (userDoc.exists() && userDoc.data().salt) {
              const fetchedSalt = userDoc.data().salt;
              const optional = userDoc.data().isPasswordOptional === true;
              
              setSalt(fetchedSalt);
              setHasSalt(true);
              setIsPasswordOptional(optional);
              localStorage.setItem(localSaltKey, fetchedSalt);
              localStorage.setItem(`${localSaltKey}_optional`, optional ? 'true' : 'false');
              
              // If optional, we immediately derive the key so they don't see the unlock screen
              if (optional) {
                 try {
                    const key = await deriveKey(u.uid, fetchedSalt);
                    setCryptoKey(key);
                 } catch(e) {
                    console.error("Auto-unlock failed", e);
                 }
              }
            } else {
              setSalt(null);
              setHasSalt(false);
              setIsPasswordOptional(false);
            }
            success = true;
            setError(null);
          } catch (err: any) {
            // Suppress the scary console log to a warning so users don't panic
            console.warn(`Connection issue (${retries} retries left):`, err.message);
            
            // Fallback to local storage if available
            const cachedSalt = localStorage.getItem(localSaltKey);
            const cachedOptional = localStorage.getItem(`${localSaltKey}_optional`) === 'true';
            
            if (cachedSalt) {
              console.log("Using cached salt from localStorage due to network error.");
              setSalt(cachedSalt);
              setHasSalt(true);
              setIsPasswordOptional(cachedOptional);
              success = true;
              setError(null);
              
              if (cachedOptional) {
                 try {
                    const key = await deriveKey(u.uid, cachedSalt);
                    setCryptoKey(key);
                 } catch(e) {}
              }
              break;
            }
            
            // If it's an offline or closing error, wait and retry.
            const errorMsg = (err.message || "").toLowerCase();
            if (errorMsg.includes('offline') || errorMsg.includes('closing') || errorMsg.includes('hidden')) {
              retries -= 1;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Fast retry
              } else {
                if (isMounted) {
                  setError("Browser Security Block: Your browser is preventing the database connection inside this preview window. Please click the 'Open in new tab' icon in the top right to continue.");
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
        setIsPasswordOptional(false);
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

  const setInitialSalt = async (password: string, isOptional: boolean = false) => {
    if (!user) return;
    const newSalt = generateSalt();
    const localSaltKey = `sscs_salt_${user.uid}`;
    
    // Save locally immediately to avoid offline blocking
    localStorage.setItem(localSaltKey, newSalt);
    localStorage.setItem(`${localSaltKey}_optional`, isOptional ? 'true' : 'false');
    
    setSalt(newSalt);
    setHasSalt(true);
    setIsPasswordOptional(isOptional);

    try {
      await setDoc(doc(db, 'users', user.uid), { salt: newSalt, isPasswordOptional: isOptional }, { merge: true });
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
    <AuthVaultContext.Provider value={{ user, cryptoKey, salt, loading, error, unlockVault, lockVault, signOut, hasSalt, isPasswordOptional, setInitialSalt, timeoutMinutes, setTimeoutMinutes }}>
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
