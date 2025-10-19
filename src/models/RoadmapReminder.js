import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoadmapReminder = sequelize.define('RoadmapReminder', {
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
  // Info del roadmap
  roadmapId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'roadmap_id'
  },
  roadmapTitle: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'roadmap_title'
  },
  // Temas y progreso
  topicsJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'topics_json'
  },
  currentTopic: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'current_topic'
  },
  currentTopicInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'current_topic_info'
  },
  // Scheduling
  nextReminderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'next_reminder_date'
  },
  lastSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_sent_at'
  },
  // Estado
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'roadmap_reminders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default RoadmapReminder;
