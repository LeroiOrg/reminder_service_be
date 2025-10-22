import telegramService from '../services/telegramService.js';
import groqService from '../services/groqService.js';
import mongoService from '../services/mongoService.js';
import { userNotificationSettingsService } from '../mongodb/index.js';

/**
 * Manejar webhook de Telegram
 */
export const handleTelegramWebhook = async (req, res) => {
  try {
    const data = req.body;
    console.log('📨 Webhook recibido:', JSON.stringify(data, null, 2));

    const message = data.message;

    if (!message) {
      return res.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const userFirstName = message.chat.first_name || 'Usuario';

    console.log(`👤 Usuario: ${userFirstName} (chat_id: ${chatId})`);
    console.log(`💬 Mensaje: ${text}`);

    // ==========================================
    // COMANDOS
    // ==========================================
    
    if (text.toLowerCase() === '/start') {
      const responseText = `¡Hola ${userFirstName}! 👋\n\n` +
        `Soy tu asistente de estudio de Leroi.\n\n` +
        `**Comandos:**\n` +
        `• /vincular - Obtén tu código para vincular\n` +
        `• /listar - Ver tus roadmaps\n` +
        `• /roadmap - Ver roadmap activo\n` +
        `• /cambiar [tema] - Cambiar roadmap\n` +
        `• /help - Ayuda completa\n\n` +
        `💡 Empieza con /vincular`;

      await telegramService.sendMessage(chatId, responseText);
    } 
    
    else if (text.toLowerCase() === '/vincular') {
      // Mostrar el chat_id para que el usuario lo vincule en la web
      const responseText = `🔗 **Vincular cuenta**\n\n` +
        `Tu Chat ID de Telegram es:\n\n` +
        `\`${chatId}\`\n\n` +
        `**Pasos para vincular:**\n` +
        `1. Ve a leroi.app/profile\n` +
        `2. En la sección "Telegram", pega este código\n` +
        `3. Haz click en "Vincular Telegram"\n\n` +
        `Una vez vinculado, podré enviarte recordatorios personalizados de tus roadmaps. 🚀`;

      await telegramService.sendMessage(chatId, responseText);
    }
    
    else if (text.toLowerCase() === '/help') {
      const responseText = `📚 **Guía de Uso - Leroi Bot**\n\n` +
        `🔗 **1. Vinculación:**\n` +
        `/vincular - Obtén tu código\n` +
        `Luego ingésalo en leroi.app/profile\n\n` +
        `📊 **2. Roadmaps:**\n` +
        `/listar - Ver todos tus roadmaps\n` +
        `/cambiar [tema] - Activar roadmap\n` +
        `   Ejemplo: \`/cambiar Machine Learning\`\n` +
        `/roadmap - Ver detalles del activo\n\n` +
        `💬 **3. Preguntar:**\n` +
        `Escribe tu pregunta directamente\n` +
        `El bot responde sobre tu roadmap activo\n\n` +
        `🎯 **Flujo de uso:**\n` +
        `1. /vincular (víncula cuenta)\n` +
        `2. /listar (ve tus roadmaps)\n` +
        `3. /cambiar React (activa React)\n` +
        `4. Pregunta: ¿Qué son los hooks?`;

      await telegramService.sendMessage(chatId, responseText);
    }
    
    else if (text.toLowerCase() === '/roadmap') {
      // Buscar el usuario vinculado en MongoDB
      const userSettings = await userNotificationSettingsService.findByChatId(chatId.toString());

      if (!userSettings || !userSettings.userEmail) {
        const responseText = `⚠️ **Cuenta no vinculada**\n\n` +
          `Primero debes vincular tu cuenta de Leroi.\n` +
          `Usa el comando /vincular para obtener tu código.`;
        
        await telegramService.sendMessage(chatId, responseText);
        return res.json({ ok: true });
      }

      // Obtener roadmaps del usuario desde MongoDB
      await telegramService.sendMessage(chatId, '📚 Buscando tus roadmaps...');
      
      const allRoadmaps = await mongoService.getUserRoadmaps(userSettings.userEmail, 20);

      if (allRoadmaps.length === 0) {
        const responseText = `📚 **Sin roadmaps**\n\n` +
          `Aún no tienes roadmaps.\n\n` +
          `Crea uno en leroi.app/roadmap`;
        
        await telegramService.sendMessage(chatId, responseText);
        return res.json({ ok: true });
      }

      // Si tiene roadmap activo, mostrar ese
      const activeRoadmapTopic = userSettings.reminderSettings?.activeRoadmapTopic;
      
      if (activeRoadmapTopic) {
        const roadmapResult = await mongoService.getRoadmapByTopic(
          userSettings.userEmail,
          activeRoadmapTopic
        );

        if (!roadmapResult) {
          await telegramService.sendMessage(
            chatId,
            `❌ No encontré roadmap de "${activeRoadmapTopic}".\n\nUsa /listar para ver tus roadmaps`
          );
          return res.json({ ok: true });
        }

        // Formatear el roadmap
        let roadmapText = `📊 **Tu Roadmap: ${activeRoadmapTopic}**\n\n`;
        
        const roadmap = roadmapResult.roadmap;
        for (const [subtema, subsubtemas] of Object.entries(roadmap)) {
          roadmapText += `🔹 ${subtema}\n`;
          if (Array.isArray(subsubtemas) && subsubtemas.length > 0) {
            subsubtemas.forEach(subsubtema => {
              roadmapText += `   • ${subsubtema}\n`;
            });
          }
          roadmapText += '\n';
        }

        roadmapText += `\n💬 Pregúntame sobre cualquier tema del roadmap!`;

        await telegramService.sendMessage(chatId, roadmapText);
      } else {
        // No tiene roadmap activo, mostrar lista
        let listText = `📚 **Tus Roadmaps (${allRoadmaps.length}):**\n\n`;
        allRoadmaps.forEach((r, i) => {
          listText += `${i + 1}. ${r.topic}\n`;
        });
        listText += `\n💡 Usa: /cambiar [tema]\n`;
        listText += `Ejemplo: /cambiar ${allRoadmaps[0].topic}`;

        await telegramService.sendMessage(chatId, listText);
      }
    }
    
    else if (text.toLowerCase().startsWith('/cambiar')) {
      const parts = text.split(' ');
      
      if (parts.length < 2) {
        await telegramService.sendMessage(
          chatId,
          `❌ Uso correcto: /cambiar [tema]\n\nEjemplo: /cambiar React`
        );
        return res.json({ ok: true });
      }

      const newTopic = parts.slice(1).join(' ');

      // Verificar que el usuario esté vinculado
      const userSettings = await userNotificationSettingsService.findByChatId(chatId.toString());

      if (!userSettings || !userSettings.userEmail) {
        await telegramService.sendMessage(
          chatId,
          `⚠️ Primero vincula tu cuenta con /vincular`
        );
        return res.json({ ok: true });
      }

      // Actualizar el roadmap activo en MongoDB
      await userNotificationSettingsService.updateReminderSettings(userSettings.userEmail, {
        activeRoadmapTopic: newTopic
      });

      await telegramService.sendMessage(
        chatId,
        `✅ Roadmap cambiado a: **${newTopic}**\n\nUsa /roadmap para ver los detalles.`
      );
    }
    
    else if (text.toLowerCase() === '/listar') {
      // Listar todos los roadmaps del usuario
      const userSettings = await userNotificationSettingsService.findByChatId(chatId.toString());

      if (!userSettings || !userSettings.userEmail) {
        await telegramService.sendMessage(
          chatId,
          `⚠️ Primero vincula tu cuenta con /vincular`
        );
        return res.json({ ok: true });
      }

      await telegramService.sendMessage(chatId, '🔍 Buscando roadmaps...');

      const allRoadmaps = await mongoService.getUserRoadmaps(userSettings.userEmail, 20);

      if (allRoadmaps.length === 0) {
        await telegramService.sendMessage(
          chatId,
          `📚 **Sin roadmaps**\n\nCrea uno en leroi.app/roadmap`
        );
        return res.json({ ok: true });
      }

      const activeRoadmapTopic = userSettings.reminderSettings?.activeRoadmapTopic;
      
      let listText = `📚 **Tus Roadmaps (${allRoadmaps.length}):**\n\n`;
      allRoadmaps.forEach((r, i) => {
        const icon = activeRoadmapTopic === r.topic ? '✅' : '🔹';
        listText += `${icon} ${i + 1}. ${r.topic}\n`;
      });
      listText += `\n💡 Usa: /cambiar [tema]`;

      await telegramService.sendMessage(chatId, listText);
    }
    
    // ==========================================
    // PREGUNTA NORMAL → CHATBOT CON CONTEXTO
    // ==========================================
    else {
      await telegramService.sendMessage(chatId, '🤔 Déjame pensar...');

      // Buscar si el usuario está vinculado
      const userSettings = await userNotificationSettingsService.findByChatId(chatId.toString());

      let roadmapContext = null;

      // Si está vinculado y tiene roadmap activo, obtener contexto
      if (userSettings && userSettings.userEmail && userSettings.reminderSettings?.activeRoadmapTopic) {
        console.log(`📚 Usuario vinculado: ${userSettings.userEmail}`);
        console.log(`📖 Roadmap activo: ${userSettings.reminderSettings.activeRoadmapTopic}`);

        const roadmapResult = await mongoService.getRoadmapByTopic(
          userSettings.userEmail,
          userSettings.reminderSettings.activeRoadmapTopic
        );

        if (roadmapResult) {
          roadmapContext = {
            topic: userSettings.reminderSettings.activeRoadmapTopic,
            roadmap: roadmapResult.roadmap,
            extraInfo: roadmapResult.extraInfo
          };
          console.log('✅ Contexto de roadmap cargado');
        } else {
          console.log('⚠️ No se pudo cargar el roadmap');
        }
      } else {
        console.log('ℹ️ Usuario no vinculado o sin roadmap activo');
      }

      // Generar respuesta con IA (con o sin contexto)
      const aiResponse = await groqService.generateResponse(
        text, 
        roadmapContext,
        true  // MODO ESTRICTO: Solo responde sobre el roadmap
      );

      let finalResponse = aiResponse.response;

      // Si no está vinculado, agregar sugerencia
      if (!userSettings || !userSettings.userEmail) {
        finalResponse += `\n\n💡 Tip: Vincula tu cuenta con /vincular para respuestas personalizadas basadas en tus roadmaps.`;
      }

      await telegramService.sendMessage(chatId, finalResponse);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Info del webhook
 */
export const getWebhookInfo = async (req, res) => {
  try {
    const info = await telegramService.getWebhookInfo();
    res.json({
      status: 'success',
      webhook: info
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
