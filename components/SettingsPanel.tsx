
import React, { useState } from 'react';
import { AppSettings, EmergencyContact } from '../types';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsPanel: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const roleSuggestions = ["Pai", "Mãe", "Amigo (a)", "Tio (a)", "Outro"];

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...localSettings.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setLocalSettings({ ...localSettings, contacts: newContacts });
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          Ficha Médica de Emergência
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase ml-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                value={localSettings.userName}
                onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase ml-1">Tipo Sanguíneo</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all"
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
                <label className="text-[10px] font-bold text-slate-700 uppercase ml-1">Doador de Órgãos?</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={localSettings.isOrganDonor}
                  onChange={(e) => setLocalSettings({ ...localSettings, isOrganDonor: e.target.value })}
                >
                  <option value="">Não informado</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
            </div>

            {/* NOVOS CAMPOS ADICIONADOS AQUI */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase ml-1">Alergia</label>
              <input
                type="text"
                placeholder="Ex: Penicilina, pólen, etc."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                value={localSettings.allergies}
                onChange={(e) => setLocalSettings({ ...localSettings, allergies: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase ml-1">Usa remédio de uso contínuo, qual?</label>
              <input
                type="text"
                placeholder="Nome do(s) medicamento(s)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                value={localSettings.medications}
                onChange={(e) => setLocalSettings({ ...localSettings, medications: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-4">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">Contatos Individuais</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-700 uppercase ml-1">{roleSuggestions[idx] || `Contato ${idx + 1}`}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-black focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                      value={localSettings.contacts[idx]?.name || ''}
                      onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="DDD + Número"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-black focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                      value={localSettings.contacts[idx]?.phone || ''}
                      onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-green-700 uppercase tracking-[0.15em]">Grupo de Emergência (WhatsApp)</h3>
              <span className="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Melhor Opção</span>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-700 uppercase ml-1">Link de Convite do Grupo</label>
              <input
                type="text"
                placeholder="https://chat.whatsapp.com/..."
                className="w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-xs text-black focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-400"
                value={localSettings.groupLink || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, groupLink: e.target.value })}
              />
              <p className="mt-1.5 text-[9px] text-slate-600 leading-tight italic">
                * Crie um grupo no WhatsApp com seus contatos e cole o link aqui para alertar todos de uma vez.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">Mensagem de Alerta</h2>
        <textarea
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none placeholder:text-slate-400"
          placeholder="Escreva a mensagem de alerta..."
          value={localSettings.message}
          onChange={(e) => setLocalSettings({ ...localSettings, message: e.target.value })}
        />
      </section>

      <button
        onClick={handleSave}
        className="w-full bg-red-600 text-white font-extrabold py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg active:scale-[0.98] uppercase tracking-wider"
      >
        Salvar Configurações
      </button>
    </div>
  );
};

export default SettingsPanel;
