const cron = require('node-cron');
const { Task, Notification, User, Project, TaskAssignment } = require('../models');
const { NOTIFICATION_TYPES } = require('../../config/constants');
const { isOverdue, isDueSoon } = require('./helpers');
const logger = require('./logger');
const { Op } = require('sequelize');

const checkDueDateNotifications = async () => {
  try {
    logger.info('Running due date notification check');

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.findAll({
      where: {
        due_date: {
          [Op.not]: null,
          [Op.lte]: oneDayFromNow,
        },
        status: {
          [Op.not]: 'DONE',
        },
      },
      include: [
        {
          model: User,
          as: 'assignedUsers',
          through: { attributes: [] },
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'is_completed'], // Added is_completed
        },
      ],
    });

    let notificationCount = 0;

    for (const task of tasks) {
      // Skip if project is completed
      if (task.project && task.project.is_completed) {
        continue;
      }

      const overdue = isOverdue(task.due_date);
      const dueSoon = isDueSoon(task.due_date, 24);

      if (overdue || dueSoon) {
        const message = overdue
          ? `Task "${task.title}" is overdue!`
          : `Task "${task.title}" is due within 24 hours`;

        for (const user of task.assignedUsers) {
          const existingNotification = await Notification.findOne({
            where: {
              user_id: user.id,
              task_id: task.id,
              type: NOTIFICATION_TYPES.DUE_DATE,
              is_read: false,
              created_at: {
                [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              },
            },
          });

          if (!existingNotification) {
            await Notification.create({
              user_id: user.id,
              task_id: task.id,
              type: NOTIFICATION_TYPES.DUE_DATE,
              message,
              is_read: false,
              data: {
                taskId: task.id,
                taskTitle: task.title,
                projectId: task.project_id,
                projectName: task.project?.name || 'Unknown Project',
              },
            });
            notificationCount++;
          }
        }
      }
    }

    logger.info(`Created ${notificationCount} due date notifications`);
  } catch (error) {
    logger.error('Error checking due date notifications:', error);
  }
};

const checkPriorityNotifications = async () => {
  try {
    logger.info('Running priority notification check');

    const urgentTasks = await Task.findAll({
      where: {
        priority: 'URGENT',
        status: {
          [Op.not]: 'DONE',
        },
      },
      include: [
        {
          model: User,
          as: 'assignedUsers',
          through: { attributes: [] },
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'is_completed'],
        },
      ],
    });

    let notificationCount = 0;

    for (const task of urgentTasks) {
      // Skip if project is completed
      if (task.project && task.project.is_completed) {
        continue;
      }

      for (const user of task.assignedUsers) {
        const existingNotification = await Notification.findOne({
          where: {
            user_id: user.id,
            task_id: task.id,
            type: NOTIFICATION_TYPES.PRIORITY,
            is_read: false,
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existingNotification) {
          await Notification.create({
            user_id: user.id,
            task_id: task.id,
            type: NOTIFICATION_TYPES.PRIORITY,
            message: `Urgent task: "${task.title}" requires attention`,
            is_read: false,
            data: {
              taskId: task.id,
              taskTitle: task.title,
              projectId: task.project_id,
              projectName: task.project?.name || 'Unknown Project',
            },
          });
          notificationCount++;
        }
      }
    }

    logger.info(`Created ${notificationCount} priority notifications`);
  } catch (error) {
    logger.error('Error checking priority notifications:', error);
  }
};

const cleanupOldNotifications = async () => {
  try {
    logger.info('Running notification cleanup');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Notification.destroy({
      where: {
        is_read: true,
        created_at: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${result} old read notifications`);
  } catch (error) {
    logger.error('Error cleaning up notifications:', error);
  }
};

const checkTaskAssignmentNotifications = async () => {
  try {
    logger.info('Running task assignment notification check');

    // Get tasks assigned in the last hour without notifications
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentAssignments = await TaskAssignment.findAll({
      where: {
        assigned_at: {
          [Op.gte]: oneHourAgo,
        },
      },
      include: [
        {
          model: Task,
          as: 'task',
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'name', 'is_completed'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
        },
      ],
    });

    let notificationCount = 0;

    for (const assignment of recentAssignments) {
      if (assignment.task.project.is_completed) {
        continue;
      }

      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        where: {
          user_id: assignment.user_id,
          task_id: assignment.task_id,
          type: NOTIFICATION_TYPES.TASK_ASSIGNMENT,
        },
      });

      if (!existingNotification) {
        await Notification.create({
          user_id: assignment.user_id,
          task_id: assignment.task_id,
          type: NOTIFICATION_TYPES.TASK_ASSIGNMENT,
          message: `You've been assigned to task: "${assignment.task.title}"`,
          is_read: false,
          data: {
            taskId: assignment.task_id,
            taskTitle: assignment.task.title,
            projectId: assignment.task.project_id,
            projectName: assignment.task.project.name,
            assignedAt: assignment.assigned_at,
          },
        });
        notificationCount++;
      }
    }

    logger.info(`Created ${notificationCount} task assignment notifications`);
  } catch (error) {
    logger.error('Error checking task assignment notifications:', error);
  }
};

const startNotificationJobs = () => {
  // Check for due dates and priority tasks every 30 minutes
  const notificationInterval = process.env.NOTIFICATION_CHECK_INTERVAL || '*/30 * * * *';

  cron.schedule(notificationInterval, () => {
    checkDueDateNotifications();
    checkPriorityNotifications();
    checkTaskAssignmentNotifications();
  });

  // Cleanup old notifications at 2 AM daily
  cron.schedule('0 2 * * *', () => {
    cleanupOldNotifications();
  });

  logger.info('Cron jobs scheduled successfully');
};

module.exports = {
  startNotificationJobs,
  checkDueDateNotifications,
  checkPriorityNotifications,
  checkTaskAssignmentNotifications,
  cleanupOldNotifications,
};