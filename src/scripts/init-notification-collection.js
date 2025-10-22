import { initializeMongoDB, userNotificationSettingsService, mongoConnection } from '../mongodb/index.js';

/**
 * Script para inicializar la colección user_notification_settings en MongoDB
 * Ejecutar con: npm run init:notification-collection
 */
async function initializeCollection() {
  console.log('🚀 Inicializando colección user_notification_settings...\n');

  try {
    // 1. Inicializar MongoDB y crear índices
    console.log('📝 Paso 1: Conectar a MongoDB y crear índices');
    const initialized = await initializeMongoDB();
    
    if (!initialized) {
      throw new Error('No se pudo inicializar MongoDB');
    }

    // 2. Verificar que la base de datos existe
    const db = mongoConnection.getDb();
    console.log(`✅ Conectado a base de datos: ${db.databaseName}\n`);

    // 3. Verificar colecciones existentes
    console.log('📝 Paso 2: Verificar colecciones existentes');
    const collections = await db.listCollections().toArray();
    console.log('Colecciones encontradas:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    console.log('');

    // 4. Verificar si la colección ya existe
    const collectionExists = collections.some(col => col.name === 'user_notification_settings');
    
    if (collectionExists) {
      console.log('✅ La colección user_notification_settings ya existe\n');
    } else {
      console.log('📝 Paso 3: Crear colección user_notification_settings explícitamente');
      await db.createCollection('user_notification_settings');
      console.log('✅ Colección creada exitosamente\n');
    }

    // 5. Verificar índices
    console.log('📝 Paso 4: Verificar índices creados');
    const collection = db.collection('user_notification_settings');
    const indexes = await collection.indexes();
    console.log('Índices encontrados:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log('');

    // 6. Mostrar estadísticas de la colección
    console.log('📝 Paso 5: Estadísticas de la colección');
    const stats = await collection.stats();
    console.log(`  - Documentos: ${stats.count}`);
    console.log(`  - Tamaño: ${stats.size} bytes`);
    console.log(`  - Índices: ${stats.nindexes}`);
    console.log('');

    console.log('✅ COLECCIÓN INICIALIZADA CORRECTAMENTE!');
    console.log('');
    console.log('📍 Puedes verificar en MongoDB Atlas:');
    console.log(`   Database: leroi_learning`);
    console.log(`   Collection: user_notification_settings`);
    console.log('');

  } catch (error) {
    console.error('❌ Error inicializando colección:', error);
    process.exit(1);
  } finally {
    await mongoConnection.disconnect();
    process.exit(0);
  }
}

// Ejecutar inicialización
initializeCollection();
