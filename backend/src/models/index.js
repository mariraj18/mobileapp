const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Define associations
db.User.associate = function (models) {
  models.User.hasMany(models.WorkspaceMember, { foreignKey: 'user_id', as: 'workspaceMemberships' });
  models.User.hasMany(models.ProjectMember, { foreignKey: 'user_id', as: 'projectMemberships' });
  models.User.hasMany(models.TaskAssignment, { foreignKey: 'user_id', as: 'taskAssignments' });
  models.User.hasMany(models.Task, { foreignKey: 'created_by', as: 'createdTasks' });
  models.User.hasMany(models.TaskComment, { foreignKey: 'user_id', as: 'comments' });
  models.User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
  models.User.hasMany(models.Project, { foreignKey: 'created_by', as: 'createdProjects' });
  models.User.hasMany(models.Project, { foreignKey: 'completed_by', as: 'completedProjects' });
  models.User.belongsToMany(models.Workspace, {
    through: models.WorkspaceMember,
    foreignKey: 'user_id',
    as: 'workspaces'
  });
  models.User.belongsToMany(models.Project, {
    through: models.ProjectMember,
    foreignKey: 'user_id',
    as: 'projects'
  });
  models.User.belongsToMany(models.Task, {
    through: models.TaskAssignment,
    foreignKey: 'user_id',
    as: 'assignedTasks'
  });
};

db.Workspace.associate = function (models) {
  models.Workspace.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  models.Workspace.hasMany(models.WorkspaceMember, { foreignKey: 'workspace_id', as: 'memberships' });
  models.Workspace.hasMany(models.Project, { foreignKey: 'workspace_id', as: 'projects' });
  models.Workspace.belongsToMany(models.User, {
    through: models.WorkspaceMember,
    foreignKey: 'workspace_id',
    as: 'members'
  });
};

db.WorkspaceMember.associate = function (models) {
  models.WorkspaceMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  models.WorkspaceMember.belongsTo(models.Workspace, { foreignKey: 'workspace_id', as: 'workspace' });
};

db.Project.associate = function (models) {
  models.Project.belongsTo(models.Workspace, { foreignKey: 'workspace_id', as: 'workspace' });
  models.Project.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  models.Project.belongsTo(models.User, { foreignKey: 'completed_by', as: 'completedBy' });
  models.Project.hasMany(models.ProjectMember, { foreignKey: 'project_id', as: 'memberships' });
  models.Project.hasMany(models.Task, { foreignKey: 'project_id', as: 'tasks' });
  models.Project.belongsToMany(models.User, {
    through: models.ProjectMember,
    foreignKey: 'project_id',
    as: 'members'
  });
};

db.ProjectMember.associate = function (models) {
  models.ProjectMember.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
  models.ProjectMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  models.ProjectMember.belongsTo(models.User, { foreignKey: 'added_by', as: 'addedBy' });
};

db.Task.associate = function (models) {
  models.Task.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
  models.Task.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  models.Task.hasMany(models.TaskAssignment, { foreignKey: 'task_id', as: 'assignments' });
  models.Task.hasMany(models.TaskComment, { foreignKey: 'task_id', as: 'comments' });
  models.Task.hasMany(models.TaskAttachment, { foreignKey: 'task_id', as: 'attachments' });
  models.Task.belongsToMany(models.User, {
    through: models.TaskAssignment,
    foreignKey: 'task_id',
    as: 'assignedUsers'
  });
};

db.TaskComment.associate = function (models) {
  models.TaskComment.belongsTo(models.Task, { foreignKey: 'task_id', as: 'task' });
  models.TaskComment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  models.TaskComment.belongsTo(models.User, { foreignKey: 'reply_to', as: 'replyToUser' });
  models.TaskComment.belongsTo(models.TaskComment, { foreignKey: 'parent_id', as: 'parent' });
  models.TaskComment.hasMany(models.TaskComment, { foreignKey: 'parent_id', as: 'replies' });
};

db.TaskAttachment.associate = function (models) {
  models.TaskAttachment.belongsTo(models.Task, { foreignKey: 'task_id', as: 'task' });
  models.TaskAttachment.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
};

db.Notification.associate = function (models) {
  models.Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  models.Notification.belongsTo(models.Task, { foreignKey: 'task_id', as: 'task' });
  models.Notification.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
};

// Initialize associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;