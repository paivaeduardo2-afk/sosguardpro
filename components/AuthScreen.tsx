
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onAuth: (user: User) => void;
}

const AuthScreen: React.FC<Props> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de delay de rede
    setTimeout(() => {
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || email.split('@')[0],
        email: email,
      };
      setLoading(false);
      onAuth(mockUser);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        id: 'google-123',
        name: 'Usuário Google',
        email: 'usuario@gmail.com',
        photoUrl: 'https://lh3.googleusercontent.com/a/default-user'
      };
      setLoading(false);
      onAuth(mockUser);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-8 justify-center animate-slide-up">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-200 mb-4">
          <span className="text-white font-black text-5xl">!</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          SOS<span className="text-red-600">GUARD</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Sua segurança em primeiro lugar</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex mb-8 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm text-black focus:border-red-500 outline-none transition-all"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">E-mail</label>
            <input
              type="email"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm text-black focus:border-red-500 outline-none transition-all"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Senha</label>
            <input
              type="password"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm text-black focus:border-red-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest mt-4 disabled:opacity-50"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar Agora' : 'Criar Conta'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-300 bg-white px-4">Ou continue com</div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
            <path fill="#34A853" d="M16.04 18.013c-1.09.503-2.303.787-3.54.787a7.077 7.077 0 0 1-7.234-4.882l-4.026 3.115C3.198 21.302 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.87-2.987z"/>
            <path fill="#4285F4" d="M19.91 21c2.128-1.855 3.49-4.59 3.49-7.727 0-.745-.104-1.464-.3-2.136H12v4.455h6.355c-.273 1.418-1.073 2.618-2.205 3.42l3.76 2.988z"/>
            <path fill="#FBBC05" d="M5.266 14.235a7.077 7.077 0 0 1 0-4.47l-4.026-3.115A11.91 11.91 0 0 0 0 12c0 1.923.454 3.736 1.24 5.35l4.026-3.115z"/>
          </svg>
          Google
        </button>
      </div>
      
      <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
        Ao entrar você concorda com nossos <br/> termos de uso e política de privacidade.
      </p>
    </div>
  );
};

export default AuthScreen;
