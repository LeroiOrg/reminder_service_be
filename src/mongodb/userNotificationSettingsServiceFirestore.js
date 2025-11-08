/**
 * Servicio para gestionar la configuración de notificaciones de usuarios en Firestore
 * Migrado de MongoDB a Firestore
 * Colección: user_notification_settings
 */
import firestoreConnection from './firestoreConnection.js';

class UserNotificationSettingsService {
  constructor() {
    this.collectionName = 'user_notification_settings';
  }

  /**
   * Obtener la colección de Firestore
   */
  getCollection() {
    const db = firestoreConnection.getDb();
    return db.collection(this.collectionName);
  }

  /**
   * Obtener configuración de usuario por email
   */
  async getUserSettings(userEmail) {
    try {
      const collection = this.getCollection();
      
      // En Firestore, usamos el email como document ID para búsquedas rápidas
      const docRef = collection.doc(userEmail);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        data.userEmail = doc.id; // Agregar el email
        return data;
      }
      
      return null;
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);
      
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Actualizar documento existente
        await docRef.update({
          ...settingsData,
          updatedAt: new Date()
        });
      } else {
        // Crear nuevo documento
        await docRef.set({
          userEmail,
          ...settingsData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`✅ Settings actualizados para ${userEmail}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);
      const doc = await docRef.get();

      if (doc.exists) {
        // Actualizar documento existente
        await docRef.update({
          telegram: {
            chatId: chatId.toString(),
            enabled: true
          },
          updatedAt: new Date()
        });
      } else {
        // Crear nuevo documento con configuración por defecto
        await docRef.set({
          userEmail,
          telegram: {
            chatId: chatId.toString(),
            enabled: true
          },
          whatsapp: {
            number: null,
            enabled: false
          },
          preferredChannel: 'telegram',
          reminderSettings: {
            frequency: 'daily',
            time: '09:00',
            activeRoadmapTopic: null
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`✅ Telegram vinculado: ${userEmail} → ${chatId}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);
      const doc = await docRef.get();

      if (doc.exists) {
        // Actualizar documento existente
        await docRef.update({
          whatsapp: {
            number: phoneNumber,
            enabled: true
          },
          updatedAt: new Date()
        });
      } else {
        // Crear nuevo documento con configuración por defecto
        await docRef.set({
          userEmail,
          telegram: {
            chatId: null,
            enabled: false
          },
          whatsapp: {
            number: phoneNumber,
            enabled: true
          },
          preferredChannel: 'whatsapp',
          reminderSettings: {
            frequency: 'daily',
            time: '09:00',
            activeRoadmapTopic: null
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`✅ WhatsApp vinculado: ${userEmail} → ${phoneNumber}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);

      await docRef.update({
        'telegram.chatId': null,
        'telegram.enabled': false,
        updatedAt: new Date()
      });

      console.log(`✅ Telegram desvinculado: ${userEmail}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);

      await docRef.update({
        'whatsapp.number': null,
        'whatsapp.enabled': false,
        updatedAt: new Date()
      });

      console.log(`✅ WhatsApp desvinculado: ${userEmail}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);

      // Validar opciones
      const validChannels = ['telegram', 'whatsapp', 'both', 'none'];
      if (!validChannels.includes(preferredChannel)) {
        throw new Error(`Canal inválido: ${preferredChannel}`);
      }

      await docRef.update({
        preferredChannel,
        updatedAt: new Date()
      });

      console.log(`✅ Canal preferido actualizado: ${userEmail} → ${preferredChannel}`);
      return { success: true };
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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);

      const updateFields = { updatedAt: new Date() };

      if (reminderSettings.frequency !== undefined) {
        updateFields['reminderSettings.frequency'] = reminderSettings.frequency;
      }
      if (reminderSettings.time !== undefined) {
        updateFields['reminderSettings.time'] = reminderSettings.time;
      }
      if (reminderSettings.activeRoadmapTopic !== undefined) {
        updateFields['reminderSettings.activeRoadmapTopic'] = reminderSettings.activeRoadmapTopic;
      }

      await docRef.update(updateFields);

      console.log(`✅ Configuración de recordatorios actualizada: ${userEmail}`);
      return { success: true };
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
      const collection = this.getCollection();
      
      // Query en Firestore
      const snapshot = await collection
        .where('telegram.chatId', '==', chatId.toString())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      data.userEmail = doc.id;
      return data;
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
      const collection = this.getCollection();

      const snapshot = await collection
        .where('whatsapp.number', '==', phoneNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      data.userEmail = doc.id;
      return data;
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
      const collection = this.getCollection();

      // En Firestore necesitamos queries separados y luego filtrar en memoria
      // porque no podemos hacer OR queries complejos directamente
      
      const snapshot = await collection.get();
      
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.userEmail = doc.id;
        
        // Filtrar usuarios que cumplan las condiciones
        const hasTelegramEnabled = data.telegram?.enabled === true;
        const hasWhatsAppEnabled = data.whatsapp?.enabled === true;
        const hasActiveRoadmap = data.reminderSettings?.activeRoadmapTopic != null;
        const frequencyNotDisabled = data.reminderSettings?.frequency !== 'disabled';
        
        if ((hasTelegramEnabled || hasWhatsAppEnabled) && hasActiveRoadmap && frequencyNotDisabled) {
          users.push(data);
        }
      });

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
      const collection = this.getCollection();
      const docRef = collection.doc(userEmail);
      
      await docRef.delete();
      console.log(`✅ Settings eliminados: ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error eliminando settings:`, error.message);
      throw error;
    }
  }
}

export default new UserNotificationSettingsService();
