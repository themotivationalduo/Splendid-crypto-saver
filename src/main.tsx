import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthVaultProvider } from './context/AuthVaultContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthVaultProvider>
      <App />
    </AuthVaultProvider>
  </StrictMode>,
);
