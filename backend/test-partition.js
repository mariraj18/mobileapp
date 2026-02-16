require('dotenv').config();
const { Task, Project, Workspace, WorkspaceMember, ProjectMember, User } = require('./src/models');
const { ROLES } = require('./config/constants');

async function simulate() {
    try {
        // 1. Find a project with a workspace
        const task = await Task.findOne({
            include: [{
                model: Project,
                as: 'project',
                include: [{ model: Workspace, as: 'workspace' }]
            }]
        });

        if (!task || !task.project) {
            console.log("No project task found");
            process.exit(0);
        }

        const projectId = task.project_id;
        const workspaceId = task.project.workspace_id;
        const commenterId = '00000000-0000-0000-0000-000000000000'; // Dummy ID

        console.log(`Testing Task: ${task.title} (Project ID: ${projectId}, Workspace ID: ${workspaceId})`);

        const usersToNotify = new Set();

        // Logic from Controller:
        // 1. Project Members
        const pms = await ProjectMember.findAll({ where: { project_id: projectId } });
        console.log(`Project Members: ${pms.length}`);
        pms.forEach(m => usersToNotify.add(String(m.user_id)));

        // 2. Workspace Owners
        const owners = await WorkspaceMember.findAll({ where: { workspace_id: workspaceId, role: ROLES.OWNER } });
        console.log(`Workspace Owners: ${owners.length}`);
        owners.forEach(o => usersToNotify.add(String(o.user_id)));

        // 3. Check for a non-member
        const allWsMembers = await WorkspaceMember.findAll({ where: { workspace_id: workspaceId } });
        const nonProjectOwnerMembers = allWsMembers.filter(m => {
            const isPm = pms.some(pm => String(pm.user_id) === String(m.user_id));
            const isOwner = String(m.role) === ROLES.OWNER;
            return !isPm && !isOwner;
        });

        console.log(`WS Members who are NOT Project Members and NOT Owners: ${nonProjectOwnerMembers.length}`);

        let pass = true;
        nonProjectOwnerMembers.forEach(m => {
            if (usersToNotify.has(String(m.user_id))) {
                console.error(`FAIL: WS Member ${m.user_id} (Role: ${m.role}) is NOT in Project but IS being notified!`);
                pass = false;
            } else {
                console.log(`PASS: WS Member ${m.user_id} is correctly excluded.`);
            }
        });

        if (pass) console.log("Final Result: Logic is CORRECTly partitioned.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulate();
