import express from 'express';
import { userNotificationSettingsService } from '../mongodb/index.js';
import learningPathClient from '../services/learningPathClient.js';

const router = express.Router();

/**
 * POST /api/users/link-telegram
 * Vincular cuenta de usuario con chat_id de Telegram
 */
router.post('/link-telegram', async (req, res) => {
  try {
    const { email, telegramChatId, activeRoadmapTopic } = req.body;

    if (!email || !telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Email y telegramChatId son requeridos'
      });
    }

    console.log(`🔗 Vinculando: ${email} → Telegram: ${telegramChatId}`);

    // Vincular Telegram en Firestore
    await userNotificationSettingsService.linkTelegram(email, telegramChatId);

    // Si hay un roadmap activo, actualizarlo
    if (activeRoadmapTopic) {
      await userNotificationSettingsService.updateReminderSettings(email, {
        activeRoadmapTopic
      });
    }

    // Obtener la configuración actualizada
    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    res.json({
      success: true,
      message: 'Telegram vinculado exitosamente',
      data: {
        email: userSettings.userEmail,
        telegramChatId: userSettings.telegram.chatId,
        telegramEnabled: userSettings.telegram.enabled,
        activeRoadmapTopic: userSettings.reminderSettings?.activeRoadmapTopic
      }
    });
  } catch (error) {
    console.error('❌ Error vinculando Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Error vinculando cuenta',
      error: error.message
    });
  }
});

/**
 * POST /api/users/link-whatsapp
 * Vincular cuenta de usuario con WhatsApp
 */
router.post('/link-whatsapp', async (req, res) => {
  try {
    const { email, whatsappNumber, activeRoadmapTopic } = req.body;

    if (!email || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email y whatsappNumber son requeridos'
      });
    }

    console.log(`🔗 Vinculando: ${email} → WhatsApp: ${whatsappNumber}`);

    // Vincular WhatsApp en Firestore
    await userNotificationSettingsService.linkWhatsApp(email, whatsappNumber);

    // Si hay un roadmap activo, actualizarlo
    if (activeRoadmapTopic) {
      await userNotificationSettingsService.updateReminderSettings(email, {
        activeRoadmapTopic
      });
    }

    // Obtener la configuración actualizada
    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    res.json({
      success: true,
      message: 'WhatsApp vinculado exitosamente',
      data: {
        email: userSettings.userEmail,
        whatsappNumber: userSettings.whatsapp.number,
        whatsappEnabled: userSettings.whatsapp.enabled,
        activeRoadmapTopic: userSettings.reminderSettings?.activeRoadmapTopic
      }
    });
  } catch (error) {
    console.error('❌ Error vinculando WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Error vinculando cuenta',
      error: error.message
    });
  }
});

/**
 * GET /api/users/settings/:email
 * Obtener configuración de un usuario (ahora desde Firestore)
 */
router.get('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        email: userSettings.userEmail,
        telegram: {
          chatId: userSettings.telegram?.chatId || null,
          enabled: userSettings.telegram?.enabled || false
        },
        whatsapp: {
          number: userSettings.whatsapp?.number || null,
          enabled: userSettings.whatsapp?.enabled || false
        },
        preferredChannel: userSettings.preferredChannel || 'none',
        reminderSettings: {
          frequency: userSettings.reminderSettings?.frequency || 'daily',
          time: userSettings.reminderSettings?.time || '09:00',
          activeRoadmapTopic: userSettings.reminderSettings?.activeRoadmapTopic || null
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo configuración',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/settings/:email
 * Actualizar configuración de usuario
 */
router.put('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar canal preferido si está en el request
    if (updates.preferredChannel) {
      await userNotificationSettingsService.updatePreferredChannel(email, updates.preferredChannel);
    }

    // Actualizar estados de habilitación de canales
    const settingsUpdate = {};
    
    if (updates.telegramEnabled !== undefined) {
      settingsUpdate['telegram.enabled'] = updates.telegramEnabled;
    }
    
    if (updates.whatsappEnabled !== undefined) {
      settingsUpdate['whatsapp.enabled'] = updates.whatsappEnabled;
    }

    if (Object.keys(settingsUpdate).length > 0) {
      await userNotificationSettingsService.upsertUserSettings(email, settingsUpdate);
    }

    // Actualizar recordatorios si están en el request
    const reminderUpdates = {};
    if (updates.reminderFrequency) reminderUpdates.frequency = updates.reminderFrequency;
    if (updates.reminderTime) reminderUpdates.time = updates.reminderTime;
    if (updates.activeRoadmapTopic !== undefined) reminderUpdates.activeRoadmapTopic = updates.activeRoadmapTopic;

    if (Object.keys(reminderUpdates).length > 0) {
      await userNotificationSettingsService.updateReminderSettings(email, reminderUpdates);
    }

    // Obtener configuración actualizada
    const updatedSettings = await userNotificationSettingsService.getUserSettings(email);

    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: {
        email: updatedSettings.userEmail,
        preferredChannel: updatedSettings.preferredChannel,
        telegram: updatedSettings.telegram,
        whatsapp: updatedSettings.whatsapp,
        reminderSettings: updatedSettings.reminderSettings
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando configuración',
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/unlink-telegram/:email
 * Desvincular Telegram de una cuenta
 */
router.delete('/unlink-telegram/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await userNotificationSettingsService.unlinkTelegram(email);

    res.json({
      success: true,
      message: 'Telegram desvinculado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error desvinculando Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Error desvinculando cuenta',
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/unlink-whatsapp/:email
 * Desvincular WhatsApp de una cuenta
 */
router.delete('/unlink-whatsapp/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await userNotificationSettingsService.unlinkWhatsApp(email);

    res.json({
      success: true,
      message: 'WhatsApp desvinculado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error desvinculando WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Error desvinculando cuenta',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/preferred-channel/:email
 * Cambiar canal favorito de notificaciones
 */
router.put('/preferred-channel/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { preferredChannel } = req.body;

    if (!['telegram', 'whatsapp', 'both', 'none'].includes(preferredChannel)) {
      return res.status(400).json({
        success: false,
        message: 'Canal inválido. Opciones: telegram, whatsapp, both, none'
      });
    }

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await userNotificationSettingsService.updatePreferredChannel(email, preferredChannel);

    res.json({
      success: true,
      message: 'Canal favorito actualizado',
      data: {
        email,
        preferredChannel
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando canal',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/reminder-settings/:email
 * Configurar recordatorios del usuario
 */
router.put('/reminder-settings/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { reminderFrequency, reminderTime } = req.body;

    // Validar frecuencia
    const validFrequencies = ['daily', 'every_2_days', 'weekly', 'intelligent', 'disabled'];
    if (reminderFrequency && !validFrequencies.includes(reminderFrequency)) {
      return res.status(400).json({
        success: false,
        message: `Frecuencia inválida. Opciones: ${validFrequencies.join(', ')}`
      });
    }

    // Validar hora (formato HH:MM)
    if (reminderTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      return res.status(400).json({
        success: false,
        message: 'Hora inválida. Formato: HH:MM (00:00 - 23:59)'
      });
    }

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const updates = {};
    if (reminderFrequency) updates.frequency = reminderFrequency;
    if (reminderTime) updates.time = reminderTime;

    await userNotificationSettingsService.updateReminderSettings(email, updates);

    const updatedSettings = await userNotificationSettingsService.getUserSettings(email);

    res.json({
      success: true,
      message: 'Configuración de recordatorios actualizada',
      data: {
        email: updatedSettings.userEmail,
        reminderFrequency: updatedSettings.reminderSettings.frequency,
        reminderTime: updatedSettings.reminderSettings.time
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando recordatorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando configuración',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/active-roadmap/:email
 * Activar un roadmap específico para el usuario
 */
router.put('/active-roadmap/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { roadmapTopic } = req.body;

    if (!roadmapTopic) {
      return res.status(400).json({
        success: false,
        message: 'roadmapTopic es requerido'
      });
    }

    console.log(`🎯 Activando roadmap "${roadmapTopic}" para ${email}`);

    // Verificar que el roadmap existe en learning_path (vía API)
    const roadmapExists = await learningPathClient.getRoadmapByTopic(email, roadmapTopic);

    if (!roadmapExists) {
      return res.status(404).json({
        success: false,
        message: `No se encontró roadmap con tema: ${roadmapTopic}`
      });
    }

    // Actualizar el roadmap activo en Firestore
    await userNotificationSettingsService.updateReminderSettings(email, {
      activeRoadmapTopic: roadmapTopic
    });

    const userSettings = await userNotificationSettingsService.getUserSettings(email);

    res.json({
      success: true,
      message: 'Roadmap activado exitosamente',
      data: {
        email: userSettings.userEmail,
        activeRoadmapTopic: userSettings.reminderSettings?.activeRoadmapTopic
      }
    });
  } catch (error) {
    console.error('❌ Error activando roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Error activando roadmap',
      error: error.message
    });
  }
});

/**
 * GET /api/users/roadmaps/:email
 * Obtener todos los roadmaps de un usuario (vía Learning Path API)
 */
router.get('/roadmaps/:email', async (req, res) => {
  try {
    const { email } = req.params;

    console.log(`📚 Obteniendo roadmaps de: ${email}`);

    const roadmaps = await learningPathClient.getUserRoadmaps(email, 50);

    if (roadmaps.length === 0) {
      return res.json({
        success: true,
        message: 'Usuario no tiene roadmaps',
        data: []
      });
    }

    // Formatear respuesta
    const formattedRoadmaps = roadmaps.map(r => ({
      topic: r.topic,
      subtopicsCount: Object.keys(r.roadmap || {}).length,
      timestamp: r.timestamp,
      createdAt: r.timestamp ? new Date(r.timestamp).toISOString() : null
    }));

    res.json({
      success: true,
      count: formattedRoadmaps.length,
      data: formattedRoadmaps
    });
  } catch (error) {
    console.error('❌ Error obteniendo roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo roadmaps',
      error: error.message
    });
  }
});

export default router;
