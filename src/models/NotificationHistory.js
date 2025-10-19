import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NotificationHistory = sequelize.define('NotificationHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  // Tipo y contenido
  notificationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'notification_type'
  },
  channel: {
    type: DataTypes.ENUM('telegram', 'whatsapp', 'in_app'),
    allowNull: false
  },
  message: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  // Estado
  status: {
    type: DataTypes.ENUM('sent', 'failed', 'pending'),
    defaultValue: 'sent'
  },
  errorMessage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'error_message'
  },
  // Timestamp
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'sent_at'
  }
}, {
  tableName: 'notification_history',
  timestamps: false
});

export default NotificationHistory;
