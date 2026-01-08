const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/auth');
const { isWorkspaceMember, isWorkspaceOwner, isWorkspaceAdmin } = require('../middleware/permissions');
const { validate, validateParams } = require('../middleware/validation');
const { workspaceSchemas, uuidParam } = require('../utils/validators');

router.post('/', authenticate, validate(workspaceSchemas.create), workspaceController.createWorkspace);

router.get('/', authenticate, workspaceController.getWorkspaces);

router.get('/:id', authenticate, validateParams(uuidParam), isWorkspaceMember, workspaceController.getWorkspaceById);

router.put('/:id', authenticate, validateParams(uuidParam), isWorkspaceOwner, validate(workspaceSchemas.update), workspaceController.updateWorkspace);

router.delete('/:id', authenticate, validateParams(uuidParam), isWorkspaceOwner, workspaceController.deleteWorkspace);

router.get('/:id/members', authenticate, validateParams(uuidParam), isWorkspaceMember, workspaceController.getWorkspaceMembers);

router.post('/:id/members', authenticate, validateParams(uuidParam), isWorkspaceAdmin, validate(workspaceSchemas.addMember), workspaceController.addWorkspaceMember);

// NEW ROUTE: Add member by user code
router.post('/:id/members/code', authenticate, validateParams(uuidParam), isWorkspaceAdmin, validate(workspaceSchemas.addMemberByCode), workspaceController.addWorkspaceMemberByCode);

router.put('/:id/members/:userId', authenticate, validateParams(uuidParam), isWorkspaceAdmin, validate(workspaceSchemas.updateMemberRole), workspaceController.updateMemberRole);

router.delete('/:id/members/:userId', authenticate, validateParams(uuidParam), isWorkspaceAdmin, workspaceController.removeMember);

module.exports = router;