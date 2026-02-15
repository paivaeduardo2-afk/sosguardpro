
import React, { useState, useRef, useEffect } from 'react';
import { LocationData, AppSettings, EmergencyContact } from '../types';

interface Props {
  location: LocationData;
  settings: AppSettings;
}

const PanicButton: React.FC<Props> = ({ location, settings }) => {
  const [isSending, setIsSending] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showWhatsAppFollowup, setShowWhatsAppFollowup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSentIndividual, setHasSentIndividual] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{front: string | null, back: string | null}>({ front: null, back: null });
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validContacts = settings.contacts.filter(c => c.phone.trim().length > 0).slice(0, 5);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    return cleaned;
  };

  const capturePhotoWithTimeout = async (facingMode: 'user' | 'environment'): Promise<string | null> => {
    let activeStream: MediaStream | null = null;
    const stopStream = () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
      }
    };

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }, 
        audio: false 
      });
      
      if (videoRef.current && canvasRef.current && activeStream) {
        videoRef.current.srcObject = activeStream;
        await new Promise((resolve) => {
          if (!videoRef.current) return resolve(false);
          videoRef.current.onloadedmetadata = () => resolve(true);
          if (videoRef.current.readyState >= 2) resolve(true);
        });
        
        await videoRef.current.play();
        await new Promise(r => setTimeout(r, 1000));

        const context = canvasRef.current.getContext('2d');
        if (context && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 480;
          context.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
          stopStream();
          return dataUrl;
        }
      }
      return null;
    } catch (err) {
      setCameraError("Câmera indisponível");
      stopStream();
      return null;
    }
  };

  const getEmergencyText = () => {
    const googleMapsUrl = location.latitude 
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` 
      : "Localização indisponível";
    
    let medicalInfo = '';
    if (settings.userName) medicalInfo += `\n👤 Nome: ${settings.userName}`;
    if (settings.bloodType) medicalInfo += `\n🩸 Sangue: ${settings.bloodType}`;
    if (settings.allergies) medicalInfo += `\n⚠️ Alergias: ${settings.allergies}`;
    if (settings.medications) medicalInfo += `\n💊 Remédios: ${settings.medications}`;

    return `🚨 *SOS GUARD - EMERGÊNCIA* 🚨\n\n${settings.message}\n${medicalInfo}\n\n📍 *LOCALIZAÇÃO*:\n${googleMapsUrl}`;
  };

  const handleActionComplete = (isGroup: boolean = false) => {
    if (isGroup) {
      setIsSuccess(true);
    } else {
      setHasSentIndividual(true);
      setLastAction("Envio realizado!");
    }
  };

  const handleSendToGroup = async () => {
    if (!settings.groupLink) return;
    
    const text = getEmergencyText();
    const { front, back } = capturedPhotos;
    const files: File[] = [];
    if (front) files.push(dataURLtoFile(front, 'selfie_sos.jpg'));
    if (back) files.push(dataURLtoFile(back, 'ambiente_sos.jpg'));

    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ title: 'SOS GRUPO', text: text, files: files });
        handleActionComplete(true);
        return;
      } catch (e) {
        console.warn("Share falhou", e);
      }
    }
    
    const groupUrl = `${settings.groupLink}${settings.groupLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
    window.location.href = groupUrl;
    setTimeout(() => handleActionComplete(true), 2000);
  };

  const handleSendFullEmergency = async (contact: EmergencyContact) => {
    const { front, back } = capturedPhotos;
    const text = getEmergencyText();
    const files: File[] = [];

    if (front) files.push(dataURLtoFile(front, 'sos_selfie.jpg'));
    if (back) files.push(dataURLtoFile(back, 'sos_ambiente.jpg'));

    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ title: 'SOS EMERGÊNCIA', text: text, files: files });
        handleActionComplete(false);
      } catch (err) {
        handleDirectWhatsApp(contact);
      }
    } else {
      handleDirectWhatsApp(contact);
    }
  };

  const handleDirectWhatsApp = (contact: EmergencyContact) => {
    const phone = formatPhoneForWhatsApp(contact.phone);
    const text = encodeURIComponent(getEmergencyText());
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${text}`;
    const fallbackUrl = `https://wa.me/${phone}?text=${text}`;
    
    try {
      window.location.href = whatsappUrl;
      setTimeout(() => {
        if (document.hasFocus()) window.location.href = fallbackUrl;
      }, 500);
    } catch (e) {
      window.location.href = fallbackUrl;
    }
    setTimeout(() => handleActionComplete(false), 2000);
  };

  const handleSMSFallback = (contact: EmergencyContact) => {
    const phone = contact.phone.replace(/\D/g, '');
    const text = getEmergencyText();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUri = `sms:${phone}${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`;
    window.location.href = smsUri;
    setTimeout(() => handleActionComplete(false), 1000);
  };

  const handleSOS = async () => {
    if (validContacts.length === 0 && !settings.groupLink) {
      alert("⚠️ Configure seus contatos primeiro.");
      return;
    }

    if (navigator.vibrate) navigator.vibrate([500, 100, 500]);

    setIsSending(true);
    setCameraError(null);
    setHasSentIndividual(false);
    
    try {
      setLastAction("Capturando selfie...");
      const front = await capturePhotoWithTimeout('user');
      setCapturedPhotos(prev => ({ ...prev, front }));
      
      await new Promise(r => setTimeout(r, 500));
      
      setLastAction("Capturando ambiente...");
      const back = await capturePhotoWithTimeout('environment');
      setCapturedPhotos(prev => ({ ...prev, back }));
    } catch (e) {
      setLastAction("Erro na captura");
    }

    setIsSending(false);
    setShowWhatsAppFollowup(true);
  };

  const resetAll = () => {
    setIsSuccess(false);
    setShowWhatsAppFollowup(false);
    setHasSentIndividual(false);
    setCapturedPhotos({ front: null, back: null });
    setLastAction(null);
    setCameraError(null);
  };

  const handleFinalFinish = () => {
    setIsSuccess(true);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 px-2 h-full relative">
      <video ref={videoRef} className="hidden" playsInline muted></video>
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* MODAL DE SUCESSO FINAL */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-slide-up text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">ALERTA ENVIADO COM SUCESSO!</h2>
          <p className="text-slate-500 font-medium mb-10">Seus contatos foram notificados sobre a emergência.</p>
          <button 
            onClick={resetAll}
            className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 uppercase tracking-widest border-b-8 border-green-800"
          >
            Finalizar Alerta
          </button>
        </div>
      )}

      {!showWhatsAppFollowup ? (
        <div className="relative flex flex-col items-center w-full justify-center flex-1 py-10">
          {!isSending && (
            <>
              <div className="sos-ring" style={{ width: '280px', height: '280px' }}></div>
              <div className="sos-ring" style={{ width: '280px', height: '280px', animationDelay: '1s' }}></div>
            </>
          )}
          
          <button
            onClick={handleSOS}
            disabled={isSending}
            className={`
              relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-90
              ${isSending ? 'bg-slate-800' : 'bg-red-600 hover:bg-red-700 shadow-red-600/40'}
              border-8 border-white
            `}
          >
            {isSending ? (
              <div className="flex flex-col items-center animate-pulse">
                <span className="text-white text-xs font-black uppercase tracking-widest">Processando...</span>
                <span className="text-white/60 text-[10px] mt-2 font-bold">{lastAction}</span>
              </div>
            ) : (
              <>
                <span className="text-white text-8xl font-black italic tracking-tighter leading-none">SOS</span>
                <span className="text-white/80 text-[11px] font-bold mt-3 uppercase tracking-[0.2em]">Pressione para socorro</span>
              </>
            )}
          </button>
          
          <div className="mt-12 px-8 py-3 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm">
            <p className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${isSending ? 'bg-amber-500 animate-pulse' : (location.error ? 'bg-red-500' : 'bg-green-600')}`}></span>
              {location.error ? "Aguardando GPS..." : (cameraError || lastAction || "Sistema Pronto")}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-5 animate-slide-up pb-10 overflow-y-auto no-scrollbar">
          <div className="bg-red-600 p-6 rounded-[2.5rem] shadow-2xl text-center border-4 border-white">
            <h2 className="text-white font-black text-2xl italic uppercase tracking-tight leading-tight">ENVIAR ALERTA</h2>
            <p className="text-white/80 text-[10px] font-black mt-1 uppercase tracking-widest">Selecione os contatos abaixo</p>
          </div>

          {settings.groupLink && (
            <div className="bg-green-50 p-5 rounded-3xl shadow-lg border-2 border-green-200">
               <button
                  onClick={handleSendToGroup}
                  className="w-full flex flex-col items-center justify-center py-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-xl active:scale-95 border-b-8 border-green-800"
                >
                  <span className="font-black text-2xl uppercase tracking-tighter">ENVIAR NO GRUPO</span>
                  <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1">Alerta Instantâneo</span>
                </button>
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Contatos Individuais</h3>
            <div className="grid grid-cols-1 gap-4">
              {validContacts.map((contact, idx) => (
                <div key={contact.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-black text-lg">{contact.name || `Contato ${idx + 1}`}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleSendFullEmergency(contact)}
                      className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 flex items-center justify-center gap-2 border-b-4 border-green-700"
                    >
                      WhatsApp
                    </button>
                    <button 
                      onClick={() => handleSMSFallback(contact)}
                      className="w-full py-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest"
                    >
                      Enviar via SMS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-1">
            <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 h-32 bg-slate-100 shadow-inner">
              {capturedPhotos.front ? (
                <img src={capturedPhotos.front} className="w-full h-full object-cover" alt="Selfie" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase text-center p-2">Sem Selfie</div>
              )}
            </div>
            <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 h-32 bg-slate-100 shadow-inner">
              {capturedPhotos.back ? (
                <img src={capturedPhotos.back} className="w-full h-full object-cover" alt="Ambiente" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase text-center p-2">Sem Ambiente</div>
              )}
            </div>
          </div>

          {/* BOTÃO DE FINALIZAÇÃO CONDICIONAL */}
          <button 
            onClick={hasSentIndividual ? handleFinalFinish : resetAll}
            className={`w-full py-5 font-black text-[10px] rounded-2xl uppercase tracking-[0.4em] active:scale-95 transition-all duration-300 border-2 ${
              hasSentIndividual 
              ? 'bg-red-600 text-white border-white shadow-xl animate-pulse-fast' 
              : 'bg-slate-200 text-slate-600 border-slate-300'
            }`}
          >
            {hasSentIndividual ? 'Concluir e Finalizar Alerta' : 'Cancelar Alerta'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PanicButton;
