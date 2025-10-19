import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserSettings = sequelize.define('UserSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  // Email del usuario (vinculación con Auth Service)
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    field: 'user_email'
  },
  // Canales externos
  telegramChatId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    field: 'telegram_chat_id'
  },
  whatsappNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'whatsapp_number'
  },
  // Activación de canales
  telegramEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'telegram_enabled'
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'whatsapp_enabled'
  },
  // Configuración de recordatorios
  reminderFrequency: {
    type: DataTypes.STRING(20),
    defaultValue: 'daily', // daily, every_2_days, weekly
    field: 'reminder_frequency'
  },
  reminderTime: {
    type: DataTypes.STRING(5),
    defaultValue: '09:00', // HH:MM formato 24h
    field: 'reminder_time'
  },
  // Roadmap activo (último tema que está estudiando)
  activeRoadmapTopic: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'active_roadmap_topic'
  },
  // Canal favorito para recordatorios
  preferredChannel: {
    type: DataTypes.STRING(20),
    defaultValue: 'telegram', // telegram, whatsapp, both
    field: 'preferred_channel'
  },
  // Configuración de alertas de créditos
  creditAlertEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'credit_alert_enabled'
  },
  creditLowThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'credit_low_threshold'
  },
  creditCriticalThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'credit_critical_threshold'
  },
  dailyCreditReport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'daily_credit_report'
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default UserSettings;
