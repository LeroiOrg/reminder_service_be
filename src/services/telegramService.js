import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Enviar mensaje de texto
   */
  async sendMessage(chatId, message, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML'
      };

      // Solo agregar reply_markup si existe
      if (options.replyMarkup) {
        payload.reply_markup = options.replyMarkup;
      }

      const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando mensaje Telegram:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con botón inline
   */
  async sendMessageWithButton(chatId, message, buttonText, buttonUrl) {
    const replyMarkup = {
      inline_keyboard: [[
        {
          text: buttonText,
          url: buttonUrl
        }
      ]]
    };

    return this.sendMessage(chatId, message, { replyMarkup });
  }

  /**
   * Obtener información del bot
   */
  async getBotInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo info del bot:', error.message);
      throw error;
    }
  }

  /**
   * Configurar webhook
   */
  async setWebhook(webhookUrl) {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url: webhookUrl
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error configurando webhook:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar webhook
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
      return response.data;
    } catch (error) {
      console.error('❌ Error eliminando webhook:', error.message);
      throw error;
    }
  }

  /**
   * Obtener información del webhook
   */
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo info del webhook:', error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new TelegramService();
