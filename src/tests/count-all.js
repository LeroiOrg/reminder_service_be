import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function countAll() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('leroi_learning');
    const conversations = db.collection('conversations');

    // Count total
    const total = await conversations.countDocuments({
      user: 'user@example.com',
      route: '/roadmaps'
    });

    console.log(`\n📊 Total de roadmaps en MongoDB: ${total}\n`);

    // Get all (sin límite)
    const all = await conversations
      .find({
        user: 'user@example.com',
        route: '/roadmaps'
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`📋 Documentos retornados por find(): ${all.length}\n`);

    all.forEach((doc, i) => {
      const topic = doc.prompt.match(/tema:\s*(.+)/i)?.[1] || 'Desconocido';
      console.log(`${i + 1}. ${topic} (${new Date(doc.timestamp).toLocaleDateString()})`);
    });

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

countAll();
