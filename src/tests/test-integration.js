import authServiceClient from '../services/authServiceClient.js';
import learningPathClient from '../services/learningPathClient.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de prueba para verificar la integración con los microservicios
 */
async function testIntegration() {
  console.log('🧪 Iniciando pruebas de integración...\n');

  // Test 1: Health check de Auth Service
  console.log('📡 Test 1: Verificando Auth Service...');
  const authHealth = await authServiceClient.healthCheck();
  if (authHealth) {
    console.log('✅ Auth Service está disponible\n');
  } else {
    console.log('❌ Auth Service NO disponible\n');
  }

  // Test 2: Health check de Learning Path
  console.log('📡 Test 2: Verificando Learning Path Service...');
  const learningHealth = await learningPathClient.healthCheck();
  if (learningHealth) {
    console.log('✅ Learning Path Service está disponible\n');
  } else {
    console.log('❌ Learning Path Service NO disponible\n');
  }

  // Test 3: Obtener roadmap de prueba
  if (learningHealth) {
    console.log('📚 Test 3: Obteniendo roadmap de React...');
    const roadmapResult = await learningPathClient.getCompleteTopicInfo('React', null);
    
    if (roadmapResult.success) {
      console.log('✅ Roadmap obtenido exitosamente');
      console.log('📊 Subtemas encontrados:', Object.keys(roadmapResult.roadmap).length);
      console.log('📝 Primer subtema:', Object.keys(roadmapResult.roadmap)[0]);
      console.log('');
    } else {
      console.log('❌ Error obteniendo roadmap:', roadmapResult.error);
      console.log('');
    }
  }

  // Test 4: Temas relacionados
  if (learningHealth) {
    console.log('🔗 Test 4: Obteniendo temas relacionados con Python...');
    const relatedResult = await learningPathClient.getRelatedTopics('Python', null);
    
    if (relatedResult.success) {
      console.log('✅ Temas relacionados obtenidos');
      console.log('📋 Temas:', relatedResult.relatedTopics.slice(0, 3).join(', '));
      console.log('');
    } else {
      console.log('❌ Error obteniendo temas relacionados:', relatedResult.error);
      console.log('');
    }
  }

  console.log('🎉 Pruebas completadas!\n');
  console.log('📝 Resumen:');
  console.log(`   Auth Service: ${authHealth ? '✅' : '❌'}`);
  console.log(`   Learning Path: ${learningHealth ? '✅' : '❌'}`);
  
  process.exit(0);
}

// Ejecutar pruebas
testIntegration().catch((error) => {
  console.error('💥 Error en las pruebas:', error);
  process.exit(1);
});
