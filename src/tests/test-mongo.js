import mongoService from '../services/mongoService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para probar la conexión a MongoDB y leer roadmaps
 */
async function testMongo() {
  try {
    console.log('🧪 Probando conexión a MongoDB...\n');

    // Test 1: Conectar
    console.log('📡 Test 1: Conectando a MongoDB...');
    await mongoService.connect();
    console.log('✅ Conexión exitosa\n');

    // Test 2: Obtener roadmaps de un usuario
    console.log('📚 Test 2: Buscando roadmaps de user@example.com...');
    const roadmaps = await mongoService.getUserRoadmaps('user@example.com', 5);
    
    if (roadmaps.length > 0) {
      console.log(`✅ Encontrados ${roadmaps.length} roadmaps:`);
      roadmaps.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.topic} (${new Date(r.timestamp).toLocaleString()})`);
      });
    } else {
      console.log('⚠️  No se encontraron roadmaps para este usuario');
      console.log('💡 Tip: Genera un roadmap en leroi.app primero');
    }

    // Test 3: Obtener último roadmap
    console.log('\n📖 Test 3: Obteniendo último roadmap generado...');
    const latest = await mongoService.getLatestRoadmap('user@example.com');
    
    if (latest) {
      console.log('✅ Último roadmap encontrado:');
      console.log(`   Tema: ${latest.topic}`);
      console.log(`   Subtemas: ${Object.keys(latest.roadmap).length}`);
      console.log(`   Fecha: ${new Date(latest.timestamp).toLocaleString()}`);
      
      if (Object.keys(latest.roadmap).length > 0) {
        console.log('\n📊 Primeros 3 subtemas:');
        Object.keys(latest.roadmap).slice(0, 3).forEach((key, i) => {
          console.log(`   ${i + 1}. ${key}`);
        });
      }
    } else {
      console.log('⚠️  No se encontró ningún roadmap');
    }

    console.log('\n✅ Todas las pruebas completadas');
    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    await mongoService.disconnect();
    process.exit(1);
  }
}

testMongo();
