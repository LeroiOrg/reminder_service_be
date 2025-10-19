import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Generar respuesta con Gemini
   */
  async generateResponse(prompt, context = null) {
    try {
      let fullPrompt = prompt;

      // Si hay contexto del roadmap, agregarlo
      if (context) {
        fullPrompt = `
Contexto: El usuario está estudiando "${context.roadmapTitle}".
Temas del roadmap: ${JSON.stringify(context.topics, null, 2)}
Tema actual: ${context.currentTopic || 'No especificado'}

Pregunta del usuario: ${prompt}

Responde de manera clara, concisa y educativa. Si la pregunta está relacionada con el tema que está estudiando, enfócate en ese contexto.
        `.trim();
      }

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text
      };
    } catch (error) {
      console.error('❌ Error con Gemini AI:', error.message);
      return {
        success: false,
        error: error.message,
        response: 'Lo siento, hubo un error al procesar tu pregunta. Intenta de nuevo.'
      };
    }
  }

  /**
   * Generar mensaje motivacional para recordatorio
   */
  async generateMotivationalMessage(roadmapTitle, daysInactive) {
    const prompt = `
Genera un mensaje motivacional corto (máximo 3 líneas) para un estudiante que está aprendiendo "${roadmapTitle}" 
y lleva ${daysInactive} días sin estudiar. El mensaje debe ser amigable, motivador y animarlo a retomar sus estudios.
No uses emojis excesivos, máximo 2.
    `.trim();

    const result = await this.generateResponse(prompt);
    return result.response;
  }
}

// Exportar instancia singleton
export default new GeminiService();
