'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Hash passwords
            const adminPassword = await bcrypt.hash('Admin@123', 10);
            const userPassword = await bcrypt.hash('User@123', 10);

            const now = new Date();

            // 1. Create Users
            const users = [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: 'ADMIN',
                    name: 'Admin User',
                    email: 'admin@taskmanager.com',
                    password: adminPassword,
                    is_active: true,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: 'MANGR',
                    name: 'Manager User',
                    email: 'manager@taskmanager.com',
                    password: userPassword,
                    is_active: true,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: 'MEMBER1',
                    name: 'John Doe',
                    email: 'john@taskmanager.com',
                    password: userPassword,
                    is_active: true,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: 'MEMBER2',
                    name: 'Jane Smith',
                    email: 'jane@taskmanager.com',
                    password: userPassword,
                    is_active: true,
                    created_at: now,
                    updated_at: now
                }
            ];

            await queryInterface.bulkInsert('users', users, {});
            console.log('✅ Users created');

            // Get user IDs
            const dbUsers = await queryInterface.sequelize.query(
                `SELECT * FROM users WHERE email IN ('admin@taskmanager.com', 'manager@taskmanager.com', 'john@taskmanager.com', 'jane@taskmanager.com')`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            const adminUser = dbUsers.find(u => u.email === 'admin@taskmanager.com');
            const managerUser = dbUsers.find(u => u.email === 'manager@taskmanager.com');
            const johnUser = dbUsers.find(u => u.email === 'john@taskmanager.com');
            const janeUser = dbUsers.find(u => u.email === 'jane@taskmanager.com');

            // 2. Create Workspace
            const workspaceId = Sequelize.fn('gen_random_uuid');
            await queryInterface.bulkInsert('workspaces', [{
                id: workspaceId,
                name: 'Main Workspace',
                created_by: adminUser.id,
                created_at: now,
                updated_at: now
            }], {});
            console.log('✅ Workspace created');

            // 3. Add Workspace Members
            await queryInterface.bulkInsert('workspace_members', [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: adminUser.id,
                    workspace_id: workspaceId,
                    role: 'OWNER',
                    joined_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: managerUser.id,
                    workspace_id: workspaceId,
                    role: 'ADMIN',
                    joined_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: johnUser.id,
                    workspace_id: workspaceId,
                    role: 'MEMBER',
                    joined_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: janeUser.id,
                    workspace_id: workspaceId,
                    role: 'MEMBER',
                    joined_at: now
                }
            ], {});
            console.log('✅ Workspace members created');

            // 4. Create Projects
            const project1Id = Sequelize.fn('gen_random_uuid');
            const project2Id = Sequelize.fn('gen_random_uuid');

            await queryInterface.bulkInsert('projects', [
                {
                    id: project1Id,
                    name: 'Website Redesign',
                    description: 'Redesign company website with modern UI/UX',
                    workspace_id: workspaceId,
                    created_by: adminUser.id,
                    is_completed: false,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: project2Id,
                    name: 'Mobile App Development',
                    description: 'Develop new mobile app for task management',
                    workspace_id: workspaceId,
                    created_by: managerUser.id,
                    is_completed: false,
                    created_at: now,
                    updated_at: now
                }
            ], {});
            console.log('✅ Projects created');

            // 5. Add Project Members
            await queryInterface.bulkInsert('project_members', [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    project_id: project1Id,
                    user_id: adminUser.id,
                    added_by: adminUser.id,
                    added_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    project_id: project1Id,
                    user_id: johnUser.id,
                    added_by: adminUser.id,
                    added_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    project_id: project2Id,
                    user_id: managerUser.id,
                    added_by: managerUser.id,
                    added_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    project_id: project2Id,
                    user_id: janeUser.id,
                    added_by: managerUser.id,
                    added_at: now
                }
            ], {});
            console.log('✅ Project members created');

            // 6. Create Tasks
            const task1Id = Sequelize.fn('gen_random_uuid');
            const task2Id = Sequelize.fn('gen_random_uuid');
            const task3Id = Sequelize.fn('gen_random_uuid');

            await queryInterface.bulkInsert('tasks', [
                {
                    id: task1Id,
                    title: 'Design Homepage',
                    description: 'Create wireframes and mockups for homepage',
                    status: 'TODO',
                    priority: 'HIGH',
                    due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                    project_id: project1Id,
                    created_by: adminUser.id,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: task2Id,
                    title: 'Setup Database',
                    description: 'Design and setup PostgreSQL database schema',
                    status: 'IN_PROGRESS',
                    priority: 'URGENT',
                    due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                    project_id: project2Id,
                    created_by: managerUser.id,
                    created_at: now,
                    updated_at: now
                },
                {
                    id: task3Id,
                    title: 'API Development',
                    description: 'Develop REST APIs for task management',
                    status: 'TODO',
                    priority: 'MEDIUM',
                    due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                    project_id: project2Id,
                    created_by: managerUser.id,
                    created_at: now,
                    updated_at: now
                }
            ], {});
            console.log('✅ Tasks created');

            // 7. Create Task Assignments
            await queryInterface.bulkInsert('task_assignments', [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    task_id: task1Id,
                    user_id: johnUser.id,
                    assigned_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    task_id: task2Id,
                    user_id: janeUser.id,
                    assigned_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    task_id: task3Id,
                    user_id: managerUser.id,
                    assigned_at: now
                }
            ], {});
            console.log('✅ Task assignments created');

            // 8. Create Task Comments
            await queryInterface.bulkInsert('task_comments', [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    task_id: task2Id,
                    user_id: janeUser.id,
                    content: 'Started working on database design',
                    created_at: now,
                    updated_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    task_id: task2Id,
                    user_id: managerUser.id,
                    content: 'Great! Let me know if you need any help with the schema',
                    created_at: now,
                    updated_at: now
                }
            ], {});
            console.log('✅ Task comments created');

            // 9. Create Notifications
            await queryInterface.bulkInsert('notifications', [
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: johnUser.id,
                    task_id: task1Id,
                    type: 'TASK_ASSIGNMENT',
                    message: 'You have been assigned to task: Design Homepage',
                    is_read: false,
                    created_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: janeUser.id,
                    task_id: task2Id,
                    type: 'TASK_ASSIGNMENT',
                    message: 'You have been assigned to task: Setup Database',
                    is_read: false,
                    created_at: now
                },
                {
                    id: Sequelize.fn('gen_random_uuid'),
                    user_id: managerUser.id,
                    project_id: project2Id,
                    type: 'PROJECT_INVITE',
                    message: 'New project created: Mobile App Development',
                    is_read: false,
                    created_at: now
                }
            ], {});
            console.log('✅ Notifications created');

            console.log('\n🎉 Database seeded successfully!');
            console.log('\n📋 Login Credentials:');
            console.log('Admin: admin@taskmanager.com / Admin@123');
            console.log('Manager: manager@taskmanager.com / User@123');
            console.log('Member 1: john@taskmanager.com / User@123');
            console.log('Member 2: jane@taskmanager.com / User@123');

        } catch (error) {
            console.error('Seeding error:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('notifications', null, {});
        await queryInterface.bulkDelete('task_comments', null, {});
        await queryInterface.bulkDelete('task_assignments', null, {});
        await queryInterface.bulkDelete('tasks', null, {});
        await queryInterface.bulkDelete('project_members', null, {});
        await queryInterface.bulkDelete('projects', null, {});
        await queryInterface.bulkDelete('workspace_members', null, {});
        await queryInterface.bulkDelete('workspaces', null, {});
        await queryInterface.bulkDelete('user', null, {});
    }
};