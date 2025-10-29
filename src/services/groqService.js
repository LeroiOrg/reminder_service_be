import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

class GroqService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  /**
   * Generar respuesta con Groq (usando llama)
   * @param {string} prompt - Pregunta del usuario
   * @param {Object} context - Contexto del roadmap (puede ser null)
   * @param {boolean} strictMode - Si true, solo responde sobre el roadmap
   * @returns {Promise<Object>}
   */
  async generateResponse(prompt, context = null, strictMode = true) {
    try {
      let fullPrompt = prompt;

      // Si hay contexto del roadmap, agregarlo
      if (context && context.roadmap) {
        const roadmapInfo = this._formatRoadmapContext(context);
        
        if (strictMode) {
          // MODO ESTRICTO: Solo responde sobre el roadmap
          fullPrompt = `
Eres un tutor educativo especializado EXCLUSIVAMENTE en "${context.topic || 'un tema específico'}".

CONTEXTO DEL ROADMAP:
${roadmapInfo}

IMPORTANTE: 
- SOLO puedes responder preguntas relacionadas con "${context.topic}" y los subtemas del roadmap.
- Si la pregunta NO está relacionada con el roadmap, responde: "Lo siento, solo puedo ayudarte con temas sobre ${context.topic}. ¿Tienes alguna pregunta al respecto?"
- NO inventes información fuera del contexto del roadmap.

PREGUNTA DEL ESTUDIANTE: ${prompt}

Respuesta (máximo 500 caracteres):
        `.trim();
        } else {
          // MODO NORMAL: Usa el roadmap como referencia pero puede responder otras cosas
          fullPrompt = `
Eres un tutor educativo inteligente. El estudiante está aprendiendo sobre "${context.topic || 'un tema específico'}".

CONTEXTO DEL ROADMAP:
${roadmapInfo}

PREGUNTA DEL ESTUDIANTE: ${prompt}

INSTRUCCIONES:
- Si la pregunta está relacionada con el tema que está estudiando, responde con base en el contexto del roadmap
- Si la pregunta es general, responde de manera educativa
- Sé claro, conciso y motivador
- Máximo 500 caracteres
- Si puedes, relaciona la respuesta con los subtemas del roadmap
        `.trim();
        }
      } else {
        // Sin contexto, respuesta genérica educativa
        fullPrompt = `
Eres un tutor educativo inteligente y amigable.

PREGUNTA: ${prompt}

Responde de manera clara, concisa y educativa. Máximo 500 caracteres.
        `.trim();
      }

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || 'No pude generar una respuesta.';

      return {
        success: true,
        response: response
      };
    } catch (error) {
      console.error('❌ Error con Groq AI:', error.message);
      return {
        success: false,
        error: error.message,
        response: 'Lo siento, hubo un error al procesar tu pregunta. Intenta de nuevo.'
      };
    }
  }

  /**
   * Formatear el contexto del roadmap para el prompt
   * @param {Object} context
   * @returns {string}
   */
  _formatRoadmapContext(context) {
    try {
      if (!context.roadmap) return 'No hay roadmap disponible';

      let formatted = `Tema Principal: ${context.topic}\n\n`;
      formatted += 'Subtemas del Roadmap:\n';

      // Recorrer los subtemas
      for (const [subtema, subsubtemas] of Object.entries(context.roadmap)) {
        formatted += `• ${subtema}\n`;
        if (Array.isArray(subsubtemas)) {
          subsubtemas.forEach(subsubtema => {
            formatted += `  - ${subsubtema}\n`;
          });
        }
      }

      // Si hay información extra, agregarla
      if (context.extraInfo && Object.keys(context.extraInfo).length > 0) {
        formatted += '\nInformación adicional disponible sobre algunos temas.\n';
      }

      return formatted;
    } catch (error) {
      console.error('Error formateando contexto:', error);
      return 'Roadmap disponible pero no se pudo formatear';
    }
  }

  /**
   * Generar mensaje motivacional para recordatorio
   * @param {string} topic - Tema que está estudiando
   * @param {number} daysInactive - Días sin estudiar
   * @returns {Promise<string>}
   */
  async generateMotivationalMessage(topic, daysInactive) {
    const prompt = `
Genera un mensaje motivacional corto (máximo 3 líneas) para un estudiante que está aprendiendo "${topic}" 
y lleva ${daysInactive} días sin estudiar. El mensaje debe ser amigable, motivador y animarlo a retomar sus estudios.
No uses emojis excesivos, máximo 2.
    `.trim();

    const result = await this.generateResponse(prompt);
    return result.response;
  }

  /**
   * Generar explicación de un subtema específico
   * @param {string} subtopic - Subtema a explicar
   * @param {Object} roadmapContext - Contexto completo del roadmap
   * @returns {Promise<string>}
   */
  async explainSubtopic(subtopic, roadmapContext) {
    const prompt = `Explícame de manera simple: ${subtopic}`;
    const result = await this.generateResponse(prompt, roadmapContext);
    return result.response;
  }

  /**
   * Sugerir qué estudiar hoy basado en el roadmap
   * @param {Object} roadmapContext - Contexto del roadmap
   * @returns {Promise<string>}
   */
  async suggestTodayTopic(roadmapContext) {
    try {
      if (!roadmapContext || !roadmapContext.topic) {
        return '¡Es un gran día para aprender algo nuevo! 📚';
      }

      const topic = roadmapContext.topic;

      const prompt = `
Genera un mensaje motivacional y educativo corto (máximo 4 líneas) para un estudiante que está aprendiendo sobre "${topic}".

El mensaje debe:
- Ser inspirador y motivante
- Mencionar algo interesante o útil sobre ${topic}
- Animar al estudiante a seguir aprendiendo
- Ser amigable y entusiasta
- Máximo 2-3 emojis

NO menciones subtemas específicos ni des instrucciones detalladas, solo un mensaje general y motivador.
      `.trim();

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 300
      });

      const response = completion.choices[0]?.message?.content || 
        `¡Hoy es un gran día para seguir aprendiendo ${topic}! 🚀 Cada paso que das te acerca más a tus objetivos. ¡Vamos, tú puedes! 💪`;

      return response;
    } catch (error) {
      console.error('❌ Error generando sugerencia:', error.message);
      const topic = roadmapContext?.topic || 'tu tema';
      return `¡Es momento de brillar! 🌟 Hoy es perfecto para avanzar en ${topic}. Recuerda: cada minuto que inviertes en aprender es un paso hacia el éxito. ¡Tú puedes lograrlo! 🚀`;
    }
  }
}

// Exportar instancia singleton
export default new GroqService();
