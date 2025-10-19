import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migración: Agregar columnas para integración con Learning Path
 * - user_email en user_settings
 * - active_roadmap_topic en user_settings
 * - telegram_chat_id como unique
 * - preferred_channel para elegir Telegram/WhatsApp
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migración...');

    // 1. Agregar columna user_email si no existe
    const userEmailExists = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='user_settings' AND column_name='user_email'`,
      { type: QueryTypes.SELECT }
    );

    if (userEmailExists.length === 0) {
      console.log('➕ Agregando columna user_email...');
      await sequelize.query(
        `ALTER TABLE user_settings 
         ADD COLUMN user_email VARCHAR(255) UNIQUE`
      );
      console.log('✅ Columna user_email agregada');
    } else {
      console.log('ℹ️ Columna user_email ya existe');
    }

    // 2. Agregar columna active_roadmap_topic si no existe
    const activeRoadmapExists = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='user_settings' AND column_name='active_roadmap_topic'`,
      { type: QueryTypes.SELECT }
    );

    if (activeRoadmapExists.length === 0) {
      console.log('➕ Agregando columna active_roadmap_topic...');
      await sequelize.query(
        `ALTER TABLE user_settings 
         ADD COLUMN active_roadmap_topic VARCHAR(200)`
      );
      console.log('✅ Columna active_roadmap_topic agregada');
    } else {
      console.log('ℹ️ Columna active_roadmap_topic ya existe');
    }

    // 3. Hacer telegram_chat_id único si no lo es
    const telegramUniqueExists = await sequelize.query(
      `SELECT constraint_name 
       FROM information_schema.table_constraints 
       WHERE table_name='user_settings' 
       AND constraint_type='UNIQUE' 
       AND constraint_name LIKE '%telegram_chat_id%'`,
      { type: QueryTypes.SELECT }
    );

    if (telegramUniqueExists.length === 0) {
      console.log('➕ Agregando constraint UNIQUE a telegram_chat_id...');
      await sequelize.query(
        `ALTER TABLE user_settings 
         ADD CONSTRAINT unique_telegram_chat_id UNIQUE (telegram_chat_id)`
      );
      console.log('✅ Constraint UNIQUE agregado a telegram_chat_id');
    } else {
      console.log('ℹ️ telegram_chat_id ya tiene constraint UNIQUE');
    }

    // 4. Agregar columna preferred_channel si no existe
    const preferredChannelExists = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='user_settings' AND column_name='preferred_channel'`,
      { type: QueryTypes.SELECT }
    );

    if (preferredChannelExists.length === 0) {
      console.log('➕ Agregando columna preferred_channel...');
      await sequelize.query(
        `ALTER TABLE user_settings 
         ADD COLUMN preferred_channel VARCHAR(20) DEFAULT 'telegram'`
      );
      console.log('✅ Columna preferred_channel agregada');
    } else {
      console.log('ℹ️ Columna preferred_channel ya existe');
    }

    console.log('✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('🎉 Migración finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migración falló:', error);
    process.exit(1);
  });
