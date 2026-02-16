require('dotenv').config();
const { Workspace, WorkspaceMember, User } = require('../src/models');
const { ROLES } = require('../config/constants');

const verifyWorkspaceDeletion = async () => {
    try {
        console.log('🧪 Verifying workspace deletion logic...\n');

        // 1. Setup Data
        const user = await User.findOne();
        if (!user) {
            console.error('❌ Need at least one user.');
            process.exit(1);
        }

        const workspace = await Workspace.create({
            name: 'Deletion Test ' + Date.now(),
            created_by: user.id
        });

        await WorkspaceMember.create({
            user_id: user.id,
            workspace_id: workspace.id,
            role: ROLES.OWNER
        });

        console.log(`Created test workspace: ${workspace.name}`);

        // 2. Test Deletion (Simulation of controller logic)
        const canDelete = async (userId, workspaceId) => {
            const ws = await Workspace.findByPk(workspaceId);
            if (!ws) return false;

            const membership = await WorkspaceMember.findOne({
                where: { workspace_id: workspaceId, user_id: userId, role: ROLES.OWNER }
            });

            return !!membership;
        };

        const result = await canDelete(user.id, workspace.id);
        if (result) {
            console.log('✅ Success: Owner can delete workspace.');
        } else {
            console.log('❌ Failure: Owner cannot delete workspace.');
        }

        // 3. Cleanup
        await WorkspaceMember.destroy({ where: { workspace_id: workspace.id } });
        await Workspace.destroy({ where: { id: workspace.id } });
        console.log('Cleanup complete.');

        process.exit(result ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyWorkspaceDeletion();
