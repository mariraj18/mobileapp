const { ROLES } = require('../../config/constants');

module.exports = (sequelize, DataTypes) => {
  const WorkspaceMember = sequelize.define(
    'WorkspaceMember',
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
      workspace_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER),
        allowNull: false,
        defaultValue: ROLES.MEMBER,
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'workspace_members',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'workspace_id'],
        },
      ],
    }
  );

  return WorkspaceMember;
};
