require('dotenv').config();
const { Project, ProjectMember, User, Workspace, WorkspaceMember } = require('../src/models');

const analyzeMemberships = async () => {
    try {
        const projects = await Project.findAll({
            include: [
                { model: ProjectMember, as: 'memberships' },
                { model: Workspace, as: 'workspace' }
            ]
        });

        console.log(`Analyzing ${projects.length} projects...\n`);

        for (const project of projects) {
            const workspaceMembers = await WorkspaceMember.count({ where: { workspace_id: project.workspace_id } });
            const projectMembers = project.memberships.length;

            console.log(`Project: ${project.name}`);
            console.log(` - Workspace: ${project.workspace ? project.workspace.name : 'Unknown'}`);
            console.log(` - Project Members: ${projectMembers}`);
            console.log(` - Workspace Members: ${workspaceMembers}`);

            if (projectMembers === workspaceMembers && workspaceMembers > 1) {
                console.log(` ⚠️ WARNING: This project has ALL workspace members added!`);
            }
            console.log('-------------------');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

analyzeMemberships();
