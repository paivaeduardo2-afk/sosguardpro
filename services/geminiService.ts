
import { GoogleGenAI } from "@google/genai";

// Polyfill básico para o objeto process em ambiente de navegador para evitar ReferenceError
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

const getAIClient = () => {
  // Assume que a chave de API está configurada no ambiente ou injetada pelo Vercel
  const apiKey = (process.env && process.env.API_KEY) || "";
  return new GoogleGenAI({ apiKey });
};

export const getSafetyAdvice = async (location: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário está em uma situação de possível perigo na localização: ${location}. Forneça 3 instruções de segurança curtas, calmas e acionáveis em Português Brasileiro.`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 150,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return "Mantenha a calma. Procure um local iluminado e com movimento. Evite áreas isoladas e tente contato visual com estabelecimentos comerciais próximos.";
  }
};

export const optimizeSOSMessage = async (baseMessage: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Melhore esta mensagem de emergência para ser direta e urgente, adequada para SMS: "${baseMessage}". Responda apenas com o texto da mensagem.`,
      config: {
        temperature: 0.3,
      }
    });
    return response.text?.trim() || baseMessage;
  } catch (error) {
    return baseMessage;
  }
};
