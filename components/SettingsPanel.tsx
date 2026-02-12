
import React, { useState } from 'react';
import { AppSettings, EmergencyContact } from '../types';
import { optimizeSOSMessage } from '../services/geminiService';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsPanel: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Sugestões de papéis específicos solicitados
  const roleSuggestions = ["Pai", "Mãe", "Amigo (a)", "Tio (a)", "Outro"];

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...localSettings.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setLocalSettings({ ...localSettings, contacts: newContacts });
  };

  const handleOptimize = async () => {
    if (!localSettings.message) return;
    setIsOptimizing(true);
    const optimized = await optimizeSOSMessage(localSettings.message);
    setLocalSettings({ ...localSettings, message: optimized });
    setIsOptimizing(false);
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Bloco Unificado: Ficha Médica + Contatos */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          Ficha Médica de Emergência
        </h2>
        
        <div className="space-y-4">
          {/* Dados Clínicos */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                value={localSettings.userName}
                onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo Sanguíneo</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={localSettings.bloodType}
                  onChange={(e) => setLocalSettings({ ...localSettings, bloodType: e.target.value })}
                >
                  <option value="">Não informado</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Doador de Órgãos?</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={localSettings.isOrganDonor}
                  onChange={(e) => setLocalSettings({ ...localSettings, isOrganDonor: e.target.value })}
                >
                  <option value="">Não informado</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Alergias?</label>
              <input
                type="text"
                placeholder="Ex: Penicilina, Amendoim"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                value={localSettings.allergies}
                onChange={(e) => setLocalSettings({ ...localSettings, allergies: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Toma remédio contínuo? Se sim, qual?</label>
              <input
                type="text"
                placeholder="Ex: Puran T4, Losartana, Insulina..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                value={localSettings.medications}
                onChange={(e) => setLocalSettings({ ...localSettings, medications: e.target.value })}
              />
            </div>
          </div>

          {/* Contatos Inseridos Dentro da Ficha conforme a Imagem */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Contatos de Emergência</h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                    {roleSuggestions[idx]}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={localSettings.contacts[idx]?.name || ''}
                      onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Ex: +55 11 99999-9999"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={localSettings.contacts[idx]?.phone || ''}
                      onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mensagem Base */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Mensagem de Socorro
        </h2>
        <textarea
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
          placeholder="Escreva a mensagem de alerta..."
          value={localSettings.message}
          onChange={(e) => setLocalSettings({ ...localSettings, message: e.target.value })}
        />
        <p className="mt-3 text-[10px] text-slate-400 leading-tight italic">
          * Por segurança do Android/iOS, o envio final deve ser confirmado manualmente no app de mensagens após o clique no SOS.
        </p>
      </section>

      <button
        onClick={handleSave}
        className="w-full bg-red-600 text-white font-extrabold py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg active:scale-[0.98] uppercase tracking-wider"
      >
        Salvar Ajustes
      </button>
    </div>
  );
};

export default SettingsPanel;
