require('dotenv').config();
const { Project, ProjectMember, User, Workspace } = require('../src/models');

const checkRecentProject = async () => {
    try {
        const project = await Project.findOne({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: ProjectMember,
                    as: 'memberships',
                    include: [{ model: User, as: 'user' }]
                },
                {
                    model: Workspace,
                    as: 'workspace'
                },
                {
                    model: User,
                    as: 'creator'
                }
            ]
        });

        if (!project) {
            console.log('No projects found.');
            process.exit(0);
        }

        console.log(`\nMost Recent Project: ${project.name}`);
        console.log(`Created at: ${project.created_at}`);
        console.log(`Creator: ${project.creator ? project.creator.email : 'Unknown'}`);
        console.log(`Workspace: ${project.workspace ? project.workspace.name : 'Unknown'}`);

        console.log(`\nMembers (${project.memberships.length}):`);
        project.memberships.forEach(m => {
            console.log(` - ${m.user ? m.user.email : 'Unknown'} (ID: ${m.user_id})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRecentProject();
