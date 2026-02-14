const { TASK_STATUS, TASK_PRIORITY } = require('../../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: TASK_STATUS.TODO,
        validate: {
          isIn: [[TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]],
        },
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: TASK_PRIORITY.MEDIUM,
        validate: {
          isIn: [[
            TASK_PRIORITY.LOW,
            TASK_PRIORITY.MEDIUM,
            TASK_PRIORITY.HIGH,
            TASK_PRIORITY.URGENT
          ]],
        },
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'tasks',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Task;
};