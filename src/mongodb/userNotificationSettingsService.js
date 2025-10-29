import mongoConnection from './connection.js';

/**
 * Servicio para gestionar la configuración de notificaciones de usuarios en MongoDB
 * Colección: user_notification_settings
 */
class UserNotificationSettingsService {
  constructor() {
    this.collectionName = 'user_notification_settings';
  }

  /**
   * Obtener la colección de MongoDB
   */
  async getCollection() {
    const db = await mongoConnection.connect();
    return db.collection(this.collectionName);
  }

  /**
   * Crear índices para optimizar búsquedas
   */
  async createIndexes() {
    try {
      const collection = await this.getCollection();
      
      // Índice único por email
      await collection.createIndex({ userEmail: 1 }, { unique: true });
      
      // Índices para búsquedas por canales
      await collection.createIndex({ 'telegram.chatId': 1 }, { sparse: true });
      await collection.createIndex({ 'whatsapp.number': 1 }, { sparse: true });
      
      console.log('✅ Índices creados en user_notification_settings');
    } catch (error) {
      console.error('❌ Error creando índices:', error.message);
    }
  }

  /**
   * Obtener configuración de usuario por email
   */
  async getUserSettings(userEmail) {
    try {
      const collection = await this.getCollection();
      const settings = await collection.findOne({ userEmail });
      
      return settings;
    } catch (error) {
      console.error(`❌ Error obteniendo settings de ${userEmail}:`, error.message);
      throw error;
    }
  }

  /**
   * Crear o actualizar configuración completa de usuario
   */
  async upsertUserSettings(userEmail, settingsData) {
    try {
      const collection = await this.getCollection();
      
      const updateData = {
        userEmail,
        ...settingsData,
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        { userEmail },
        { 
          $set: updateData,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      console.log(`✅ Settings actualizados para ${userEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Error actualizando settings de ${userEmail}:`, error.message);
      throw error;
    }
  }

  /**
   * Vincular Telegram
   */
  async linkTelegram(userEmail, chatId) {
    try {
      const collection = await this.getCollection();
      
      const result = await collection.updateOne(
        { userEmail },
        {
          $set: {
            'telegram.chatId': chatId.toString(),
            'telegram.enabled': true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            userEmail,
            createdAt: new Date(),
            whatsapp: { number: null, enabled: false },
            preferredChannel: 'telegram',
            reminderSettings: {
              frequency: 'daily',
              time: '09:00',
              activeRoadmapTopic: null
            }
          }
        },
        { upsert: true }
      );

      console.log(`✅ Telegram vinculado: ${userEmail} → ${chatId}`);
      return result;
    } catch (error) {
      console.error(`❌ Error vinculando Telegram:`, error.message);
      throw error;
    }
  }

  /**
   * Vincular WhatsApp
   */
  async linkWhatsApp(userEmail, phoneNumber) {
    try {
      const collection = await this.getCollection();
      
      const result = await collection.updateOne(
        { userEmail },
        {
          $set: {
            'whatsapp.number': phoneNumber,
            'whatsapp.enabled': true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            userEmail,
            createdAt: new Date(),
            telegram: { chatId: null, enabled: false },
            preferredChannel: 'whatsapp',
            reminderSettings: {
              frequency: 'daily',
              time: '09:00',
              activeRoadmapTopic: null
            }
          }
        },
        { upsert: true }
      );

      console.log(`✅ WhatsApp vinculado: ${userEmail} → ${phoneNumber}`);
      return result;
    } catch (error) {
      console.error(`❌ Error vinculando WhatsApp:`, error.message);
      throw error;
    }
  }

  /**
   * Desvincular Telegram
   */
  async unlinkTelegram(userEmail) {
    try {
      const collection = await this.getCollection();
      
      const result = await collection.updateOne(
        { userEmail },
        {
          $set: {
            'telegram.chatId': null,
            'telegram.enabled': false,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Telegram desvinculado: ${userEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Error desvinculando Telegram:`, error.message);
      throw error;
    }
  }

  /**
   * Desvincular WhatsApp
   */
  async unlinkWhatsApp(userEmail) {
    try {
      const collection = await this.getCollection();
      
      const result = await collection.updateOne(
        { userEmail },
        {
          $set: {
            'whatsapp.number': null,
            'whatsapp.enabled': false,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ WhatsApp desvinculado: ${userEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Error desvinculando WhatsApp:`, error.message);
      throw error;
    }
  }

  /**
   * Actualizar canal preferido
   */
  async updatePreferredChannel(userEmail, preferredChannel) {
    try {
      const collection = await this.getCollection();
      
      // Validar opciones
      const validChannels = ['telegram', 'whatsapp', 'both', 'none'];
      if (!validChannels.includes(preferredChannel)) {
        throw new Error(`Canal inválido: ${preferredChannel}`);
      }

      const result = await collection.updateOne(
        { userEmail },
        {
          $set: {
            preferredChannel,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Canal preferido actualizado: ${userEmail} → ${preferredChannel}`);
      return result;
    } catch (error) {
      console.error(`❌ Error actualizando canal preferido:`, error.message);
      throw error;
    }
  }

  /**
   * Actualizar configuración de recordatorios
   */
  async updateReminderSettings(userEmail, reminderSettings) {
    try {
      const collection = await this.getCollection();
      
      const updateFields = {};
      
      if (reminderSettings.frequency) {
        updateFields['reminderSettings.frequency'] = reminderSettings.frequency;
      }
      if (reminderSettings.time) {
        updateFields['reminderSettings.time'] = reminderSettings.time;
      }
      if (reminderSettings.activeRoadmapTopic !== undefined) {
        updateFields['reminderSettings.activeRoadmapTopic'] = reminderSettings.activeRoadmapTopic;
      }

      updateFields.updatedAt = new Date();

      const result = await collection.updateOne(
        { userEmail },
        { $set: updateFields }
      );

      console.log(`✅ Configuración de recordatorios actualizada: ${userEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Error actualizando recordatorios:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar usuario por chat ID de Telegram
   */
  async findByChatId(chatId) {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ 'telegram.chatId': chatId.toString() });
      return user;
    } catch (error) {
      console.error(`❌ Error buscando por chatId:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar usuario por número de WhatsApp
   */
  async findByWhatsAppNumber(phoneNumber) {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ 'whatsapp.number': phoneNumber });
      return user;
    } catch (error) {
      console.error(`❌ Error buscando por WhatsApp:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios con recordatorios activos
   */
  async getAllUsersWithRemindersEnabled() {
    try {
      const collection = await this.getCollection();
      
      // Buscar usuarios donde:
      // - Tienen al menos un canal activo (Telegram o WhatsApp)
      // - Tienen un roadmap activo configurado
      // - La frecuencia de recordatorios no es 'disabled'
      const users = await collection.find({
        $or: [
          { 'telegram.enabled': true },
          { 'whatsapp.enabled': true }
        ],
        'reminderSettings.activeRoadmapTopic': { $ne: null, $exists: true },
        'reminderSettings.frequency': { $ne: 'disabled' }
      }).toArray();
      
      console.log(`👥 Usuarios con recordatorios activos: ${users.length}`);
      return users;
    } catch (error) {
      console.error(`❌ Error obteniendo usuarios con recordatorios:`, error.message);
      throw error;
    }
  }

  /**
   * Eliminar configuración de usuario
   */
  async deleteUserSettings(userEmail) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ userEmail });
      
      console.log(`✅ Settings eliminados: ${userEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Error eliminando settings:`, error.message);
      throw error;
    }
  }
}

export default new UserNotificationSettingsService();
