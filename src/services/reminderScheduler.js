import cron from 'node-cron';
import { UserSettings, NotificationHistory } from '../models/index.js';
import telegramService from './telegramService.js';
import whatsappService from './whatsappService.js';
import groqService from './groqService.js';
import mongoService from './mongoService.js';
import { Op } from 'sequelize';

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
      console.log('🧠 Verificando usuarios inactivos...');
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
      // Buscar usuarios con recordatorios habilitados
      const users = await UserSettings.findAll({
        where: {
          [Op.or]: [
            { telegramEnabled: true },
            { whatsappEnabled: true }
          ],
          activeRoadmapTopic: {
            [Op.ne]: null
          }
        }
      });

      console.log(`📊 Usuarios con recordatorios: ${users.length}`);

      for (const user of users) {
        await this.sendReminderToUser(user, 'daily');
      }

      console.log('✅ Recordatorios diarios enviados');
    } catch (error) {
      console.error('❌ Error enviando recordatorios diarios:', error);
    }
  }

  /**
   * Recordatorios inteligentes (si no estudia en 3 días)
   */
  async sendIntelligentReminders() {
    try {
      // Buscar usuarios con roadmap activo
      const users = await UserSettings.findAll({
        where: {
          [Op.or]: [
            { telegramEnabled: true },
            { whatsappEnabled: true }
          ],
          activeRoadmapTopic: {
            [Op.ne]: null
          }
        }
      });

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      for (const user of users) {
        // Buscar última interacción
        const lastInteraction = await NotificationHistory.findOne({
          where: {
            userId: user.userId,
            notificationType: 'chatbot_response',
            createdAt: {
              [Op.gte]: threeDaysAgo
            }
          },
          order: [['createdAt', 'DESC']]
        });

        // Si no tiene interacción en 3 días, enviar recordatorio
        if (!lastInteraction) {
          console.log(`🎯 Usuario inactivo: ${user.userEmail}`);
          await this.sendReminderToUser(user, 'intelligent');
        }
      }

      console.log('✅ Recordatorios inteligentes procesados');
    } catch (error) {
      console.error('❌ Error en recordatorios inteligentes:', error);
    }
  }

  /**
   * Enviar recordatorio a un usuario específico
   */
  async sendReminderToUser(userSettings, type = 'daily') {
    try {
      if (!userSettings.userEmail || !userSettings.activeRoadmapTopic) {
        return;
      }

      console.log(`📤 Enviando recordatorio a: ${userSettings.userEmail}`);

      // Obtener roadmap del usuario
      const roadmap = await mongoService.getRoadmapByTopic(
        userSettings.userEmail,
        userSettings.activeRoadmapTopic
      );

      if (!roadmap) {
        console.log(`⚠️ No se encontró roadmap para ${userSettings.userEmail}`);
        return;
      }

      // Generar mensaje con IA
      const daysInactive = type === 'intelligent' ? 3 : 0;
      let message;

      if (type === 'intelligent') {
        message = await groqService.generateMotivationalMessage(
          userSettings.activeRoadmapTopic,
          daysInactive
        );
      } else {
        message = await groqService.suggestTodayTopic({
          topic: userSettings.activeRoadmapTopic,
          roadmap: roadmap.roadmap
        });
      }

      // Agregar emojis y formato
      const formattedMessage = `🎯 *Recordatorio de Estudio*\n\n${message}\n\n` +
        `📚 Tu roadmap: ${userSettings.activeRoadmapTopic}\n` +
        `💪 ¡Tú puedes!`;

      // Enviar por el canal preferido
      const channel = userSettings.preferredChannel || 'telegram';

      if (channel === 'telegram' || channel === 'both') {
        if (userSettings.telegramEnabled && userSettings.telegramChatId) {
          await telegramService.sendMessage(
            userSettings.telegramChatId,
            formattedMessage
          );
          console.log(`✅ Recordatorio enviado por Telegram`);
        }
      }

      if (channel === 'whatsapp' || channel === 'both') {
        if (userSettings.whatsappEnabled && userSettings.whatsappNumber) {
          await whatsappService.sendMessage(
            `whatsapp:${userSettings.whatsappNumber}`,
            formattedMessage
          );
          console.log(`✅ Recordatorio enviado por WhatsApp`);
        }
      }

      // Registrar en historial
      await NotificationHistory.create({
        userId: userSettings.userId,
        notificationType: `reminder_${type}`,
        channel: channel,
        message: formattedMessage,
        status: 'sent'
      });

    } catch (error) {
      console.error(`❌ Error enviando recordatorio a ${userSettings.userEmail}:`, error);
    }
  }

  /**
   * Enviar recordatorio manual a un usuario
   */
  async sendManualReminder(userEmail, customMessage = null) {
    try {
      const userSettings = await UserSettings.findOne({
        where: { userEmail }
      });

      if (!userSettings) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const message = customMessage || await groqService.suggestTodayTopic({
        topic: userSettings.activeRoadmapTopic,
        roadmap: {}
      });

      await this.sendReminderToUser(userSettings, 'manual');

      return {
        success: true,
        message: 'Recordatorio enviado'
      };
    } catch (error) {
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
