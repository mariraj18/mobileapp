const { Task, Project, User, TaskAssignment, TaskComment, TaskAttachment, Notification, ProjectMember, WorkspaceMember } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES, ROLES } = require('../../config/constants');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { publishTask } = require('../utils/queue');

const createTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { projectId } = req.params;
    const { title, description, status, priority, due_date, assignedUserIds } = req.validatedBody;
    const userId = req.user.id;

    const project = await Project.findByPk(projectId, { transaction });

    if (!project) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (project.is_completed) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user is project member or workspace owner/admin
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId },
      transaction,
    });

    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
      transaction,
    });

    if (!isProjectMember && !workspaceMembership && project.created_by !== userId) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to create tasks in this project',
      });
    }

    const task = await Task.create(
      {
        title,
        description,
        status,
        priority,
        due_date,
        project_id: projectId,
        created_by: userId,
      },
      { transaction }
    );

    if (assignedUserIds && assignedUserIds.length > 0) {
      const assignments = assignedUserIds.map((uid) => ({
        task_id: task.id,
        user_id: uid,
      }));

      await TaskAssignment.bulkCreate(assignments, { transaction });

      for (const uid of assignedUserIds) {
        await publishTask('notification', {
          user_id: uid,
          task_id: task.id,
          type: NOTIFICATION_TYPES.TASK_ASSIGNMENT,
          message: `You have been assigned to task: "${task.title}" in project "${project.name}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: project.id,
            projectName: project.name,
          },
        });
      }
    }

    await transaction.commit();

    await publishTask('activity-log', {
      level: 'info',
      message: `Task created: ${task.title} by ${req.user.email}`,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.validatedQuery);
    const { status, priority, assignedTo, search, sortBy, sortOrder } = req.validatedQuery;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_NOT_FOUND,
      });
    }

    // Check if user is project member or workspace owner/admin
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: project.workspace_id,
        role: [ROLES.OWNER, ROLES.ADMIN],
      },
    });

    if (!isProjectMember && !workspaceMembership && project.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to access tasks in this project',
      });
    }

    if (project.is_completed) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    const whereClause = { project_id: projectId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include = [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
      },
      {
        model: User,
        as: 'assignedUsers',
        attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        through: { attributes: [] },
        ...(assignedTo && {
          where: { id: assignedTo },
          required: true,
        }),
      },
    ];

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      include,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(rows, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          through: { attributes: ['assigned_at'] },
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'workspace_id', 'is_completed'],
        },
      ],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if user has permission
    if (task.project_id) {
      const isProjectMember = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: userId },
      });

      const workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: task.project.workspace_id,
          role: [ROLES.OWNER, ROLES.ADMIN],
        },
      });

      if (!isProjectMember && !workspaceMembership && task.created_by !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to access this task',
        });
      }
    } else {
      // Standalone task - check if user is creator or assigned
      const isCreator = task.created_by === userId;
      const isAssigned = task.assignedUsers.some(u => u.id === userId);

      if (!isCreator && !isAssigned) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to access this standalone task',
        });
      }
    }

    const commentCount = await TaskComment.count({
      where: { task_id: id },
    });

    const attachmentCount = await TaskAttachment.count({
      where: { task_id: id },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...task.toJSON(),
        commentCount,
        attachmentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.validatedBody;
    const userId = req.user.id;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project',
      }],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (task.project_id && task.project?.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user has permission
    if (task.project_id) {
      const isProjectMember = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: userId },
      });

      const workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: task.project.workspace_id,
          role: [ROLES.OWNER, ROLES.ADMIN],
        },
      });

      if (!isProjectMember && !workspaceMembership && task.created_by !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to update this task',
        });
      }
    } else {
      // Standalone task - only creator can update
      if (task.created_by !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to update this standalone task',
        });
      }
    }

    const oldDueDate = task.due_date;
    const oldPriority = task.priority;

    Object.assign(task, updates);
    await task.save();

    if (updates.due_date && updates.due_date !== oldDueDate) {
      const assignedUsers = await User.findAll({
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            where: { id: task.id },
            through: { attributes: [] },
          },
        ],
      });

      for (const user of assignedUsers) {
        await publishTask('notification', {
          user_id: user.id,
          task_id: task.id,
          type: NOTIFICATION_TYPES.DUE_DATE,
          message: `Due date updated for task: "${task.title}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            newDueDate: updates.due_date,
          },
        });
      }
    }

    await publishTask('activity-log', {
      level: 'info',
      message: `Task updated: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project',
      }],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (task.project_id && task.project?.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user has permission
    if (task.project_id) {
      const workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: userId,
          workspace_id: task.project.workspace_id,
          role: [ROLES.OWNER, ROLES.ADMIN],
        },
      });

      // Role check: Admin/Owner, Task Creator, or Project Creator
      const isProjectCreator = task.project.created_by === userId;

      if (!workspaceMembership && task.created_by !== userId && !isProjectCreator) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to delete this task',
        });
      }
    } else {
      // Standalone task - only creator can delete
      if (task.created_by !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to delete this standalone task',
        });
      }
    }

    await task.destroy();

    await publishTask('activity-log', {
      level: 'info',
      message: `Task deleted: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const assignUsers = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { userIds } = req.validatedBody;
    const currentUserId = req.user.id;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project',
      }],
      transaction,
    });

    if (!task) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (task.project_id && task.project?.is_completed) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user has permission to assign users
    if (task.project_id) {
      const isProjectMember = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: currentUserId },
        transaction,
      });

      const workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: currentUserId,
          workspace_id: task.project.workspace_id,
          role: [ROLES.OWNER, ROLES.ADMIN],
        },
        transaction,
      });

      if (!isProjectMember && !workspaceMembership && task.created_by !== currentUserId) {
        await transaction.rollback();
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to assign users in this project',
        });
      }
    } else {
      // Standalone task - only creator can assign
      if (task.created_by !== currentUserId) {
        await transaction.rollback();
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to assign users to this standalone task',
        });
      }
    }

    const newAssignments = [];

    for (const userId of userIds) {
      const existing = await TaskAssignment.findOne({
        where: { task_id: id, user_id: userId },
        transaction,
      });

      if (!existing) {
        await TaskAssignment.create(
          {
            task_id: id,
            user_id: userId,
          },
          { transaction }
        );

        await publishTask('notification', {
          user_id: userId,
          task_id: id,
          type: NOTIFICATION_TYPES.TASK_ASSIGNMENT,
          message: task.project_id
            ? `You have been assigned to task: "${task.title}" in project "${task.project.name}"`
            : `You have been assigned to task: "${task.title}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.project_id,
            projectName: task.project?.name,
          },
        });

        newAssignments.push(userId);
      }
    }

    await transaction.commit();

    await publishTask('activity-log', {
      level: 'info',
      message: `Users assigned to task: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users assigned successfully',
      data: { assignedCount: newAssignments.length },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const unassignUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds } = req.validatedBody;
    const currentUserId = req.user.id;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project',
      }],
    });

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Check if project is completed
    if (task.project.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user has permission
    if (task.project_id) {
      const isProjectMember = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: currentUserId },
      });

      const workspaceMembership = await WorkspaceMember.findOne({
        where: {
          user_id: currentUserId,
          workspace_id: task.project.workspace_id,
          role: [ROLES.OWNER, ROLES.ADMIN],
        },
      });

      if (!isProjectMember && !workspaceMembership && task.created_by !== currentUserId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to unassign users in this project',
        });
      }
    } else {
      // Standalone task - only creator can unassign
      if (task.created_by !== currentUserId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to unassign users from this standalone task',
        });
      }
    }

    const deleted = await TaskAssignment.destroy({
      where: {
        task_id: id,
        user_id: userIds,
      },
    });

    await publishTask('activity-log', {
      level: 'info',
      message: `Users unassigned from task: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users unassigned successfully',
      data: { unassignedCount: deleted },
    });
  } catch (error) {
    next(error);
  }
};

const getUserTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, priority, search, projectId } = req.query;

    // Base query for tasks assigned to user
    const taskWhereClause = {};
    const assignmentInclude = {
      model: User,
      as: 'assignedUsers',
      attributes: ['id'],
      where: { id: userId },
      required: false,
      through: { attributes: [] },
    };

    if (status) {
      taskWhereClause.status = status;
    }

    if (priority) {
      taskWhereClause.priority = priority;
    }

    if (search) {
      taskWhereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add project filter or standalone/assigned logic
    if (projectId) {
      taskWhereClause.project_id = projectId;
      assignmentInclude.required = true;
    } else {
      taskWhereClause[Op.or] = [
        { '$assignedUsers.id$': userId },
        { [Op.and]: [{ project_id: null }, { created_by: userId }] }
      ];
    }

    const { count, rows } = await Task.findAndCountAll({
      where: taskWhereClause,
      include: [
        assignmentInclude,
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'workspace_id', 'is_completed'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
      ],
      limit,
      offset,
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      subQuery: false,
    });

    // Calculate stats
    const statsWhere = {
      [Op.or]: [
        { '$assignedUsers.id$': userId },
        { [Op.and]: [{ project_id: null }, { created_by: userId }] }
      ],
      [Op.and]: [
        {
          [Op.or]: [
            { project_id: null },
            { '$project.is_completed$': false }
          ]
        }
      ]
    };

    const statsInclude = [
      {
        model: User,
        as: 'assignedUsers',
        attributes: [],
        where: { id: userId },
        required: false,
        through: { attributes: [] },
      },
      {
        model: Project,
        as: 'project',
        attributes: [],
        required: false,
      },
    ];

    const [active, completed, dueToday] = await Promise.all([
      Task.count({
        where: { ...statsWhere, status: { [Op.ne]: 'DONE' } },
        include: statsInclude,
      }),
      Task.count({
        where: { ...statsWhere, status: 'DONE' },
        include: statsInclude,
      }),
      Task.count({
        where: {
          ...statsWhere,
          status: { [Op.ne]: 'DONE' },
          due_date: {
            [Op.gte]: new Date(),
            [Op.lt]: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        include: statsInclude,
      }),
    ]);

    // Filter out rows from completed projects
    const filteredRows = rows.filter(task => !task.project || !task.project.is_completed);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(filteredRows, page, limit, count),
      stats: {
        active,
        completed,
        dueToday,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyProjectsTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    // Get all projects where user is a member
    const projectMemberships = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ['project_id'],
    });

    const projectIds = projectMemberships.map(pm => pm.project_id);

    if (projectIds.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    const { count, rows } = await Task.findAndCountAll({
      where: {
        project_id: projectIds,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'workspace_id', 'is_completed'],
          required: true,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
          through: { attributes: [] },
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Filter out tasks from completed projects
    const filteredRows = rows.filter(task => !task.project.is_completed);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(filteredRows, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

// Standalone task controllers
const createStandaloneTask = async (req, res, next) => {
  try {
    console.log('createStandaloneTask - req.body:', req.body);
    console.log('createStandaloneTask - req.validatedBody:', req.validatedBody);

    const { title, description, status, priority, due_date } = req.validatedBody;
    const userId = req.user.id;

    console.log('Creating task with:', { title, description, status, priority, due_date, userId });

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      due_date: due_date || null,
      project_id: null,
      created_by: userId,
    });

    console.log('Task created:', task.id);

    await publishTask('activity-log', {
      level: 'info',
      message: `Standalone task created: ${task.title} by ${req.user.email}`,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
      ],
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Standalone task created successfully',
      data: createdTask,
    });
  } catch (error) {
    console.error('Error in createStandaloneTask:', error);
    next(error);
  }
};

const getStandaloneTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.validatedQuery);
    const { status, priority, search, sortBy, sortOrder } = req.validatedQuery;

    const whereClause = {
      project_id: null,
      created_by: userId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_id', 'name', 'email', 'profile_image'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...buildPaginatedResponse(rows, page, limit, count),
    });
  } catch (error) {
    next(error);
  }
};

const updateStandaloneTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.validatedBody;
    const userId = req.user.id;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Verify it's a standalone task
    if (task.project_id !== null) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'This is not a standalone task',
      });
    }

    // Verify user is the creator
    if (task.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }

    Object.assign(task, updates);
    await task.save();

    await publishTask('activity-log', {
      level: 'info',
      message: `Standalone task updated: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Standalone task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const deleteStandaloneTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TASK_NOT_FOUND,
      });
    }

    // Verify it's a standalone task
    if (task.project_id !== null) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'This is not a standalone task',
      });
    }

    // Verify user is the creator
    if (task.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
    }

    await task.destroy();

    await publishTask('activity-log', {
      level: 'info',
      message: `Standalone task deleted: ${task.title} by ${req.user.email}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Standalone task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignUsers,
  unassignUsers,
  getUserTasks,
  getMyProjectsTasks,
  createStandaloneTask,
  getStandaloneTasks,
  updateStandaloneTask,
  deleteStandaloneTask,
};