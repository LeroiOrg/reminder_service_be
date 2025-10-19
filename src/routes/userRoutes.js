import express from 'express';
import { UserSettings } from '../models/index.js';

const router = express.Router();

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

    // Buscar o crear UserSettings
    let userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (userSettings) {
      // Actualizar existente
      userSettings.whatsappNumber = whatsappNumber;
      userSettings.whatsappEnabled = true;
      if (activeRoadmapTopic) {
        userSettings.activeRoadmapTopic = activeRoadmapTopic;
      }
      await userSettings.save();
      
      console.log('✅ UserSettings actualizado');
    } else {
      // Crear nuevo
      userSettings = await UserSettings.create({
        userId: 0,
        userEmail: email,
        whatsappNumber: whatsappNumber,
        whatsappEnabled: true,
        activeRoadmapTopic: activeRoadmapTopic || null
      });
      
      console.log('✅ UserSettings creado');
    }

    res.json({
      success: true,
      message: 'WhatsApp vinculado exitosamente',
      data: {
        email: userSettings.userEmail,
        whatsappNumber: userSettings.whatsappNumber,
        activeRoadmapTopic: userSettings.activeRoadmapTopic
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

    // Buscar o crear UserSettings
    let userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (userSettings) {
      // Actualizar existente
      userSettings.telegramChatId = telegramChatId.toString();
      userSettings.telegramEnabled = true;
      if (activeRoadmapTopic) {
        userSettings.activeRoadmapTopic = activeRoadmapTopic;
      }
      await userSettings.save();
      
      console.log('✅ UserSettings actualizado');
    } else {
      // Crear nuevo
      userSettings = await UserSettings.create({
        userId: 0, // Placeholder, no usamos el userId de Auth directamente
        userEmail: email,
        telegramChatId: telegramChatId.toString(),
        telegramEnabled: true,
        activeRoadmapTopic: activeRoadmapTopic || null
      });
      
      console.log('✅ UserSettings creado');
    }

    res.json({
      success: true,
      message: 'Telegram vinculado exitosamente',
      data: {
        email: userSettings.userEmail,
        telegramChatId: userSettings.telegramChatId,
        activeRoadmapTopic: userSettings.activeRoadmapTopic
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
 * GET /api/users/settings/:email
 * Obtener configuración de un usuario
 */
router.get('/settings/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

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
        telegramChatId: userSettings.telegramChatId,
        telegramEnabled: userSettings.telegramEnabled,
        whatsappNumber: userSettings.whatsappNumber,
        whatsappEnabled: userSettings.whatsappEnabled,
        activeRoadmapTopic: userSettings.activeRoadmapTopic,
        reminderFrequency: userSettings.reminderFrequency,
        reminderTime: userSettings.reminderTime
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

    const userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos permitidos
    const allowedFields = [
      'activeRoadmapTopic',
      'reminderFrequency',
      'reminderTime',
      'telegramEnabled',
      'whatsappEnabled'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        userSettings[field] = updates[field];
      }
    });

    await userSettings.save();

    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: {
        email: userSettings.userEmail,
        activeRoadmapTopic: userSettings.activeRoadmapTopic,
        reminderFrequency: userSettings.reminderFrequency
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

    const userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    userSettings.telegramChatId = null;
    userSettings.telegramEnabled = false;
    await userSettings.save();

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
 * PUT /api/users/preferred-channel/:email
 * Cambiar canal favorito de notificaciones
 */
router.put('/preferred-channel/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { preferredChannel } = req.body;

    if (!['telegram', 'whatsapp', 'both'].includes(preferredChannel)) {
      return res.status(400).json({
        success: false,
        message: 'Canal inválido. Opciones: telegram, whatsapp, both'
      });
    }

    const userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    userSettings.preferredChannel = preferredChannel;
    await userSettings.save();

    res.json({
      success: true,
      message: 'Canal favorito actualizado',
      data: {
        email: userSettings.userEmail,
        preferredChannel: userSettings.preferredChannel
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

    const userSettings = await UserSettings.findOne({
      where: { userEmail: email }
    });

    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (reminderFrequency) userSettings.reminderFrequency = reminderFrequency;
    if (reminderTime) userSettings.reminderTime = reminderTime;
    
    await userSettings.save();

    res.json({
      success: true,
      message: 'Configuración de recordatorios actualizada',
      data: {
        email: userSettings.userEmail,
        reminderFrequency: userSettings.reminderFrequency,
        reminderTime: userSettings.reminderTime
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

export default router;
