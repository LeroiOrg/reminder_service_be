import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:8000';

class AuthServiceClient {
  constructor() {
    this.baseURL = AUTH_SERVICE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Obtener información de un usuario por email
   * @param {string} email - Email del usuario
   * @param {string} token - JWT token (si es necesario)
   * @returns {Promise<Object>} - Datos del usuario
   */
  async getUserByEmail(email, token) {
    try {
      console.log(`🔍 Consultando usuario: ${email}`);
      const response = await this.client.get('/user-profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      return {
        success: true,
        user: response.data.data
      };
    } catch (error) {
      console.error('❌ Error consultando Auth Service:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar usuario por telegram_chat_id
   * NOTA: Este endpoint debe ser creado en Auth Service eventualmente
   * Por ahora usamos un fallback
   * @param {string} telegramChatId
   * @returns {Promise<Object>}
   */
  async getUserByTelegramId(telegramChatId) {
    try {
      console.log(`🔍 Buscando usuario con telegram_chat_id: ${telegramChatId}`);
      
      // TODO: Implementar endpoint en Auth Service
      // Por ahora retornamos null (usuario no vinculado)
      return {
        success: false,
        message: 'Endpoint no disponible aún en Auth Service',
        user: null
      };
    } catch (error) {
      console.error('❌ Error buscando por Telegram ID:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar si el servicio de Auth está disponible
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Auth Service no disponible:', error.message);
      return false;
    }
  }
}

// Exportar instancia singleton
export default new AuthServiceClient();
