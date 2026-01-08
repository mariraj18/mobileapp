const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { taskSchemas, projectIdParam, uuidParam } = require('../utils/validators');

router.get('/my-tasks', authenticate, validateQuery(taskSchemas.query), taskController.getUserTasks);

router.get('/my-projects', authenticate, validateQuery(taskSchemas.query), taskController.getMyProjectsTasks);

router.post('/project/:projectId', authenticate, validateParams(projectIdParam), validate(taskSchemas.create), taskController.createTask);

router.get('/project/:projectId', authenticate, validateParams(projectIdParam), validateQuery(taskSchemas.query), taskController.getTasks);

router.get('/:id', authenticate, validateParams(uuidParam), taskController.getTaskById);

router.put('/:id', authenticate, validateParams(uuidParam), validate(taskSchemas.update), taskController.updateTask);

router.delete('/:id', authenticate, validateParams(uuidParam), taskController.deleteTask);

router.post('/:id/assign', authenticate, validateParams(uuidParam), validate(taskSchemas.assignUsers), taskController.assignUsers);

router.post('/:id/unassign', authenticate, validateParams(uuidParam), validate(taskSchemas.unassignUsers), taskController.unassignUsers);

module.exports = router;