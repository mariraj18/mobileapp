module.exports = {
  ROLES: {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
  },

  TASK_STATUS: {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
  },

  TASK_PRIORITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },

  NOTIFICATION_TYPES: {
    DUE_DATE: 'DUE_DATE',
    PRIORITY: 'PRIORITY',
    ASSIGNMENT: 'ASSIGNMENT',
    COMMENT: 'COMMENT',
    PROJECT_INVITE: 'PROJECT_INVITE',
    TASK_ASSIGNMENT: 'TASK_ASSIGNMENT',
    PROJECT_COMPLETED: 'PROJECT_COMPLETED',
  },

  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation failed',
    SERVER_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User with this email already exists',
    WORKSPACE_NOT_FOUND: 'Workspace not found',
    PROJECT_NOT_FOUND: 'You were not added to this project',
    TASK_NOT_FOUND: 'Task not found',
    NOT_WORKSPACE_MEMBER: 'You are not a member of this workspace',
    PROJECT_COMPLETED: 'Project is completed and cannot be modified',
  },
};