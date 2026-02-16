const Joi = require('joi');
const { ROLES, TASK_STATUS, TASK_PRIORITY, NOTIFICATION_TYPES } = require('../../config/constants');

const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(255).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

const userCodeParam = Joi.object({
  userCode: Joi.string().length(5).pattern(/^[A-Z0-9]+$/).required(),
});

const addMemberByCodeSchema = Joi.object({
  userCode: Joi.string().length(5).pattern(/^[A-Z0-9]+$/).required(),
  role: Joi.string()
    .valid(ROLES.MEMBER, ROLES.ADMIN)
    .default(ROLES.MEMBER),
});

const workspaceSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).required(),
  }),

  addMember: Joi.object({
    userId: Joi.string().uuid().required(),
    role: Joi.string()
      .valid(ROLES.MEMBER, ROLES.ADMIN)
      .default(ROLES.MEMBER),
  }),

  updateMemberRole: Joi.object({
    role: Joi.string()
      .valid(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER)
      .required(),
  }),

  addMemberByCode: addMemberByCodeSchema,
};

const projectSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('').max(1000).optional(),
    memberIds: Joi.array().items(Joi.string().uuid()).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().allow('').max(1000).optional(),
    is_completed: Joi.boolean().optional(),
  }),

  addMember: Joi.object({
    userId: Joi.string().uuid().required(),
  }),
};

const taskSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('').max(10000).default(''),
    status: Joi.string()
      .valid(...Object.values(TASK_STATUS))
      .default(TASK_STATUS.TODO),
    priority: Joi.string()
      .valid(...Object.values(TASK_PRIORITY))
      .default(TASK_PRIORITY.MEDIUM),
    due_date: Joi.date().iso().allow(null).optional(),
    assignedUserIds: Joi.array().items(Joi.string().uuid()).default([]),
  }),

  createStandalone: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('').max(10000).default(''),
    status: Joi.string()
      .valid(...Object.values(TASK_STATUS))
      .default(TASK_STATUS.TODO),
    priority: Joi.string()
      .valid(...Object.values(TASK_PRIORITY))
      .default(TASK_PRIORITY.MEDIUM),
    due_date: Joi.date().iso().allow(null).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    description: Joi.string().allow('').max(10000).optional(),
    status: Joi.string()
      .valid(...Object.values(TASK_STATUS))
      .optional(),
    priority: Joi.string()
      .valid(...Object.values(TASK_PRIORITY))
      .optional(),
    due_date: Joi.date().iso().allow(null).optional(),
  }),

  assignUsers: Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  }),

  unassignUsers: Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  }),

  query: Joi.object({
    status: Joi.string().valid(...Object.values(TASK_STATUS)).optional(),
    priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).optional(),
    assignedTo: Joi.string().uuid().optional(),
    search: Joi.string().max(255).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string()
      .valid('created_at', 'updated_at', 'due_date', 'priority', 'title')
      .default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

const commentSchemas = {
  create: Joi.object({
    content: Joi.string().min(1).max(10000).required(),
    parentId: Joi.string().uuid().optional(),
    replyTo: Joi.string().uuid().optional(),
  }),

  update: Joi.object({
    content: Joi.string().min(1).max(10000).required(),
  }),
};

const notificationSchemas = {
  query: Joi.object({
    unreadOnly: Joi.boolean().default(false),
    type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const uuidParam = Joi.object({
  id: Joi.string().uuid().required(),
});

const workspaceIdParam = Joi.object({
  workspaceId: Joi.string().uuid().required(),
});

const projectIdParam = Joi.object({
  projectId: Joi.string().uuid().required(),
});

const taskIdParam = Joi.object({
  taskId: Joi.string().uuid().required(),
});

module.exports = {
  authSchemas,
  workspaceSchemas,
  projectSchemas,
  taskSchemas,
  commentSchemas,
  notificationSchemas,
  uuidParam,
  workspaceIdParam,
  projectIdParam,
  taskIdParam,
  userCodeParam,
};