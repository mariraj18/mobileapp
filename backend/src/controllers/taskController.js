const { Task, Project, User, TaskAssignment, TaskComment, TaskAttachment, Notification, ProjectMember } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES } = require('../../config/constants');
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

    // Check if user is project member
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId },
      transaction,
    });

    if (!isProjectMember) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a member of this project',
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

    // Check if user is project member
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!isProjectMember) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const project = await Project.findByPk(projectId);
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

    // Check if user is project member
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: userId },
    });

    if (!isProjectMember) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a member of this project',
      });
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
    if (task.project.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user is task creator or project member with edit permissions
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: userId },
    });

    if (!isProjectMember && task.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
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
    if (task.project.is_completed) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user is task creator or workspace admin
    const workspaceMembership = await WorkspaceMember.findOne({
      where: {
        user_id: userId,
        workspace_id: task.project.workspace_id,
        role: ['OWNER', 'ADMIN'],
      },
    });

    if (!workspaceMembership && task.created_by !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
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
    if (task.project.is_completed) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.PROJECT_COMPLETED,
      });
    }

    // Check if user has permission to assign users
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: currentUserId },
      transaction,
    });

    if (!isProjectMember) {
      await transaction.rollback();
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a member of this project',
      });
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
          message: `You have been assigned to task: "${task.title}" in project "${task.project.name}"`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.project.id,
            projectName: task.project.name,
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
    const isProjectMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: currentUserId },
    });

    if (!isProjectMember) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a member of this project',
      });
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
      attributes: [],
      where: { id: userId },
      required: true,
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

    // Add project filter if specified
    if (projectId) {
      taskWhereClause.project_id = projectId;
    }

    const { count, rows } = await Task.findAndCountAll({
      where: taskWhereClause,
      include: [
        assignmentInclude,
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
      ],
      limit,
      offset,
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      subQuery: false,
    });

    // Calculate stats for active projects only
    const statsWhere = { '$project.is_completed$': false };
    const statsInclude = [
      assignmentInclude,
      {
        model: Project,
        as: 'project',
        attributes: [],
        where: { is_completed: false },
        required: true,
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

    // Filter out tasks from completed projects
    const filteredRows = rows.filter(task => !task.project.is_completed);

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
};