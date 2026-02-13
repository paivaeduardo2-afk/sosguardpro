
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import PanicButton from './components/PanicButton';
import AuthScreen from './components/AuthScreen';
import { AppSettings, LocationData, User } from './types';

const STORAGE_KEY = 'sos_guard_settings_v4';
const USER_KEY = 'sos_guard_user_v1';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [settings, setSettings] = useState<AppSettings>({
    userName: '',
    bloodType: '',
    medications: '',
    allergies: '',
    isOrganDonor: '',
    message: 'ESTOU EM PERIGO! Preciso de ajuda urgente. Minha localização segue no link.',
    contacts: [
      { id: '1', name: '', phone: '' },
      { id: '2', name: '', phone: '' },
      { id: '3', name: '', phone: '' },
      { id: '4', name: '', phone: '' },
      { id: '5', name: '', phone: '' },
    ],
    groupLink: '',
  });

  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
  });

  useEffect(() => {
    // Restaurar usuário
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Restaurar configurações
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        const mergedContacts = [...settings.contacts];
        if (parsed.contacts) {
          parsed.contacts.forEach((c: any, i: number) => {
            if (i < 5) mergedContacts[i] = c;
          });
        }
        
        setSettings({
          ...settings,
          ...parsed,
          contacts: mergedContacts
        });
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        },
        (err) => setLocation(prev => ({ ...prev, error: err.message })),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setView('home');
  };

  const handleAuth = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
  };

  if (!currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden relative">
      <Header />
      
      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        {view === 'home' ? (
          <PanicButton location={location} settings={settings} />
        ) : (
          <>
            <SettingsPanel settings={settings} onSave={handleSaveSettings} />
            <button 
              onClick={handleLogout}
              className="w-full mt-4 mb-10 py-4 text-slate-400 font-bold text-xs uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
            >
              Sair da Conta
            </button>
          </>
        )}
      </main>

      <nav className="bg-white border-t border-gray-200 px-8 py-4 flex justify-around items-center sticky bottom-0 z-50">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Alerta</span>
        </button>
        <button 
          onClick={() => setView('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
