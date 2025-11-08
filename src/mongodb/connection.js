/**
 * Módulo de conexión de base de datos
 * Migrado de MongoDB a Firestore
 */
import firestoreConnection from './firestoreConnection.js';

// Exportar la conexión para mantener compatibilidad
export default firestoreConnection;

// También exportar métodos individuales para facilitar el uso
export const { connect, disconnect, getDb, testConnection } = firestoreConnection;
