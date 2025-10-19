import mongoService from '../services/mongoService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Investigar por qué solo se parsean 5 de 12 roadmaps
 */
async function investigateRoadmaps() {
  try {
    console.log('🔍 Investigando roadmaps en MongoDB...\n');

    await mongoService.connect();
    const db = mongoService.db;
    const conversations = db.collection('conversations');

    // Obtener TODOS los documentos (sin parsear)
    const allDocs = await conversations
      .find({
        user: 'user@example.com',
        route: '/roadmaps'
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`📊 Total de documentos encontrados: ${allDocs.length}\n`);

    let successCount = 0;
    let failCount = 0;

    allDocs.forEach((doc, index) => {
      const topic = doc.prompt.match(/tema:\s*(.+)/i)?.[1] || 'Desconocido';
      
      console.log(`\n${index + 1}. Tema: ${topic}`);
      console.log(`   Timestamp: ${doc.timestamp}`);
      console.log(`   Response length: ${doc.response.length} caracteres`);
      
      // Intentar parsear
      try {
        const parsed = mongoService._parseResponse(doc.response);
        const subtemaCount = Object.keys(parsed.roadmap || {}).length;
        
        if (subtemaCount > 0) {
          console.log(`   ✅ Parseado correctamente: ${subtemaCount} subtemas`);
          successCount++;
        } else {
          console.log(`   ❌ Parseado pero sin subtemas (roadmap vacío)`);
          console.log(`   Preview: ${doc.response.substring(0, 200)}...`);
          failCount++;
        }
      } catch (e) {
        console.log(`   ❌ Error parseando: ${e.message}`);
        failCount++;
      }
    });

    console.log(`\n\n📊 RESUMEN:`);
    console.log(`   Total documentos: ${allDocs.length}`);
    console.log(`   ✅ Parseados correctamente: ${successCount}`);
    console.log(`   ❌ Fallos: ${failCount}`);

    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

investigateRoadmaps();
