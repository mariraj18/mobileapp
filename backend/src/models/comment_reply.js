module.exports = (sequelize, DataTypes) => {
  const CommentReply = sequelize.define(
    'CommentReply',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      comment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'task_comments',
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
      reply_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'task_comments',
          key: 'id',
        },
      },
    },
    {
      tableName: 'comment_replies',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return CommentReply;
};