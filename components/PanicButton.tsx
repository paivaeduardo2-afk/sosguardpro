
import React, { useState, useRef } from 'react';
import { LocationData, AppSettings } from '../types';
import { getSafetyAdvice } from '../services/geminiService';

interface Props {
  location: LocationData;
  settings: AppSettings;
}

const PanicButton: React.FC<Props> = ({ location, settings }) => {
  const [isSending, setIsSending] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showWhatsAppFollowup, setShowWhatsAppFollowup] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{front: string | null, back: string | null}>({ front: null, back: null });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validContacts = settings.contacts.filter(c => c.phone.trim().length > 0);

  const capturePhoto = async (facingMode: 'user' | 'environment'): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }, 
        audio: false 
      });
      
      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) videoRef.current.onloadedmetadata = resolve;
        });
        await videoRef.current.play();
        
        // Pequena pausa para o auto-foco/exposição da câmera
        await new Promise(r => setTimeout(r, 500));

        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
          
          // Para a câmera
          stream.getTracks().forEach(track => track.stop());
          return dataUrl;
        }
      }
      return null;
    } catch (err) {
      console.error(`Erro ao capturar foto (${facingMode}):`, err);
      return null;
    }
  };

  const getEmergencyContent = (hasPhotos: boolean) => {
    const googleMapsUrl = location.latitude 
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` 
      : "Localização não obtida";
    
    let medicalInfo = '';
    if (settings.userName) medicalInfo += `\n👤 Nome: ${settings.userName}`;
    if (settings.bloodType) medicalInfo += `\n🩸 Sangue: ${settings.bloodType}`;
    if (settings.isOrganDonor) medicalInfo += `\n❤️ Doador: ${settings.isOrganDonor}`;
    if (settings.allergies) medicalInfo += `\n⚠️ Alergias: ${settings.allergies}`;
    if (settings.medications) medicalInfo += `\n💊 Remédio Contínuo: ${settings.medications}`;

    const photoNote = hasPhotos ? "\n📸 EVIDÊNCIA: Fotos capturadas no local." : "";

    const text = `🚨 SOS GUARD - EMERGÊNCIA 🚨\n\n${settings.message}\n${medicalInfo}${photoNote}\n\n📍 LOCALIZAÇÃO:\n${googleMapsUrl}`;
    
    return { text, mapsUrl: googleMapsUrl };
  };

  const handleSOS = async () => {
    if (validContacts.length === 0) {
      alert("⚠️ Configure seus contatos de emergência primeiro!");
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    setIsSending(true);
    setAdvice(null);
    setShowWhatsAppFollowup(false);
    setLastAction("Capturando fotos...");

    // Captura Frontal
    const frontPhoto = await capturePhoto('user');
    setCapturedPhotos(prev => ({ ...prev, front: frontPhoto }));
    
    setLastAction("Capturando ambiente...");
    // Captura Traseira
    const backPhoto = await capturePhoto('environment');
    setCapturedPhotos(prev => ({ ...prev, back: backPhoto }));

    setLastAction("Preparando SMS...");

    getSafetyAdvice(location.latitude ? `${location.latitude}, ${location.longitude}` : "Desconhecida")
      .then(setAdvice);

    const { text: fullMessage } = getEmergencyContent(!!(frontPhoto || backPhoto));
    const phones = validContacts.map(c => c.phone.replace(/\D/g, ''));
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const phoneString = phones.join(',');
    const smsUri = isIOS 
      ? `sms:${phoneString}&body=${encodeURIComponent(fullMessage)}`
      : `sms:${phoneString}?body=${encodeURIComponent(fullMessage)}`;
    
    setTimeout(() => {
      window.location.href = smsUri;
      setIsSending(false);
      setLastAction("Envie o SMS agora!");
      setShowWhatsAppFollowup(true);
    }, 800);
  };

  const sendWhatsApp = (phone: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }

    const { text } = getEmergencyContent(!!(capturedPhotos.front || capturedPhotos.back));
    const cleanPhone = phone.replace(/\D/g, '');
    const waUri = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUri, '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      {/* Elementos ocultos para captura de foto */}
      <video ref={videoRef} className="hidden" playsInline muted></video>
      <canvas ref={canvasRef} className="hidden"></canvas>

      {!showWhatsAppFollowup ? (
        <>
          <div className="relative flex items-center justify-center">
            {!isSending && (
              <>
                <div className="sos-ring"></div>
                <div className="sos-ring"></div>
              </>
            )}
            
            <button
              onClick={handleSOS}
              disabled={isSending}
              className={`
                relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-90
                ${isSending ? 'bg-slate-800' : 'bg-sos-600 hover:bg-sos-700 shadow-sos-600/40'}
              `}
            >
              {isSending ? (
                <div className="flex flex-col items-center animate-pulse">
                  <svg className="w-16 h-16 text-white mb-2 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-white text-lg font-bold uppercase tracking-widest">{lastAction?.split(' ')[0] || "Iniciando"}</span>
                </div>
              ) : (
                <>
                  <svg className="w-24 h-24 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span className="text-white text-5xl font-black tracking-tighter mt-2">SOS</span>
                  <span className="text-sos-50/70 text-[10px] uppercase font-extrabold tracking-[0.2em] mt-3">Toque para AJUDA</span>
                </>
              )}
            </button>
          </div>

          <div className="px-6 w-full text-center">
            <div className={`py-2 px-6 rounded-2xl transition-all inline-flex items-center gap-2 ${isSending ? 'bg-sos-50 text-sos-700' : 'bg-slate-100 text-slate-500'}`}>
              <p className="text-sm font-bold tracking-tight">
                {lastAction || "Dispositivo Armado"}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full space-y-4 animate-slide-up">
          <div className="bg-green-50 border border-green-100 p-6 rounded-3xl shadow-sm text-center">
            <h2 className="text-green-900 font-extrabold text-xl">SOS Ativado!</h2>
            <p className="text-green-700 text-sm mt-1 font-medium">Fotos e localização registradas.</p>
          </div>

          {/* Galeria de Evidências Capturadas */}
          <div className="grid grid-cols-2 gap-3">
            {capturedPhotos.front && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md">
                <img src={capturedPhotos.front} alt="Frontal" className="w-full h-32 object-cover" />
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] px-2 py-1 rounded-full font-bold uppercase">Selfie</span>
              </div>
            )}
            {capturedPhotos.back && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md">
                <img src={capturedPhotos.back} alt="Traseira" className="w-full h-32 object-cover" />
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] px-2 py-1 rounded-full font-bold uppercase">Ambiente</span>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase text-center mb-2 tracking-widest">Enviar reforço para:</p>
            {validContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => sendWhatsApp(contact.phone)}
                className="w-full bg-white border-2 border-green-500 p-4 rounded-2xl flex items-center justify-between hover:bg-green-50 transition-colors shadow-sm active:scale-95 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Enviar para</p>
                    <p className="text-slate-800 font-extrabold">{contact.name || contact.phone}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setShowWhatsAppFollowup(false);
              setCapturedPhotos({ front: null, back: null });
            }}
            className="w-full text-slate-400 text-xs font-bold py-2 uppercase tracking-widest hover:text-slate-600"
          >
            Limpar e Voltar
          </button>
        </div>
      )}

      {advice && !showWhatsAppFollowup && (
        <div className="bg-white border-l-4 border-sos-600 p-5 rounded-2xl w-full shadow-md animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="bg-sos-50 p-2 rounded-lg">
              <svg className="w-5 h-5 text-sos-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900 font-bold text-sm mb-1">Guia de Emergência AI</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {advice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanicButton;
