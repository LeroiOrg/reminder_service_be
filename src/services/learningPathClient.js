import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LEARNING_PATH_URL = process.env.LEARNING_SERVICE_URL || 'http://localhost:8080';

class LearningPathClient {
  constructor() {
    this.baseURL = LEARNING_PATH_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Obtener roadmap por tema
   * @param {string} topic - Tema del roadmap
   * @param {string} token - JWT token del usuario
   * @returns {Promise<Object>}
   */
  async getRoadmapByTopic(topic, token) {
    try {
      console.log(`📚 Solicitando roadmap para: ${topic}`);
      
      const response = await this.client.post(
        '/learning_path/roadmaps',
        { topic },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      return {
        success: true,
        roadmap: response.data.roadmap,
        extraInfo: response.data.extra_info
      };
    } catch (error) {
      console.error('❌ Error obteniendo roadmap:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener temas relacionados
   * @param {string} topic - Tema principal
   * @param {string} token - JWT token
   * @returns {Promise<Object>}
   */
  async getRelatedTopics(topic, token) {
    try {
      console.log(`🔗 Buscando temas relacionados con: ${topic}`);
      
      const response = await this.client.post(
        '/learning_path/related-topics',
        { topic },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      return {
        success: true,
        relatedTopics: response.data.related_topics
      };
    } catch (error) {
      console.error('❌ Error obteniendo temas relacionados:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar preguntas de práctica
   * @param {string} topic - Tema para generar preguntas
   * @param {string} token - JWT token
   * @returns {Promise<Object>}
   */
  async generateQuestions(topic, token) {
    try {
      console.log(`❓ Generando preguntas para: ${topic}`);
      
      const response = await this.client.post(
        '/learning_path/questions',
        { topic },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      // La respuesta viene como string JSON, parsearlo
      const questions = JSON.parse(response.data);

      return {
        success: true,
        questions
      };
    } catch (error) {
      console.error('❌ Error generando preguntas:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar si el servicio está disponible
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Learning Path Service no disponible:', error.message);
      return false;
    }
  }

  /**
   * Procesar un tema y obtener información completa
   * Esta función combina roadmap + temas relacionados + preguntas
   * @param {string} topic - Tema principal
   * @param {string} token - JWT token
   * @returns {Promise<Object>}
   */
  async getCompleteTopicInfo(topic, token) {
    try {
      console.log(`🎯 Obteniendo información completa de: ${topic}`);

      // Obtener roadmap
      const roadmapResult = await this.getRoadmapByTopic(topic, token);
      
      if (!roadmapResult.success) {
        return {
          success: false,
          error: 'No se pudo obtener el roadmap'
        };
      }

      // Obtener temas relacionados (opcional)
      const relatedResult = await this.getRelatedTopics(topic, token);

      return {
        success: true,
        topic,
        roadmap: roadmapResult.roadmap,
        extraInfo: roadmapResult.extraInfo,
        relatedTopics: relatedResult.success ? relatedResult.relatedTopics : []
      };
    } catch (error) {
      console.error('❌ Error obteniendo información completa:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instancia singleton
export default new LearningPathClient();
