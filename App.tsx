
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import PanicButton from './components/PanicButton';
import { AppSettings, LocationData } from './types';

const STORAGE_KEY = 'sos_guard_settings_v4';

const App: React.FC = () => {
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
  });

  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Garante que o array de contatos tenha sempre 5 posições após migração
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

  return (
    <div className="h-full flex flex-col bg-slate-50 max-w-md mx-auto relative shadow-2xl border-x border-slate-200">
      <Header />

      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="min-h-full flex flex-col items-center">
          {view === 'home' ? (
            <>
              <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
                <PanicButton location={location} settings={settings} />
              </div>
              
              <div className="w-full mt-auto mb-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${location.latitude ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-amber-400 animate-pulse'}`}></div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status do GPS</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {location.latitude 
                        ? `${location.latitude.toFixed(5)}, ${location.longitude?.toFixed(5)}` 
                        : location.error ? "Acesso à localização negado" : "Buscando satélites..."}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full pb-8">
              <SettingsPanel settings={settings} onSave={handleSaveSettings} />
            </div>
          )}
        </div>
      </main>

      <nav className="h-20 bg-white/80 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-10 shrink-0">
        <button 
          onClick={() => setView('home')}
          className={`group flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-sos-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${view === 'home' ? 'bg-sos-50' : 'group-hover:bg-slate-50'}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h16V9l-8-6zm0 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
        </button>
        
        <button 
          onClick={() => setView('settings')}
          className={`group flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-sos-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${view === 'settings' ? 'bg-sos-50' : 'group-hover:bg-slate-50'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
