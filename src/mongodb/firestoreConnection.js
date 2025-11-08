/**
 * Conexión a Google Cloud Firestore
 * Reemplaza MongoDB para reminder service
 */
import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Variables de configuración
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'leroi-474015';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './keys/service-account.json';

/**
 * Clase para manejar la conexión a Firestore
 */
class FirestoreConnection {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Inicializa la conexión a Firestore
   * @returns {Firestore} Cliente de Firestore
   */
  async connect() {
    try {
      if (this.isConnected && this.db) {
        return this.db;
      }

      console.log('🔌 Conectando a Firestore (Reminder Service)...');

      // Crear cliente de Firestore
      this.db = new Firestore({
        projectId: PROJECT_ID,
        keyFilename: resolve(CREDENTIALS_PATH),
      });

      this.isConnected = true;
      console.log(`✅ Conectado a Firestore - Proyecto: ${PROJECT_ID}`);

      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a Firestore:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Desconecta de Firestore
   */
  async disconnect() {
    if (this.db) {
      await this.db.terminate();
      this.isConnected = false;
      console.log('🔌 Desconectado de Firestore (Reminder Service)');
    }
  }

  /**
   * Obtiene el cliente de Firestore
   * @returns {Firestore} Cliente de Firestore
   * @throws {Error} Si no está conectado
   */
  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('Firestore no está conectado. Llama a connect() primero.');
    }
    return this.db;
  }

  /**
   * Verifica la conexión a Firestore
   * @returns {Promise<boolean>} true si la conexión es exitosa
   */
  async testConnection() {
    try {
      await this.connect();
      
      // Intentar listar colecciones para verificar conexión
      const collections = await this.db.listCollections();
      console.log(`✅ Firestore (Reminder Service) - Conexión verificada exitosamente`);
      console.log(`📚 Colecciones disponibles: ${collections.length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Firestore (Reminder Service) - Error en test de conexión:', error.message);
      return false;
    }
  }
}

// Nombres de colecciones
export const Collections = {
  USER_NOTIFICATION_SETTINGS: 'user_notification_settings',
  NOTIFICATION_HISTORY: 'notification_history',
  REMINDER_LOGS: 'reminder_logs',
  CHAT_SESSIONS: 'chat_sessions',
};

// Exportar instancia única (singleton)
const firestoreConnection = new FirestoreConnection();
export default firestoreConnection;
