const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { taskSchemas, projectIdParam, uuidParam } = require('../utils/validators');

// Standalone task routes - MUST come before parameterized routes
router.post('/standalone', authenticate, validate(taskSchemas.createStandalone), taskController.createStandaloneTask);
router.get('/standalone', authenticate, validateQuery(taskSchemas.query), taskController.getStandaloneTasks);
router.put('/standalone/:id', authenticate, validateParams(uuidParam), validate(taskSchemas.update), taskController.updateStandaloneTask);
router.delete('/standalone/:id', authenticate, validateParams(uuidParam), taskController.deleteStandaloneTask);

// User's tasks
router.get('/my-tasks', authenticate, validateQuery(taskSchemas.query), taskController.getUserTasks);
router.get('/my-projects', authenticate, validateQuery(taskSchemas.query), taskController.getMyProjectsTasks);

// Project tasks
router.post('/project/:projectId', authenticate, validateParams(projectIdParam), validate(taskSchemas.create), taskController.createTask);
router.get('/project/:projectId', authenticate, validateParams(projectIdParam), validateQuery(taskSchemas.query), taskController.getTasks);

// Task by ID - these come after specific routes
router.get('/:id', authenticate, validateParams(uuidParam), taskController.getTaskById);
router.put('/:id', authenticate, validateParams(uuidParam), validate(taskSchemas.update), taskController.updateTask);
router.delete('/:id', authenticate, validateParams(uuidParam), taskController.deleteTask);

// Task assignments
router.post('/:id/assign', authenticate, validateParams(uuidParam), validate(taskSchemas.assignUsers), taskController.assignUsers);
router.post('/:id/unassign', authenticate, validateParams(uuidParam), validate(taskSchemas.unassignUsers), taskController.unassignUsers);

module.exports = router;