module.exports = (sequelize, DataTypes) => {
  const TaskAttachment = sequelize.define(
    'TaskAttachment',
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
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      original_filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10485760,
        },
      },
      file_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      uploaded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'task_attachments',
      timestamps: false,
    }
  );

  return TaskAttachment;
};
