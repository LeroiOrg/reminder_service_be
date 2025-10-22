import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Conexión para el Reminder Service (nueva base de datos)
const MONGO_REMINDER_URI = process.env.MONGO_REMINDER_URI;
const MONGO_REMINDER_DB = process.env.MONGO_REMINDER_DB || 'leroi_reminders';

class MongoConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected && this.client) {
        return this.db;
      }

      console.log('🔌 Conectando a MongoDB (Reminder Service)...');
      this.client = new MongoClient(MONGO_REMINDER_URI);
      await this.client.connect();
      this.db = this.client.db(MONGO_REMINDER_DB);
      this.isConnected = true;
      
      console.log(`✅ Conectado a MongoDB - Base de datos: ${MONGO_REMINDER_DB}`);
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Desconectado de MongoDB (Reminder Service)');
    }
  }

  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB no está conectado. Llama a connect() primero.');
    }
    return this.db;
  }

  async testConnection() {
    try {
      await this.connect();
      await this.db.admin().ping();
      console.log('✅ MongoDB (Reminder Service) - Conexión verificada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ MongoDB (Reminder Service) - Error en test de conexión:', error.message);
      return false;
    }
  }
}

export default new MongoConnection();
