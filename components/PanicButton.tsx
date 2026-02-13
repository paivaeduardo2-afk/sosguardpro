
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
  const [capturedPhotos, setCapturedPhotos] = useState<{front: string | null, back: string | null}>({ front: null, back: null });
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validContacts = settings.contacts.filter(c => c.phone.trim().length > 0).slice(0, 5);

  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      navigator.permissions.query({ name: 'camera' as any })
        .then((result) => {
          setCameraPermission(result.state as any);
          result.onchange = () => setCameraPermission(result.state as any);
        })
        .catch(() => {
          setCameraPermission('prompt');
        });
    }
  }, []);

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

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        stopStream();
        resolve(null);
      }, 4000)
    );

    const capturePromise = (async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: false 
        });
        
        setCameraPermission('granted');

        if (videoRef.current && canvasRef.current && activeStream) {
          videoRef.current.srcObject = activeStream;
          await new Promise((resolve) => {
            if (!videoRef.current) return resolve(false);
            videoRef.current.onloadedmetadata = () => resolve(true);
            if (videoRef.current.readyState >= 2) resolve(true);
          });
          await videoRef.current.play();
          await new Promise(r => setTimeout(r, 800));

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
        setCameraPermission('denied');
        stopStream();
        return null;
      }
    })();

    return Promise.race([capturePromise, timeoutPromise]);
  };

  const getEmergencyText = () => {
    const googleMapsUrl = location.latitude 
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` 
      : "Localização indisponível";
    
    let medicalInfo = '';
    if (settings.userName) medicalInfo += `\n👤 Nome: ${settings.userName}`;
    if (settings.bloodType) medicalInfo += `\n🩸 Sangue: ${settings.bloodType}`;
    if (settings.allergies) medicalInfo += `\n⚠️ Alergias: ${settings.allergies}`;

    return `🚨 *SOS GUARD - EMERGÊNCIA* 🚨\n\n${settings.message}\n${medicalInfo}\n\n📍 *LOCALIZAÇÃO*:\n${googleMapsUrl}`;
  };

  const handleSendToGroup = async () => {
    if (!settings.groupLink) return;
    
    const text = getEmergencyText();
    const groupUrl = `${settings.groupLink}${settings.groupLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
    
    const { front, back } = capturedPhotos;
    const files: File[] = [];
    if (front) files.push(dataURLtoFile(front, 'selfie_sos.jpg'));
    if (back) files.push(dataURLtoFile(back, 'ambiente_sos.jpg'));

    if (navigator.share && files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({
          title: 'SOS GRUPO',
          text: text,
          files: files
        });
        return;
      } catch (e) {}
    }
    
    window.open(groupUrl, '_blank');
  };

  const handleSendFullEmergency = async (contact: EmergencyContact) => {
    const { front, back } = capturedPhotos;
    const text = getEmergencyText();
    const files: File[] = [];

    if (front) files.push(dataURLtoFile(front, 'sos_selfie.jpg'));
    if (back) files.push(dataURLtoFile(back, 'sos_ambiente.jpg'));

    const shareData: any = {
      title: 'SOS EMERGÊNCIA',
      text: text,
    };

    if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
      shareData.files = files;
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleSMSFallback(contact);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        handleSMSFallback(contact);
      }
    }
  };

  const handleSMSFallback = (contact: EmergencyContact) => {
    const phone = contact.phone.replace(/\D/g, '');
    const text = getEmergencyText();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUri = `sms:${phone}${separator}body=${encodeURIComponent(text)}`;
    window.location.href = smsUri;
  };

  const handleDirectWhatsApp = (contact: EmergencyContact) => {
    const phone = formatPhoneForWhatsApp(contact.phone);
    const text = encodeURIComponent(getEmergencyText());
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleSOS = async () => {
    if (validContacts.length === 0 && !settings.groupLink) {
      alert("⚠️ Adicione contatos ou um link de grupo nos ajustes primeiro.");
      return;
    }

    if (navigator.vibrate) navigator.vibrate([500, 100, 500, 100, 500]);

    setIsSending(true);
    setLastAction("Capturando sua imagem...");
    const front = await capturePhotoWithTimeout('user');
    setCapturedPhotos(prev => ({ ...prev, front }));
    
    await new Promise(r => setTimeout(r, 600));
    
    setLastAction("Registrando ambiente...");
    const back = await capturePhotoWithTimeout('environment');
    setCapturedPhotos(prev => ({ ...prev, back }));

    setIsSending(false);
    setShowWhatsAppFollowup(true);
    setLastAction("Pronto para enviar!");
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 px-2 h-full">
      <video ref={videoRef} className="hidden" playsInline muted></video>
      <canvas ref={canvasRef} className="hidden"></canvas>

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
                <span className="text-white text-xs font-black uppercase tracking-widest">Ativando...</span>
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
              {location.error ? "Erro de GPS" : (lastAction || "Monitoramento Ativo")}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-5 animate-slide-up pb-10 overflow-y-auto no-scrollbar">
          <div className="bg-red-600 p-6 rounded-[2.5rem] shadow-2xl text-center border-4 border-white relative overflow-hidden">
            <h2 className="text-white font-black text-2xl italic uppercase tracking-tight relative z-10 leading-tight">SOLICITAR AJUDA AGORA</h2>
            <p className="text-white/80 text-[10px] font-black mt-1 uppercase relative z-10 tracking-widest">Selecione o destino do alerta:</p>
          </div>

          {settings.groupLink && (
            <div className="bg-green-50 p-5 rounded-3xl shadow-lg border-2 border-green-200 animate-pulse-fast">
               <button
                  onClick={handleSendToGroup}
                  className="w-full flex items-center justify-center gap-4 py-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-xl active:scale-95 border-b-8 border-green-800"
                >
                  <span className="font-black text-2xl uppercase tracking-tighter">ENVIAR PARA GRUPO</span>
                </button>
                <p className="text-center text-[10px] text-green-900 font-black uppercase mt-3 tracking-widest">Alerte todos de uma só vez!</p>
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <h3 className="text-[11px] font-black text-black uppercase tracking-widest text-center">Contatos Cadastrados</h3>
            <div className="grid grid-cols-1 gap-4">
              {validContacts.map((contact, idx) => (
                <div key={contact.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-black font-black text-lg">{contact.name || `Contato ${idx + 1}`}</span>
                    <span className="text-[9px] font-black text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 uppercase tracking-widest">PRIORIDADE</span>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSendFullEmergency(contact)}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-all shadow-lg active:scale-95 border-b-4 border-green-700"
                    >
                      <span className="font-black text-2xl uppercase tracking-tighter">ENVIAR</span>
                    </button>
                    
                    <div className="flex flex-col gap-1 items-center">
                      <button 
                        onClick={() => handleDirectWhatsApp(contact)}
                        className="text-[10px] text-green-900 font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                        Conversa no WhatsApp
                      </button>
                      <button 
                        onClick={() => handleSMSFallback(contact)}
                        className="text-[9px] text-slate-600 font-black uppercase tracking-widest hover:text-red-500 transition-colors"
                      >
                        Enviar via SMS direto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-1">
            <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-lg h-40">
              {capturedPhotos.front ? (
                <img src={capturedPhotos.front} className="w-full h-full object-cover" alt="Selfie" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase text-center p-2">Sem Selfie</div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] text-white font-black uppercase tracking-tighter">Sua Selfie</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-lg h-40">
              {capturedPhotos.back ? (
                <img src={capturedPhotos.back} className="w-full h-full object-cover" alt="Ambiente" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase text-center p-2">Sem Ambiente</div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] text-white font-black uppercase tracking-tighter">Ambiente</div>
            </div>
          </div>

          <button 
            onClick={() => {
              setShowWhatsAppFollowup(false);
              setCapturedPhotos({ front: null, back: null });
              setLastAction(null);
            }}
            className="w-full py-5 bg-slate-100 text-black font-black text-[10px] rounded-2xl uppercase tracking-[0.4em] active:scale-95 border border-slate-200"
          >
            Encerrar Alerta
          </button>
        </div>
      )}
    </div>
  );
};

export default PanicButton;
