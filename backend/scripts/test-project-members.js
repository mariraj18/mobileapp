require('dotenv').config();
const { Project, ProjectMember, Workspace, User } = require('../src/models');

const testMemberSelection = async () => {
    try {
        console.log('🧪 Testing project member selection...\n');

        // 1. Get a workspace and user
        const workspace = await Workspace.findOne();
        const user = await User.findOne();
        const otherUser = await User.findOne({ where: { id: { [require('sequelize').Op.ne]: user.id } } });

        if (!workspace || !user || !otherUser) {
            console.error('❌ Need at least one workspace and two users for this test.');
            process.exit(1);
        }

        console.log(`Using Workspace: ${workspace.name} (${workspace.id})`);
        console.log(`Using Creator: ${user.email} (${user.id})`);
        console.log(`Selecting Member: ${otherUser.email} (${otherUser.id})`);

        // 2. Mock what the controller does
        const projectName = 'Test Selection Project ' + Date.now();
        console.log(`\nCreating project: ${projectName}...`);

        const project = await Project.create({
            name: projectName,
            workspace_id: workspace.id,
            created_by: user.id
        });

        // Add creator
        await ProjectMember.create({
            project_id: project.id,
            user_id: user.id,
            added_by: user.id
        });

        // Add selected members (only otherUser)
        const selectedMemberIds = [otherUser.id];
        const otherMemberIds = selectedMemberIds.filter(id => id !== user.id);

        const projectMembers = otherMemberIds.map(memberId => ({
            project_id: project.id,
            user_id: memberId,
            added_by: user.id
        }));

        await ProjectMember.bulkCreate(projectMembers);

        // 3. Verify
        const membersInDb = await ProjectMember.findAll({ where: { project_id: project.id } });
        console.log(`\nFound ${membersInDb.length} members in DB for this project.`);
        membersInDb.forEach(m => console.log(` - User ID: ${m.user_id}`));

        if (membersInDb.length === 2) {
            console.log('\n✅ Success: Only creator and selected member were added.');
        } else {
            console.log('\n❌ Failure: Unexpected number of members.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testMemberSelection();
