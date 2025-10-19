import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://leroidevteam:pNRoSlb1lIav55Z9@leroi.j1keefw.mongodb.net/?retryWrites=true&w=majority&appName=Leroi';
const DB_NAME = 'leroi_learning';

class MongoService {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      if (this.client) {
        return this.db;
      }

      console.log('🔌 Conectando a MongoDB...');
      this.client = new MongoClient(MONGO_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      console.log('✅ Conectado a MongoDB');
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Desconectado de MongoDB');
    }
  }

  /**
   * Obtener el último roadmap generado por un usuario
   */
  async getLatestRoadmap(userEmail) {
    try {
      await this.connect();
      const conversations = this.db.collection('conversations');

      const latestRoadmap = await conversations.findOne(
        {
          user: userEmail,
          route: '/roadmaps'
        },
        {
          sort: { timestamp: -1 }
        }
      );

      if (!latestRoadmap) {
        console.log(`ℹ️ No se encontró roadmap para ${userEmail}`);
        return null;
      }

      const responseData = this._parseResponse(latestRoadmap.response);
      
      return {
        topic: this._extractTopic(latestRoadmap.prompt),
        roadmap: responseData.roadmap,
        extraInfo: responseData.extra_info || responseData.extraInfo,
        timestamp: latestRoadmap.timestamp
      };
    } catch (error) {
      console.error('❌ Error obteniendo roadmap:', error.message);
      return null;
    }
  }

  /**
   * Obtener todos los roadmaps de un usuario
   */
  async getUserRoadmaps(userEmail, limit = 20) {
    try {
      await this.connect();
      const conversations = this.db.collection('conversations');

      const roadmaps = await conversations
        .find({
          user: userEmail,
          route: '/roadmaps'
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return roadmaps.map(r => ({
        topic: this._extractTopic(r.prompt),
        roadmap: this._parseResponse(r.response).roadmap,
        timestamp: r.timestamp
      }));
    } catch (error) {
      console.error('❌ Error obteniendo roadmaps:', error.message);
      return [];
    }
  }

  /**
   * Buscar roadmap por tema específico
   */
  async getRoadmapByTopic(userEmail, topic) {
    try {
      await this.connect();
      const conversations = this.db.collection('conversations');

      const roadmap = await conversations.findOne(
        {
          user: userEmail,
          route: '/roadmaps',
          prompt: { $regex: topic, $options: 'i' }
        },
        {
          sort: { timestamp: -1 }
        }
      );

      if (!roadmap) {
        return null;
      }

      const responseData = this._parseResponse(roadmap.response);
      
      return {
        topic: this._extractTopic(roadmap.prompt),
        roadmap: responseData.roadmap,
        extraInfo: responseData.extra_info || responseData.extraInfo,
        timestamp: roadmap.timestamp
      };
    } catch (error) {
      console.error('❌ Error buscando roadmap:', error.message);
      return null;
    }
  }

  /**
   * Parsear el response de Python dict a JS object
   */
  _parseResponse(responseStr) {
    try {
      if (typeof responseStr === 'object') {
        return responseStr;
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

      return { roadmap, extra_info: {} };
    } catch (error) {
      console.error('❌ Error parseando response:', error.message);
      return { roadmap: {}, extra_info: {} };
    }
  }

  /**
   * Extraer el tema del prompt
   */
  _extractTopic(prompt) {
    const match = prompt.match(/tema:\s*(.+)/i);
    return match ? match[1].trim() : 'Tema desconocido';
  }
}

export default new MongoService();
