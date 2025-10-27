import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LEARNING_SERVICE_URL = process.env.LEARNING_SERVICE_URL || 'http://localhost:8080';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal_service_key_123';

class LearningPathClient {
  /**
   * Obtener todos los roadmaps de un usuario
   */
  async getUserRoadmaps(userEmail, limit = 20) {
    try {
      const response = await axios.get(
        `${LEARNING_SERVICE_URL}/learning_path/roadmaps/user/${userEmail}`,
        {
          params: { limit },
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY
          }
        }
      );

      if (response.data.success) {
        return response.data.data.map(conv => ({
          topic: this._extractTopic(conv.prompt),
          roadmap: this._parseResponse(conv.response),
          timestamp: conv.timestamp,
          sessionId: conv.session_id
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Error obteniendo roadmaps del usuario:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Obtener el último roadmap de un usuario
   */
  async getLatestRoadmap(userEmail) {
    try {
      const response = await axios.get(
        `${LEARNING_SERVICE_URL}/learning_path/roadmaps/user/${userEmail}/latest`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY
          }
        }
      );

      if (response.data.success && response.data.data) {
        const conv = response.data.data;
        return {
          topic: this._extractTopic(conv.prompt),
          roadmap: this._parseResponse(conv.response),
          timestamp: conv.timestamp,
          sessionId: conv.session_id
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo último roadmap:', error.message);
      return null;
    }
  }

  /**
   * Buscar roadmap por tema específico
   */
  async getRoadmapByTopic(userEmail, topic) {
    try {
      const roadmaps = await this.getUserRoadmaps(userEmail, 50);
      
      // Buscar por coincidencia de tema
      const matchingRoadmap = roadmaps.find(r => 
        r.topic.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(r.topic.toLowerCase())
      );

      return matchingRoadmap || null;
    } catch (error) {
      console.error('❌ Error buscando roadmap por tema:', error.message);
      return null;
    }
  }

  /**
   * Extraer el tema del prompt
   */
  _extractTopic(prompt) {
    const match = prompt.match(/tema:\s*(.+)/i);
    return match ? match[1].trim() : 'Tema desconocido';
  }

  /**
   * Parsear el response de Python dict a JS object
   */
  _parseResponse(responseStr) {
    try {
      if (typeof responseStr === 'object') {
        return responseStr.roadmap || responseStr;
      }

      // Parser manual para manejar Python dicts con comillas simples
      const roadmap = {};
      
      // Buscar el contenido del roadmap principal
      const mainRoadmapMatch = responseStr.match(/'roadmap':\s*\{([^}]+\{[^}]+\}[^}]*)\}/s);
      
      if (mainRoadmapMatch) {
        const content = mainRoadmapMatch[1];
        
        // Extraer cada subtema con sus items
        const subthemeMatches = content.matchAll(/'([^']+)':\s*\[([^\]]+)\]/g);
        
        for (const match of subthemeMatches) {
          const subtheme = match[1];
          const items = match[2]
            .split(/,\s*'/)
            .map(item => item.replace(/'/g, '').trim())
            .filter(item => item.length > 0);
          
          roadmap[subtheme] = items;
        }
      }

      return roadmap;
    } catch (error) {
      console.error('❌ Error parseando response:', error.message);
      return {};
    }
  }
}

export default new LearningPathClient();
