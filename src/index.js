import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, syncDatabase } from './config/database.js';
import testRoutes from './routes/testRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import whatsappWebhookRoutes from './routes/whatsappWebhookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reminderScheduler from './services/reminderScheduler.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    service: 'reminder-service',
    status: 'healthy',
    version: '3.0.0',
    tech: 'Node.js + Express',
    features: [
      'Telegram Bot with Roadmap Integration',
      'WhatsApp Notifications',
      'AI-Powered Chatbot (Groq/Llama)',
      'Learning Path Integration'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de testing
app.use('/api/v1/test', testRoutes);

// Webhooks
app.use('/webhooks', webhookRoutes);
app.use('/webhooks', whatsappWebhookRoutes);

// Rutas de gestión de usuarios
app.use('/api/users', userRoutes);

// Middleware de 404
app.use(notFound);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    console.log('🔧 Iniciando Reminder Service...');
    
    // Verificar conexión a BD
    console.log('📊 Conectando a PostgreSQL...');
    await testConnection();
    
    // Sincronizar modelos
    console.log('🔄 Sincronizando modelos...');
    await syncDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n✅ Servidor iniciado exitosamente!');
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`📡 Webhooks: http://localhost:${PORT}/webhooks`);
      console.log(`👤 User API: http://localhost:${PORT}/api/users`);
      console.log(`🤖 Telegram Bot: Activo`);
      console.log(`📱 WhatsApp Bot: Activo`);
      console.log('\n📚 Servicios integrados:');
      console.log(`   - Auth Service: ${process.env.USERS_SERVICE_URL}`);
      console.log(`   - Learning Path: ${process.env.LEARNING_SERVICE_URL}`);
      console.log(`   - MongoDB: Conectado`);
      
      // Iniciar sistema de recordatorios
      console.log('\n⏰ Iniciando sistema de recordatorios...');
      reminderScheduler.start();
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
