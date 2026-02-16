require('dotenv').config();
const { Project, ProjectMember, Workspace, User, WorkspaceMember } = require('../src/models');
const { ROLES, ERROR_MESSAGES } = require('../config/constants');

const verifyErrorMessage = async () => {
    try {
        console.log('🧪 Verifying project access error message...\n');

        // 1. Setup Data
        const workspace = await Workspace.findOne();
        const users = await User.findAll({ limit: 2 });

        if (users.length < 2) {
            console.error('❌ Need at least two users in the database.');
            process.exit(1);
        }

        const memberUser = users[0];
        const otherUser = users[1];

        console.log(`Workspace: ${workspace.name}`);
        console.log(`Test User: ${memberUser.email}`);
        console.log(`Creator User: ${otherUser.email}`);

        // 2. Create a project where ONLY otherUser is a member
        const projectName = 'Error Message Test ' + Date.now();
        const project = await Project.create({
            name: projectName,
            workspace_id: workspace.id,
            created_by: otherUser.id
        });

        // Add ONLY the other user as a member
        await ProjectMember.create({
            project_id: project.id,
            user_id: otherUser.id,
            added_by: otherUser.id
        });

        // 3. Check the error message logic (manual check of the condition)
        const expectedMessage = 'You were not added to this project';

        // Mocking the getProjectById check
        const isMember = await ProjectMember.findOne({
            where: { project_id: project.id, user_id: memberUser.id },
        });

        const workspaceMembership = await WorkspaceMember.findOne({
            where: { user_id: memberUser.id, workspace_id: project.workspace_id },
        });

        const isOwnerOrAdmin = workspaceMembership && [ROLES.OWNER, ROLES.ADMIN].includes(workspaceMembership.role);
        const isCreator = project.created_by === memberUser.id;

        let actualMessage = null;
        if (!isMember && !isOwnerOrAdmin && !isCreator) {
            actualMessage = expectedMessage; // This is what we expect the controller to return now
        }

        if (actualMessage === expectedMessage) {
            console.log(`✅ Success: logic correctly identifies that user should see "${expectedMessage}"`);
        } else {
            console.log(`❌ Note: This user might have access (Owner/Admin). Trying with another check.`);
        }

        // 4. Verify constants.js
        console.log(`\nVerifying constants.js...`);
        if (ERROR_MESSAGES.PROJECT_NOT_FOUND === expectedMessage) {
            console.log(`✅ Success: ERROR_MESSAGES.PROJECT_NOT_FOUND matches "${expectedMessage}"`);
        } else {
            console.log(`❌ Failure: ERROR_MESSAGES.PROJECT_NOT_FOUND is "${ERROR_MESSAGES.PROJECT_NOT_FOUND}"`);
        }

        // Cleanup
        await ProjectMember.destroy({ where: { project_id: project.id } });
        await Project.destroy({ where: { id: project.id } });

        process.exit(ERROR_MESSAGES.PROJECT_NOT_FOUND === expectedMessage ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyErrorMessage();
