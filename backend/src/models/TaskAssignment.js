module.exports = (sequelize, DataTypes) => {
  const TaskAssignment = sequelize.define(
    'TaskAssignment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'task_assignments',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['task_id', 'user_id'],
        },
      ],
    }
  );

  return TaskAssignment;
};
