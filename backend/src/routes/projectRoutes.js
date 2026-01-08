const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { isWorkspaceAdmin, isWorkspaceMember } = require('../middleware/permissions');
const { validate, validateParams } = require('../middleware/validation');
const { projectSchemas, workspaceIdParam, uuidParam } = require('../utils/validators');

router.post('/workspace/:workspaceId', authenticate, validateParams(workspaceIdParam), isWorkspaceAdmin, validate(projectSchemas.create), projectController.createProject);

router.get('/workspace/:workspaceId', authenticate, validateParams(workspaceIdParam), isWorkspaceMember, projectController.getProjects);

router.get('/:id', authenticate, validateParams(uuidParam), projectController.getProjectById);

router.put('/:id', authenticate, validateParams(uuidParam), validate(projectSchemas.update), projectController.updateProject);

router.put('/:id/complete', authenticate, validateParams(uuidParam), projectController.completeProject);

router.put('/:id/reopen', authenticate, validateParams(uuidParam), projectController.reopenProject);

router.delete('/:id', authenticate, validateParams(uuidParam), projectController.deleteProject);

router.post('/:id/members', authenticate, validateParams(uuidParam), validate(projectSchemas.addMember), projectController.addProjectMember);

router.delete('/:id/members/:userId', authenticate, validateParams(uuidParam), projectController.removeProjectMember);

router.get('/:id/members', authenticate, validateParams(uuidParam), projectController.getProjectMembers);

module.exports = router;