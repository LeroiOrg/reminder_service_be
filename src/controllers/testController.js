import telegramService from '../services/telegramService.js';
import whatsappService from '../services/whatsappService.js';

/**
 * Test de Telegram - Info del bot
 */
export const testTelegramBot = async (req, res) => {
  try {
    const result = await telegramService.getBotInfo();
    
    if (result.ok) {
      const botInfo = result.result;
      res.json({
        status: 'success',
        message: 'Bot configurado correctamente',
        bot: {
          username: botInfo.username,
          firstName: botInfo.first_name,
          canJoinGroups: botInfo.can_join_groups,
          canReadAllGroupMessages: botInfo.can_read_all_group_messages
        }
      });
    } else {
      res.status(400).json({ error: 'Error al conectar con Telegram' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test de Telegram - Enviar mensaje
 */
export const testSendTelegram = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId y message son requeridos' });
    }

    const result = await telegramService.sendMessage(chatId, message);

    if (result.ok) {
      res.json({
        status: 'success',
        message: 'Mensaje enviado correctamente',
        telegramResponse: result
      });
    } else {
      res.status(400).json({ error: result.description || 'Error desconocido' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test de Telegram - Enviar con botón
 */
export const testSendTelegramWithButton = async (req, res) => {
  try {
    const { 
      chatId, 
      message = '🔥 ¡Hora de estudiar Python!', 
      buttonText = 'Ver Roadmap 📚',
      buttonUrl = 'https://leroi-front.vercel.app/roadmap'
    } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId es requerido' });
    }

    const result = await telegramService.sendMessageWithButton(
      chatId,
      message,
      buttonText,
      buttonUrl
    );

    if (result.ok) {
      res.json({
        status: 'success',
        message: 'Mensaje con botón enviado correctamente'
      });
    } else {
      res.status(400).json({ error: result.description });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test de WhatsApp - Enviar mensaje
 */
export const testSendWhatsApp = async (req, res) => {
  try {
    const { 
      toNumber, 
      message = '🧪 Mensaje de prueba desde Leroi Reminder Service' 
    } = req.body;

    if (!toNumber) {
      return res.status(400).json({ error: 'toNumber es requerido' });
    }

    const result = await whatsappService.sendMessage(toNumber, message);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Mensaje enviado correctamente por WhatsApp',
        twilioResponse: result
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test de WhatsApp - Enviar con link
 */
export const testSendWhatsAppWithLink = async (req, res) => {
  try {
    const {
      toNumber,
      message = '🔥 ¡Hora de estudiar Python!\n\nTema pendiente: Funciones\n→ Repasa: Parámetros y argumentos\n\n💡 Las funciones pueden recibir parámetros por defecto.',
      linkText = '📚 Ver mi Roadmap:',
      linkUrl = 'https://leroi-front.vercel.app/roadmap'
    } = req.body;

    if (!toNumber) {
      return res.status(400).json({ error: 'toNumber es requerido' });
    }

    const result = await whatsappService.sendMessageWithLink(
      toNumber,
      message,
      linkText,
      linkUrl
    );

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Mensaje con link enviado por WhatsApp'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
