import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Usar la URI del learning_path
const MONGO_URI = 'mongodb+srv://leroidevteam:pNRoSlb1lIav55Z9@leroi.j1keefw.mongodb.net/?retryWrites=true&w=majority&appName=Leroi';
const DB_NAME = 'leroi_learning';

async function checkRoadmaps() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB (Learning Path)');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('conversations');
    
    const userEmail = 'user@example.com';
    
    // Buscar todas las conversaciones del usuario
    const allConversations = await collection.find({
      user: userEmail
    }).toArray();
    
    console.log(`\n📊 Total conversaciones de ${userEmail}: ${allConversations.length}`);
    
    // Filtrar solo roadmaps
    const roadmaps = allConversations.filter(conv => conv.route === '/roadmaps');
    
    console.log(`📚 Total roadmaps: ${roadmaps.length}\n`);
    
    if (roadmaps.length > 0) {
      console.log('📋 Lista de roadmaps:\n');
      roadmaps.forEach((r, i) => {
        console.log(`${i + 1}. Prompt: ${r.prompt}`);
        console.log(`   Route: ${r.route}`);
        console.log(`   Fecha: ${r.timestamp}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron roadmaps');
      console.log('\n📋 Rutas encontradas:');
      const routes = [...new Set(allConversations.map(c => c.route))];
      routes.forEach(route => {
        const count = allConversations.filter(c => c.route === route).length;
        console.log(`   - ${route}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkRoadmaps();
