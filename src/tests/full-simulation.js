import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_URL = process.env.USERS_SERVICE_URL || 'http://localhost:8000';
const LEARNING_URL = process.env.LEARNING_SERVICE_URL || 'http://localhost:8080';
const REMINDER_URL = 'http://localhost:8006';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

/**
 * SIMULACIÓN COMPLETA DEL FLUJO
 */
async function fullSimulation() {
  try {
    log('🎬 INICIANDO SIMULACIÓN COMPLETA DEL FLUJO', 'yellow');
    log('================================================\n', 'yellow');

    // ============================================
    // PASO 1: CREAR USUARIO EN AUTH SERVICE
    // ============================================
    section('📝 PASO 1: Crear usuario en Auth Service');

    const testUser = {
      first_name: 'Test',
      last_name: 'User',
      email: 'testuser@leroi.com',
      password: 'Test123!',
      provider: 'local'
    };

    log(`Registrando usuario: ${testUser.email}`, 'blue');

    try {
      const registerResponse = await axios.post(
        `${AUTH_URL}/users_authentication_path/register`,
        testUser
      );
      log('✅ Usuario registrado exitosamente', 'green');
      console.log('Respuesta:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('ya existe')) {
        log('ℹ️  Usuario ya existe, continuando...', 'yellow');
      } else {
        throw error;
      }
    }

    // ============================================
    // PASO 2: LOGIN PARA OBTENER TOKEN
    // ============================================
    section('🔐 PASO 2: Login para obtener token JWT');

    log('Iniciando sesión...', 'blue');
    const loginResponse = await axios.post(
      `${AUTH_URL}/users_authentication_path/login`,
      {
        email: testUser.email,
        password: testUser.password
      }
    );

    const token = loginResponse.data.access_token;
    log('✅ Login exitoso', 'green');
    log(`Token: ${token.substring(0, 30)}...`, 'blue');

    // ============================================
    // PASO 3: GENERAR ROADMAP EN LEARNING PATH
    // ============================================
    section('📚 PASO 3: Generar roadmap en Learning Path');

    const topic = 'React Hooks';
    log(`Generando roadmap para: "${topic}"`, 'blue');

    const roadmapResponse = await axios.post(
      `${LEARNING_URL}/learning_path/roadmaps`,
      { topic },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    log('✅ Roadmap generado exitosamente', 'green');
    console.log('\n📊 Roadmap obtenido:');
    console.log(JSON.stringify(roadmapResponse.data.roadmap, null, 2));

    const subtemas = Object.keys(roadmapResponse.data.roadmap);
    log(`\n📝 Total de subtemas: ${subtemas.length}`, 'blue');
    log(`🔹 Primer subtema: ${subtemas[0]}`, 'blue');

    // ============================================
    // PASO 4: VINCULAR TELEGRAM EN REMINDER
    // ============================================
    section('🔗 PASO 4: Vincular Telegram en Reminder Service');

    const telegramChatId = '123456789'; // Simulado
    log(`Chat ID simulado: ${telegramChatId}`, 'blue');

    const linkResponse = await axios.post(
      `${REMINDER_URL}/api/users/link-telegram`,
      {
        email: testUser.email,
        telegramChatId: telegramChatId,
        activeRoadmapTopic: topic
      }
    );

    log('✅ Telegram vinculado exitosamente', 'green');
    console.log('Respuesta:', linkResponse.data);

    // ============================================
    // PASO 5: VERIFICAR CONFIGURACIÓN
    // ============================================
    section('🔍 PASO 5: Verificar configuración del usuario');

    const settingsResponse = await axios.get(
      `${REMINDER_URL}/api/users/settings/${testUser.email}`
    );

    log('✅ Configuración obtenida', 'green');
    console.log('Datos del usuario:');
    console.log(JSON.stringify(settingsResponse.data.data, null, 2));

    // ============================================
    // PASO 6: SIMULAR PREGUNTA DEL BOT
    // ============================================
    section('🤖 PASO 6: Simular contexto del bot');

    log('Este es el contexto que el bot tendría:', 'blue');
    console.log({
      userEmail: testUser.email,
      telegramChatId: telegramChatId,
      activeRoadmapTopic: topic,
      roadmapSubtemas: subtemas,
      message: 'El bot puede responder preguntas contextualizadas con este roadmap'
    });

    // ============================================
    // RESUMEN FINAL
    // ============================================
    section('✅ SIMULACIÓN COMPLETADA');

    log('🎉 Flujo completo ejecutado exitosamente!\n', 'green');
    
    log('📋 RESUMEN:', 'cyan');
    log(`   1. ✅ Usuario creado: ${testUser.email}`, 'green');
    log(`   2. ✅ Token JWT obtenido`, 'green');
    log(`   3. ✅ Roadmap generado: "${topic}" (${subtemas.length} subtemas)`, 'green');
    log(`   4. ✅ Telegram vinculado: ${telegramChatId}`, 'green');
    log(`   5. ✅ Configuración verificada`, 'green');
    
    log('\n💡 PRÓXIMO PASO:', 'yellow');
    log('   - Abre Telegram y busca tu bot', 'yellow');
    log('   - Usa el comando: /roadmap', 'yellow');
    log('   - Pregunta: "¿Qué es useState?"', 'yellow');
    log('   - El bot responderá con contexto del roadmap de React Hooks\n', 'yellow');

  } catch (error) {
    log('\n❌ ERROR EN LA SIMULACIÓN', 'red');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. ¿Están los servicios corriendo?');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Ejecutar simulación
log('\n🚀 Iniciando en 2 segundos...', 'cyan');
setTimeout(() => {
  fullSimulation()
    .then(() => {
      log('\n✅ Script finalizado', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log('\n💥 Script falló', 'red');
      console.error(error);
      process.exit(1);
    });
}, 2000);
