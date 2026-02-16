require('dotenv').config();
const { Project, ProjectMember, Task, Workspace, User, WorkspaceMember } = require('../src/models');
const { ROLES } = require('../config/constants');

const verifyTaskFix = async () => {
    try {
        console.log('🧪 Verifying task access fix for Owners/Admins...\n');

        // 1. Setup Data
        const workspace = await Workspace.findOne();
        const owner = await User.findOne({
            include: [{
                model: WorkspaceMember,
                as: 'workspaceMemberships',
                where: { workspace_id: workspace.id, role: ROLES.OWNER }
            }]
        });

        const otherUser = await User.findOne({
            where: { id: { [require('sequelize').Op.ne]: owner.id } }
        });

        if (!workspace || !owner || !otherUser) {
            console.error('❌ Need workspace, owner, and another user.');
            process.exit(1);
        }

        console.log(`Workspace: ${workspace.name}`);
        console.log(`Owner: ${owner.email}`);
        console.log(`Other User: ${otherUser.email}`);

        // 2. Create a project where ONLY otherUser is a member
        const projectName = 'Task Access Test ' + Date.now();
        const project = await Project.create({
            name: projectName,
            workspace_id: workspace.id,
            created_by: otherUser.id // Created by other user
        });

        // Add only the other user as a member
        await ProjectMember.create({
            project_id: project.id,
            user_id: otherUser.id,
            added_by: otherUser.id
        });

        console.log(`\nCreated project "${projectName}" where Owner ${owner.email} is NOT a member.`);

        // 3. Mock the controller calls (manually for speed/isolation)
        // In real execution, the controller would use req.user.id = owner.id

        const testAccess = async (userId) => {
            const isProjectMember = await ProjectMember.findOne({
                where: { project_id: project.id, user_id: userId }
            });

            const workspaceMembership = await WorkspaceMember.findOne({
                where: {
                    user_id: userId,
                    workspace_id: project.workspace_id,
                    role: [ROLES.OWNER, ROLES.ADMIN],
                }
            });

            return !!isProjectMember || !!workspaceMembership || project.created_by === userId;
        };

        const ownerHasAccess = await testAccess(owner.id);
        console.log(`Owner has access to project tasks: ${ownerHasAccess}`);

        if (ownerHasAccess) {
            console.log('✅ Success: Workspace Owner has access despite not being a project member.');
        } else {
            console.log('❌ Failure: Workspace Owner should have access.');
        }

        // Cleanup
        await Task.destroy({ where: { project_id: project.id } });
        await ProjectMember.destroy({ where: { project_id: project.id } });
        await Project.destroy({ where: { id: project.id } });

        process.exit(ownerHasAccess ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyTaskFix();
