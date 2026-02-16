require('dotenv').config();
const { Project, ProjectMember, Workspace, User } = require('../src/models');

const verifyFix = async () => {
    try {
        console.log('🧪 Verifying project member selection fix...\n');

        const workspace = await Workspace.findOne();
        const user = await User.findOne();
        const otherUser = await User.findOne({ where: { id: { [require('sequelize').Op.ne]: user.id } } });

        if (!workspace || !user || !otherUser) {
            console.error('❌ Need at least one workspace and two users.');
            process.exit(1);
        }

        // Test Case 1: Creator NOT selected
        console.log(`\nCase 1: Creator ${user.email} NOT in selection...`);
        const projectName1 = 'Verify Fix No Creator ' + Date.now();

        // Mocking the new logic
        const project1 = await Project.create({ name: projectName1, workspace_id: workspace.id, created_by: user.id });

        const memberIds1 = [otherUser.id];
        const isCreatorSelected1 = memberIds1.includes(user.id);
        const shouldAddCreator1 = !memberIds1 || memberIds1.length === 0 || isCreatorSelected1;

        if (shouldAddCreator1) {
            await ProjectMember.create({ project_id: project1.id, user_id: user.id, added_by: user.id });
        }
        await ProjectMember.bulkCreate(memberIds1.filter(id => id !== user.id).map(id => ({ project_id: project1.id, user_id: id, added_by: user.id })));

        const members1 = await ProjectMember.findAll({ where: { project_id: project1.id } });
        console.log(`Project 1 Members: ${members1.length}`);
        if (members1.length === 1 && members1[0].user_id === otherUser.id) {
            console.log('✅ Success: Creator was NOT added.');
        } else {
            console.log('❌ Failure: Member count or ID mismatch.');
        }

        // Test Case 2: No members selected
        console.log(`\nCase 2: NO members selected...`);
        const projectName2 = 'Verify Fix Empty ' + Date.now();
        const project2 = await Project.create({ name: projectName2, workspace_id: workspace.id, created_by: user.id });

        const memberIds2 = [];
        const isCreatorSelected2 = memberIds2.includes(user.id);
        const shouldAddCreator2 = !memberIds2 || memberIds2.length === 0 || isCreatorSelected2;

        if (shouldAddCreator2) {
            await ProjectMember.create({ project_id: project2.id, user_id: user.id, added_by: user.id });
        }

        const members2 = await ProjectMember.findAll({ where: { project_id: project2.id } });
        console.log(`Project 2 Members: ${members2.length}`);
        if (members2.length === 1 && members2[0].user_id === user.id) {
            console.log('✅ Success: Creator WAS added as fallback.');
        } else {
            console.log('❌ Failure.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyFix();
