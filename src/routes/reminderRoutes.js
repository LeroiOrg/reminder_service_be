import express from 'express';
import reminderScheduler from '../services/reminderScheduler.js';

const router = express.Router();

/**
 * POST /api/reminders/send/:email
 * Enviar recordatorio manual a un usuario específico
 */
router.post('/send/:email', async (req, res) => {
  try {
    const { email } = req.params;

    console.log(`📤 Enviando recordatorio manual a: ${email}`);

    const result = await reminderScheduler.sendReminderToUser(email);

    if (result.success) {
      res.json({
        success: true,
        message: 'Recordatorio enviado exitosamente',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando recordatorio',
      error: error.message
    });
  }
});

/**
 * POST /api/reminders/test-daily
 * Probar recordatorios diarios (para testing)
 */
router.post('/test-daily', async (req, res) => {
  try {
    console.log('🧪 Ejecutando test de recordatorios diarios...');
    
    await reminderScheduler.sendDailyReminders();

    res.json({
      success: true,
      message: 'Test de recordatorios diarios ejecutado'
    });
  } catch (error) {
    console.error('❌ Error en test:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test',
      error: error.message
    });
  }
});

/**
 * POST /api/reminders/test-intelligent
 * Probar recordatorios inteligentes (para testing)
 */
router.post('/test-intelligent', async (req, res) => {
  try {
    console.log('🧪 Ejecutando test de recordatorios inteligentes...');
    
    await reminderScheduler.sendIntelligentReminders();

    res.json({
      success: true,
      message: 'Test de recordatorios inteligentes ejecutado'
    });
  } catch (error) {
    console.error('❌ Error en test:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test',
      error: error.message
    });
  }
});

export default router;
