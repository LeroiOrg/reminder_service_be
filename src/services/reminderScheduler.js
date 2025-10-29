import cron from 'node-cron';
import { userNotificationSettingsService } from '../mongodb/index.js';
import telegramService from './telegramService.js';
import whatsappService from './whatsappService.js';
import groqService from './groqService.js';
import learningPathClient from './learningPathClient.js';

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.lastSentMinute = {}; // Para evitar envíos duplicados
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

    // Verificar cada minuto si algún usuario tiene recordatorio programado
    cron.schedule('* * * * *', async () => {
      await this.checkScheduledReminders();
    });

    // Ejecutar recordatorios inteligentes cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('🧠 Verificando usuarios para recordatorios inteligentes...');
      await this.sendIntelligentReminders();
    });

    this.isRunning = true;
    console.log('✅ Sistema de recordatorios activo');
    console.log('   📅 Verificando cada minuto según configuración de usuarios');
    console.log('   🧠 Recordatorios inteligentes: cada 6 horas');
  }

  /**
   * Verificar si hay usuarios que deben recibir recordatorio en este minuto
   */
  async checkScheduledReminders() {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentMinuteKey = `${now.getDate()}-${currentTime}`;

      // Obtener todos los usuarios con recordatorios activos
      const users = await userNotificationSettingsService.getAllUsersWithRemindersEnabled();

      if (!users || users.length === 0) {
        return;
      }

      for (const user of users) {
        // Verificar si ya enviamos a este usuario en este minuto
        if (this.lastSentMinute[user.userEmail] === currentMinuteKey) {
          continue;
        }

        const userTime = user.reminderSettings?.time || '09:00';
        const frequency = user.reminderSettings?.frequency || 'daily';

        // Verificar si es el momento de enviar
        if (userTime === currentTime && this.shouldSendToday(frequency, user)) {
          console.log(`🔔 Enviando recordatorio programado a ${user.userEmail} (${currentTime})`);
          
          try {
            await this.sendReminderToUser(user.userEmail);
            this.lastSentMinute[user.userEmail] = currentMinuteKey;
          } catch (err) {
            console.error(`❌ Error enviando a ${user.userEmail}:`, err.message);
          }

          // Esperar 1 segundo entre envíos
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('❌ Error en checkScheduledReminders:', error);
    }
  }

  /**
   * Determinar si se debe enviar recordatorio hoy según la frecuencia
   */
  shouldSendToday(frequency, user) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado

    switch (frequency) {
      case 'daily':
        return true;
      
      case 'every_2_days':
        // Enviar solo en días pares o impares (simplificado)
        return now.getDate() % 2 === 0;
      
      case 'weekly':
        // Enviar solo los lunes (día 1)
        return dayOfWeek === 1;
      
      case 'intelligent':
        // Por ahora funciona como diario, luego se puede mejorar con lógica de progreso
        return true;
      
      case 'disabled':
        return false;
      
      default:
        return true;
    }
  }

  /**
   * Enviar recordatorios diarios configurados (legacy, ahora usa checkScheduledReminders)
   */
  async sendDailyReminders() {
    try {
      console.log('📊 Procesando recordatorios diarios...');
      
      // Obtener todos los usuarios con notificaciones activas
      const users = await userNotificationSettingsService.getAllUsersWithRemindersEnabled();
      
      if (!users || users.length === 0) {
        console.log('⚠️ No hay usuarios con recordatorios activos');
        return;
      }

      console.log(`👥 Enviando recordatorios a ${users.length} usuarios...`);

      // Enviar recordatorio a cada usuario
      for (const user of users) {
        try {
          await this.sendReminderToUser(user.userEmail);
          // Esperar 1 segundo entre cada envío para no saturar
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`❌ Error enviando a ${user.userEmail}:`, err.message);
        }
      }
      
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
      
      // Obtener usuarios con frecuencia "intelligent"
      const allUsers = await userNotificationSettingsService.getAllUsersWithRemindersEnabled();
      const intelligentUsers = allUsers.filter(
        user => user.reminderSettings?.frequency === 'intelligent'
      );

      if (intelligentUsers.length === 0) {
        console.log('⚠️ No hay usuarios con recordatorios inteligentes');
        return;
      }

      console.log(`🤖 Enviando recordatorios inteligentes a ${intelligentUsers.length} usuarios...`);

      for (const user of intelligentUsers) {
        try {
          await this.sendReminderToUser(user.userEmail);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`❌ Error enviando a ${user.userEmail}:`, err.message);
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
