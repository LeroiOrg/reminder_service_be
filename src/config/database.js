import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Cambia a console.log para ver queries SQL
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test de conexión
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar PostgreSQL:', error);
    return false;
  }
};

// Sincronizar modelos (crear tablas)
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // alter: true actualiza tablas sin borrar datos
    console.log('✅ Base de datos sincronizada');
  } catch (error) {
    console.error('❌ Error al sincronizar BD:', error);
  }
};

export default sequelize;
