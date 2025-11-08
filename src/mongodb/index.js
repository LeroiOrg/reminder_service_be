import firestoreConnection from './connection.js';
import userNotificationSettingsService from './userNotificationSettingsService.js';

/**
 * Inicializar Firestore y crear índices necesarios
 */
export async function initializeFirestore() {
  try {
    console.log('🔧 Inicializando Firestore...');
    
    // Conectar a Firestore
    await firestoreConnection.connect();
    
    // Verificar conexión
    const isConnected = await firestoreConnection.testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a Firestore');
    }

    // Los índices en Firestore se crean automáticamente o se configuran en la consola de GCP
    // No es necesario crearlos manualmente como en MongoDB
    console.log('ℹ️  Nota: Los índices en Firestore se gestionan automáticamente');
    
    console.log('✅ Firestore inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Firestore:', error.message);
    return false;
  }
}

// Mantener compatibilidad con código existente
export const initializeMongoDB = initializeFirestore;
export { firestoreConnection as mongoConnection, userNotificationSettingsService };
