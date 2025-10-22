import mongoConnection from './connection.js';
import userNotificationSettingsService from './userNotificationSettingsService.js';

/**
 * Inicializar MongoDB y crear índices necesarios
 */
export async function initializeMongoDB() {
  try {
    console.log('🔧 Inicializando MongoDB...');
    
    // Conectar a MongoDB
    await mongoConnection.connect();
    
    // Verificar conexión
    const isConnected = await mongoConnection.testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a MongoDB');
    }

    // Crear índices
    await userNotificationSettingsService.createIndexes();
    
    console.log('✅ MongoDB inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando MongoDB:', error.message);
    return false;
  }
}

export { mongoConnection, userNotificationSettingsService };
