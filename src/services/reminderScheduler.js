import cron from 'node-cron';
import { userNotificationSettingsService } from '../mongodb/index.js';
import telegramService from './telegramService.js';
import whatsappService from './whatsappService.js';
import groqService from './groqService.js';
import learningPathClient from './learningPathClient.js';

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Iniciar el sistema de recordatorios
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler ya está corriendo');
      return;
    }

    console.log('⏰ Iniciando sistema de recordatorios...');

    // Ejecutar cada día a las 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Ejecutando recordatorios diarios...');
      await this.sendDailyReminders();
    });

    // Ejecutar recordatorios inteligentes cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('🧠 Verificando usuarios para recordatorios inteligentes...');
      await this.sendIntelligentReminders();
    });

    this.isRunning = true;
    console.log('✅ Sistema de recordatorios activo');
    console.log('   📅 Recordatorios diarios: 9:00 AM');
    console.log('   🧠 Recordatorios inteligentes: cada 6 horas');
  }

  /**
   * Enviar recordatorios diarios configurados
   */
  async sendDailyReminders() {
    try {
      // Aquí deberías implementar una forma de obtener todos los usuarios
      // Por ahora es un placeholder
      console.log('📊 Procesando recordatorios diarios...');
      
      // TODO: Implementar query para obtener todos los usuarios con recordatorios activos
      // const users = await this.getUsersWithRemindersEnabled();
      
      console.log('✅ Recordatorios diarios enviados');
    } catch (error) {
      console.error('❌ Error enviando recordatorios diarios:', error);
    }
  }

  /**
   * Recordatorios inteligentes
   */
  async sendIntelligentReminders() {
    try {
      console.log('🧠 Procesando recordatorios inteligentes...');
      
      // TODO: Implementar lógica de recordatorios inteligentes
      
      console.log('✅ Recordatorios inteligentes procesados');
    } catch (error) {
      console.error('❌ Error en recordatorios inteligentes:', error);
    }
  }

  /**
   * Enviar recordatorio a un usuario específico
   */
  async sendReminderToUser(userEmail) {
    try {
      console.log(`📤 Enviando recordatorio a: ${userEmail}`);

      // Obtener configuración del usuario
      const userSettings = await userNotificationSettingsService.getUserSettings(userEmail);

      if (!userSettings) {
        console.log(`⚠️ Usuario no encontrado: ${userEmail}`);
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const activeRoadmapTopic = userSettings.reminderSettings?.activeRoadmapTopic;

      if (!activeRoadmapTopic) {
        console.log(`⚠️ Usuario sin roadmap activo: ${userEmail}`);
        return {
          success: false,
          message: 'Sin roadmap activo'
        };
      }

      // Obtener roadmap del usuario
      const roadmap = await learningPathClient.getRoadmapByTopic(
        userEmail,
        activeRoadmapTopic
      );

      if (!roadmap) {
        console.log(`⚠️ No se encontró roadmap para ${userEmail}`);
        return {
          success: false,
          message: 'Roadmap no encontrado'
        };
      }

      // Generar mensaje motivacional
      const message = await groqService.suggestTodayTopic({
        topic: activeRoadmapTopic,
        roadmap: roadmap.roadmap
      });

      // Formato del mensaje
      const formattedMessage = `🎯 *Recordatorio de Estudio*\n\n${message}\n\n` +
        `📚 Tu roadmap: ${activeRoadmapTopic}\n` +
        `💪 ¡Tú puedes!`;

      // Enviar por el canal preferido
      const channel = userSettings.preferredChannel || 'none';
      let sent = false;

      if (channel === 'telegram' || channel === 'both') {
        if (userSettings.telegram?.enabled && userSettings.telegram?.chatId) {
          await telegramService.sendMessage(
            userSettings.telegram.chatId,
            formattedMessage
          );
          console.log(`✅ Recordatorio enviado por Telegram`);
          sent = true;
        }
      }

      if (channel === 'whatsapp' || channel === 'both') {
        if (userSettings.whatsapp?.enabled && userSettings.whatsapp?.number) {
          await whatsappService.sendMessage(
            `whatsapp:${userSettings.whatsapp.number}`,
            formattedMessage
          );
          console.log(`✅ Recordatorio enviado por WhatsApp`);
          sent = true;
        }
      }

      return {
        success: sent,
        message: sent ? 'Recordatorio enviado' : 'No se pudo enviar (canales no configurados)'
      };

    } catch (error) {
      console.error(`❌ Error enviando recordatorio a ${userEmail}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Detener el scheduler
   */
  stop() {
    this.isRunning = false;
    console.log('⏸️  Sistema de recordatorios detenido');
  }
}

export default new ReminderScheduler();
