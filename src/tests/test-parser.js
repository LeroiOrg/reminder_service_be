import mongoService from '../services/mongoService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Parser mejorado para el response de MongoDB
 */
function parseRoadmapResponse(responseStr) {
  try {
    // Si ya es objeto, retornar
    if (typeof responseStr === 'object') {
      return responseStr;
    }

    // Método 1: Usar eval de manera controlada (Python dict → JS object)
    // Reemplazar comillas simples por dobles SOLO en las keys
    let cleaned = responseStr
      .replace(/'/g, '"')  // Reemplazar todas las comillas simples
      .replace(/\n/g, '')
      .replace(/\r/g, '');

    // Intentar parsear
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Si falla, es porque hay comas dentro de strings
      console.log('⚠️  JSON.parse falló, usando método alternativo...');
    }

    // Método 2: Usar Function constructor (más seguro que eval)
    try {
      // Extraer solo el contenido después de 'roadmap':
      const roadmapMatch = responseStr.match(/'roadmap':\s*(\{.+\})\s*,?\s*'extra_info'/s);
      
      if (roadmapMatch) {
        const roadmapStr = roadmapMatch[1];
        
        // Convertir de Python dict a JSON válido
        const jsonStr = roadmapStr
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')  // Remover comas finales
          .replace(/,\s*]/g, ']'); // Remover comas finales en arrays

        const roadmap = JSON.parse(jsonStr);
        
        // Buscar extra_info
        const extraMatch = responseStr.match(/'extra_info':\s*(\{.+\})/s);
        let extraInfo = {};
        
        if (extraMatch) {
          try {
            const extraStr = extraMatch[1]
              .replace(/'/g, '"')
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']');
            extraInfo = JSON.parse(extraStr);
          } catch (e) {
            console.log('⚠️  No se pudo parsear extra_info');
          }
        }

        return {
          roadmap,
          extra_info: extraInfo
        };
      }
    } catch (e) {
      console.error('❌ Método 2 falló:', e.message);
    }

    // Método 3: Parsear manualmente línea por línea
    console.log('⚠️  Usando parser manual...');
    const roadmap = {};
    
    // Extraer cada sección del roadmap
    const matches = responseStr.matchAll(/'([^']+)':\s*\[([^\]]+)\]/g);
    
    for (const match of matches) {
      const key = match[1];
      const values = match[2]
        .split(',')
        .map(v => v.trim().replace(/'/g, ''));
      roadmap[key] = values;
    }

    return { roadmap, extra_info: {} };

  } catch (error) {
    console.error('❌ Todos los métodos de parsing fallaron:', error.message);
    return { roadmap: {}, extra_info: {} };
  }
}

// Probar el parser
async function testParser() {
  try {
    console.log('🧪 Probando parser mejorado...\n');

    await mongoService.connect();
    const db = mongoService.db;
    const conversations = db.collection('conversations');

    const latest = await conversations.findOne(
      { user: 'user@example.com', route: '/roadmaps' },
      { sort: { timestamp: -1 } }
    );

    if (!latest) {
      console.log('❌ No se encontró roadmap');
      process.exit(1);
    }

    console.log('📄 Prompt:', latest.prompt);
    console.log('\n🔧 Parseando response...\n');

    const parsed = parseRoadmapResponse(latest.response);

    console.log('✅ Parsing completado!\n');
    console.log('📊 Resultado:');
    console.log('   - Roadmap keys:', Object.keys(parsed.roadmap || {}));
    console.log('   - Número de subtemas:', Object.keys(parsed.roadmap || {}).length);
    
    if (Object.keys(parsed.roadmap || {}).length > 0) {
      console.log('\n📚 Primer subtema:');
      const firstKey = Object.keys(parsed.roadmap)[0];
      console.log(`   "${firstKey}"`);
      console.log('   Contiene:', parsed.roadmap[firstKey]);
    }

    console.log('\n✅ Parser funciona correctamente!');

    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testParser();
