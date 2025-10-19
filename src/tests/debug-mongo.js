import mongoService from '../services/mongoService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Ver el response RAW de MongoDB
 */
async function debugMongo() {
  try {
    console.log('🔍 Inspeccionando datos crudos de MongoDB...\n');

    await mongoService.connect();
    const db = mongoService.db;
    const conversations = db.collection('conversations');

    // Obtener el último roadmap
    const latest = await conversations.findOne(
      {
        user: 'user@example.com',
        route: '/roadmaps'
      },
      {
        sort: { timestamp: -1 }
      }
    );

    if (!latest) {
      console.log('❌ No se encontró roadmap');
      process.exit(1);
    }

    console.log('📄 DATOS CRUDOS:\n');
    console.log('User:', latest.user);
    console.log('Route:', latest.route);
    console.log('Prompt:', latest.prompt);
    console.log('\n📝 RESPONSE (primeros 500 caracteres):');
    console.log(latest.response.substring(0, 500));
    console.log('\n...\n');

    console.log('📊 Tipo de dato:', typeof latest.response);
    console.log('📏 Longitud:', latest.response.length);

    // Intentar diferentes parsers
    console.log('\n🧪 PRUEBA 1: Replace comillas simples');
    try {
      const test1 = latest.response.replace(/'/g, '"');
      const parsed1 = JSON.parse(test1);
      console.log('✅ Funcionó!');
      console.log('Keys:', Object.keys(parsed1));
    } catch (e) {
      console.log('❌ Falló:', e.message.substring(0, 100));
    }

    console.log('\n🧪 PRUEBA 2: Eval (Python style)');
    try {
      // Buscar el diccionario de roadmap
      const roadmapMatch = latest.response.match(/"roadmap":\s*(\{[\s\S]*?\})\s*,?\s*"extra_info"/);
      if (roadmapMatch) {
        console.log('✅ Encontré el roadmap!');
        console.log('Contenido:', roadmapMatch[1].substring(0, 200));
      } else {
        console.log('❌ No encontré el roadmap en el response');
      }
    } catch (e) {
      console.log('❌ Falló:', e.message);
    }

    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugMongo();
