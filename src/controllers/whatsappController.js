import whatsappService from '../services/whatsappService.js';
import groqService from '../services/groqService.js';
import mongoService from '../services/mongoService.js';
import { UserSettings, NotificationHistory } from '../models/index.js';

/**
 * Manejar webhook de WhatsApp (Twilio)
 */
export const handleWhatsAppWebhook = async (req, res) => {
  try {
    const data = req.body;
    console.log('📨 WhatsApp Webhook recibido:', JSON.stringify(data, null, 2));

    const fromNumber = data.From; // formato: whatsapp:+1234567890
    const message = data.Body || '';
    const senderName = data.ProfileName || 'Usuario';

    console.log(`👤 Usuario: ${senderName} (${fromNumber})`);
    console.log(`💬 Mensaje: ${message}`);

    // Limpiar número (remover "whatsapp:")
    const cleanNumber = fromNumber.replace('whatsapp:', '');

    // ==========================================
    // COMANDOS
    // ==========================================
    
    if (message.toLowerCase() === 'hola' || message.toLowerCase() === 'start') {
      const responseText = `¡Hola ${senderName}! 👋\n\n` +
        `Soy tu asistente de estudio de Leroi.\n\n` +
        `*Comandos disponibles:*\n` +
        `• Pregúntame sobre cualquier tema\n` +
        `• VINCULAR - Vincula tu cuenta\n` +
        `• ROADMAP - Ver tu roadmap actual\n` +
        `• CAMBIAR [tema] - Cambiar roadmap\n` +
        `• AYUDA - Ver ayuda completa\n\n` +
        `💡 Primero vincula tu cuenta con VINCULAR`;

      await whatsappService.sendMessage(fromNumber, responseText);
    }
    
    else if (message.toLowerCase() === 'ayuda') {
      const responseText = `📚 *Comandos de Leroi Bot*\n\n` +
        `🔗 *Vinculación:*\n` +
        `VINCULAR - Obtén tu código\n\n` +
        `📊 *Roadmaps:*\n` +
        `ROADMAP - Ver roadmap actual\n` +
        `CAMBIAR [tema] - Cambiar tema\n` +
        `LISTAR - Ver tus roadmaps\n\n` +
        `💬 *Chatear:*\n` +
        `Escribe tu pregunta y te ayudaré\n\n` +
        `🎯 *Ejemplo:*\n` +
        `"¿Qué es un componente en React?"`;

      await whatsappService.sendMessage(fromNumber, responseText);
    }
    
    else if (message.toLowerCase() === 'vincular') {
      const responseText = `🔗 *Vincular cuenta*\n\n` +
        `Tu código de WhatsApp es:\n` +
        `${cleanNumber}\n\n` +
        `*Pasos:*\n` +
        `1. Ve a leroi.app/perfil\n` +
        `2. Ingresa este número en "WhatsApp"\n` +
        `3. Guarda los cambios\n\n` +
        `¡Listo! 🚀`;

      await whatsappService.sendMessage(fromNumber, responseText);
    }
    
    else if (message.toLowerCase() === 'roadmap') {
      // Buscar usuario vinculado
      const userSettings = await UserSettings.findOne({
        where: { whatsappNumber: cleanNumber }
      });

      if (!userSettings || !userSettings.userEmail) {
        await whatsappService.sendMessage(
          fromNumber,
          `⚠️ *Cuenta no vinculada*\n\nPrimero vincula con: VINCULAR`
        );
        return res.status(200).send('OK');
      }

      const activeRoadmapTopic = userSettings.activeRoadmapTopic;

      if (!activeRoadmapTopic) {
        await whatsappService.sendMessage(
          fromNumber,
          `📚 *Sin roadmap activo*\n\nUsa: CAMBIAR [tema]\nO créalo en leroi.app`
        );
        return res.status(200).send('OK');
      }

      // Obtener roadmap de MongoDB
      await whatsappService.sendMessage(fromNumber, '📚 Cargando...');
      
      const roadmapResult = await mongoService.getRoadmapByTopic(
        userSettings.userEmail,
        activeRoadmapTopic
      );

      if (!roadmapResult) {
        await whatsappService.sendMessage(
          fromNumber,
          `❌ No encontré roadmap de "${activeRoadmapTopic}"`
        );
        return res.status(200).send('OK');
      }

      // Formatear roadmap
      let roadmapText = `📊 *Tu Roadmap: ${activeRoadmapTopic}*\n\n`;
      
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

      roadmapText += `💬 Pregúntame lo que quieras!`;

      await whatsappService.sendMessageWithLink(
        fromNumber,
        roadmapText,
        '🌐 Ver en la web',
        'https://leroi.app/roadmaps'
      );
    }
    
    else if (message.toLowerCase().startsWith('cambiar')) {
      const parts = message.split(' ');
      
      if (parts.length < 2) {
        await whatsappService.sendMessage(
          fromNumber,
          `❌ Uso: CAMBIAR [tema]\n\nEjemplo: CAMBIAR React`
        );
        return res.status(200).send('OK');
      }

      const newTopic = parts.slice(1).join(' ');

      const userSettings = await UserSettings.findOne({
        where: { whatsappNumber: cleanNumber }
      });

      if (!userSettings || !userSettings.userEmail) {
        await whatsappService.sendMessage(
          fromNumber,
          `⚠️ Primero vincula: VINCULAR`
        );
        return res.status(200).send('OK');
      }

      userSettings.activeRoadmapTopic = newTopic;
      await userSettings.save();

      await whatsappService.sendMessage(
        fromNumber,
        `✅ Roadmap cambiado a: *${newTopic}*\n\nUsa ROADMAP para ver detalles`
      );
    }
    
    else if (message.toLowerCase() === 'listar') {
      // Listar roadmaps del usuario
      const userSettings = await UserSettings.findOne({
        where: { whatsappNumber: cleanNumber }
      });

      if (!userSettings || !userSettings.userEmail) {
        await whatsappService.sendMessage(
          fromNumber,
          `⚠️ Primero vincula: VINCULAR`
        );
        return res.status(200).send('OK');
      }

      const roadmaps = await mongoService.getUserRoadmaps(userSettings.userEmail, 10);

      if (roadmaps.length === 0) {
        await whatsappService.sendMessage(
          fromNumber,
          `📚 *Sin roadmaps*\n\nCrea uno en leroi.app`
        );
        return res.status(200).send('OK');
      }

      let listText = `📚 *Tus Roadmaps (${roadmaps.length}):*\n\n`;
      roadmaps.forEach((r, i) => {
        listText += `${i + 1}. ${r.topic}\n`;
      });
      listText += `\nUsa: CAMBIAR [tema]`;

      await whatsappService.sendMessage(fromNumber, listText);
    }
    
    // ==========================================
    // PREGUNTA NORMAL → CHATBOT CON CONTEXTO
    // ==========================================
    else {
      await whatsappService.sendMessage(fromNumber, '🤔 Déjame pensar...');

      // Buscar usuario vinculado
      const userSettings = await UserSettings.findOne({
        where: { whatsappNumber: cleanNumber }
      });

      let roadmapContext = null;

      // Si está vinculado y tiene roadmap activo
      if (userSettings && userSettings.userEmail && userSettings.activeRoadmapTopic) {
        console.log(`📚 Usuario: ${userSettings.userEmail}`);
        console.log(`📖 Roadmap: ${userSettings.activeRoadmapTopic}`);

        const roadmapResult = await mongoService.getRoadmapByTopic(
          userSettings.userEmail,
          userSettings.activeRoadmapTopic
        );

        if (roadmapResult) {
          roadmapContext = {
            topic: userSettings.activeRoadmapTopic,
            roadmap: roadmapResult.roadmap,
            extraInfo: roadmapResult.extraInfo
          };
          console.log('✅ Contexto cargado');
        }
      }

      // Generar respuesta con IA
      const aiResponse = await groqService.generateResponse(
        message, 
        roadmapContext,
        true  // MODO ESTRICTO
      );
      let finalResponse = aiResponse.response;

      // Si no vinculado, sugerir
      if (!userSettings || !userSettings.userEmail) {
        finalResponse += `\n\n💡 Tip: Vincula con VINCULAR para respuestas personalizadas`;
      }

      await whatsappService.sendMessage(fromNumber, finalResponse);

      // Guardar en historial
      await NotificationHistory.create({
        userId: userSettings?.userId || 0,
        notificationType: 'chatbot_response',
        channel: 'whatsapp',
        message: message,
        status: 'sent'
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en WhatsApp webhook:', error);
    res.status(500).send('Error');
  }
};
