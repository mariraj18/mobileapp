const { NOTIFICATION_TYPES } = require('../../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM(
          NOTIFICATION_TYPES.DUE_DATE,
          NOTIFICATION_TYPES.PRIORITY,
          NOTIFICATION_TYPES.ASSIGNMENT,
          NOTIFICATION_TYPES.COMMENT
        ),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Notification;
};
