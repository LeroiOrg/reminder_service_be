import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_REMINDER_URI;
const DB_NAME = process.env.MONGO_REMINDER_DB || 'leroi_reminders';

async function checkUser() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('user_notification_settings');
    
    // Buscar usuario con chat_id 6913301172
    const chatId = '6913301172';
    const user = await collection.findOne({
      'telegram.chatId': chatId
    });
    
    console.log('\n📊 Usuario encontrado:');
    console.log(JSON.stringify(user, null, 2));
    
    if (user) {
      console.log(`\n✅ Email del usuario: ${user.userEmail}`);
      console.log(`✅ Telegram Chat ID: ${user.telegram?.chatId}`);
      console.log(`✅ Roadmap activo: ${user.reminderSettings?.activeRoadmapTopic || 'No configurado'}`);
    } else {
      console.log('\n❌ No se encontró usuario con ese Chat ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUser();
