import mongoService from '../services/mongoService.js';
import groqService from '../services/groqService.js';
import { UserSettings } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simular flujo completo del bot
 */
async function testBotFlow() {
  try {
    console.log('🤖 SIMULANDO FLUJO DEL BOT\n');
    console.log('='.repeat(60));

    // 1. Usuario escribe en Telegram
    const chatId = '123456789';
    const userQuestion = '¿Cuánto ejercicio necesita un pomerania?';

    console.log(`\n📱 Usuario (chat_id: ${chatId}) pregunta:`);
    console.log(`   "${userQuestion}"\n`);

    // 2. Bot busca en UserSettings
    console.log('🔍 Paso 1: Buscar usuario por chat_id...');
    const userSettings = await UserSettings.findOne({
      where: { telegramChatId: chatId }
    });

    if (!userSettings) {
      console.log('❌ Usuario no vinculado');
      console.log('💡 El bot respondería: "Vincula tu cuenta con /vincular"');
      return;
    }

    console.log(`✅ Usuario encontrado: ${userSettings.userEmail}`);

    // 3. Buscar roadmaps en MongoDB
    console.log('\n📚 Paso 2: Buscar roadmaps del usuario en MongoDB...');
    await mongoService.connect();
    const roadmaps = await mongoService.getUserRoadmaps(userSettings.userEmail, 10);

    if (roadmaps.length === 0) {
      console.log('❌ Usuario no tiene roadmaps');
      console.log('💡 El bot respondería: "Crea un roadmap en leroi.app"');
      return;
    }

    console.log(`✅ Encontrados ${roadmaps.length} roadmaps:`);
    roadmaps.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.topic}`);
    });

    // 4. Determinar roadmap activo
    let activeRoadmap = null;
    if (userSettings.activeRoadmapTopic) {
      console.log(`\n📖 Paso 3: Usuario tiene roadmap activo: "${userSettings.activeRoadmapTopic}"`);
      activeRoadmap = await mongoService.getRoadmapByTopic(
        userSettings.userEmail,
        userSettings.activeRoadmapTopic
      );
    } else {
      console.log(`\n📖 Paso 3: Usuario NO tiene roadmap activo`);
      console.log('💡 El bot respondería: "Tienes varios roadmaps. ¿Cuál quieres usar?"');
      console.log('   Usa: /cambiar [tema]');
      
      // Para la demo, usamos el primero
      console.log(`\n🎯 Para esta demo, usaremos: "${roadmaps[0].topic}"`);
      activeRoadmap = await mongoService.getRoadmapByTopic(
        userSettings.userEmail,
        roadmaps[0].topic
      );
    }

    if (!activeRoadmap) {
      console.log('❌ No se pudo cargar el roadmap');
      return;
    }

    console.log('✅ Roadmap cargado correctamente');
    console.log(`   Tema: ${activeRoadmap.topic}`);
    console.log(`   Subtemas: ${Object.keys(activeRoadmap.roadmap).length}`);

    // 5. Preparar contexto para IA
    console.log('\n🧠 Paso 4: Generar respuesta con IA (Groq)...');
    const context = {
      topic: activeRoadmap.topic,
      roadmap: activeRoadmap.roadmap,
      extraInfo: activeRoadmap.extraInfo
    };

    console.log('\n📊 Contexto enviado a Groq:');
    console.log(`   Tema: ${context.topic}`);
    console.log(`   Subtemas en roadmap:`);
    Object.keys(context.roadmap).slice(0, 3).forEach(subtema => {
      console.log(`      - ${subtema}`);
    });

    // 6. Obtener respuesta de IA
    const aiResponse = await groqService.generateResponse(userQuestion, context);

    if (!aiResponse.success) {
      console.log('❌ Error generando respuesta:', aiResponse.error);
      return;
    }

    // 7. Mostrar respuesta final
    console.log('\n✅ Respuesta generada exitosamente!\n');
    console.log('='.repeat(60));
    console.log('🤖 BOT RESPONDE:');
    console.log('='.repeat(60));
    console.log(aiResponse.response);
    console.log('='.repeat(60));

    console.log('\n✅ FLUJO COMPLETADO EXITOSAMENTE! 🎉\n');

    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el flujo:', error);
    await mongoService.disconnect();
    process.exit(1);
  }
}

// Ejecutar
console.log('\n🚀 Iniciando prueba de flujo completo...\n');
testBotFlow();
