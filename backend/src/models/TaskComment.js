module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define(
    'TaskComment',
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
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 10000],
        },
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'task_comments',
          key: 'id',
        },
      },
      reply_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'task_comments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return TaskComment;
};