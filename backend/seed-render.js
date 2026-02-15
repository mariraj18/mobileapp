const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const DATABASE_URL = 'postgresql://college_attendance_user:eI1lL7wLFLZEoC9pIx4sHrkytObsYcVW@dpg-d68290usb7us73c32n7g-a.oregon-postgres.render.com/task_management';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { 
    ssl: { 
      require: true, 
      rejectUnauthorized: false 
    } 
  },
  logging: false
});

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('User@123', 10);
    const now = new Date();

    // 1. Create Users
    console.log('Creating users...');
    await sequelize.query(`
      INSERT INTO users (id, user_id, name, email, password, is_active, created_at, updated_at) VALUES 
      (gen_random_uuid(), 'ADMIN', 'Admin User', 'admin@taskmanager.com', :adminPassword, true, :now, :now),
      (gen_random_uuid(), 'MANGR', 'Manager User', 'manager@taskmanager.com', :userPassword, true, :now, :now),
      (gen_random_uuid(), 'MEMBER1', 'John Doe', 'john@taskmanager.com', :userPassword, true, :now, :now),
      (gen_random_uuid(), 'MEMBER2', 'Jane Smith', 'jane@taskmanager.com', :userPassword, true, :now, :now)
    `, {
      replacements: { adminPassword, userPassword, now }
    });

    console.log('✅ Users created');

    // Get user IDs
    const users = await sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('admin@taskmanager.com', 'manager@taskmanager.com', 'john@taskmanager.com', 'jane@taskmanager.com')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminId = users.find(u => u.email === 'admin@taskmanager.com').id;
    const managerId = users.find(u => u.email === 'manager@taskmanager.com').id;
    const johnId = users.find(u => u.email === 'john@taskmanager.com').id;
    const janeId = users.find(u => u.email === 'jane@taskmanager.com').id;

    // 2. Create Workspace
    console.log('Creating workspace...');
    const [workspace] = await sequelize.query(`
      INSERT INTO workspaces (id, name, created_by, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Main Workspace', :adminId, :now, :now)
      RETURNING id;
    `, {
      replacements: { adminId, now },
      type: Sequelize.QueryTypes.INSERT
    });

    // Get the workspace ID
    const workspaceResult = await sequelize.query(
      `SELECT id FROM workspaces WHERE name = 'Main Workspace' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const workspaceId = workspaceResult[0].id;

    console.log('✅ Workspace created');

    // 3. Add Workspace Members
    console.log('Adding workspace members...');
    await sequelize.query(`
      INSERT INTO workspace_members (id, user_id, workspace_id, role, joined_at)
      VALUES 
        (gen_random_uuid(), :adminId, :workspaceId, 'OWNER', :now),
        (gen_random_uuid(), :managerId, :workspaceId, 'ADMIN', :now),
        (gen_random_uuid(), :johnId, :workspaceId, 'MEMBER', :now),
        (gen_random_uuid(), :janeId, :workspaceId, 'MEMBER', :now);
    `, {
      replacements: { adminId, managerId, johnId, janeId, workspaceId, now }
    });
    console.log('✅ Workspace members added');

    // 4. Create Projects
    console.log('Creating projects...');
    await sequelize.query(`
      INSERT INTO projects (id, name, description, workspace_id, created_by, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'Website Redesign', 'Redesign company website with modern UI/UX', :workspaceId, :adminId, :now, :now),
        (gen_random_uuid(), 'Mobile App Development', 'Develop new mobile app for task management', :workspaceId, :managerId, :now, :now);
    `, {
      replacements: { workspaceId, adminId, managerId, now }
    });
    console.log('✅ Projects created');

    // Get project IDs
    const projects = await sequelize.query(
      `SELECT id, name FROM projects WHERE workspace_id = :workspaceId`,
      { 
        replacements: { workspaceId },
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    const project1Id = projects.find(p => p.name === 'Website Redesign').id;
    const project2Id = projects.find(p => p.name === 'Mobile App Development').id;

    // 5. Add Project Members
    console.log('Adding project members...');
    await sequelize.query(`
      INSERT INTO project_members (id, project_id, user_id, added_by, added_at)
      VALUES 
        (gen_random_uuid(), :project1Id, :adminId, :adminId, :now),
        (gen_random_uuid(), :project1Id, :johnId, :adminId, :now),
        (gen_random_uuid(), :project2Id, :managerId, :managerId, :now),
        (gen_random_uuid(), :project2Id, :janeId, :managerId, :now);
    `, {
      replacements: { project1Id, project2Id, adminId, managerId, johnId, janeId, now }
    });
    console.log('✅ Project members added');

    // 6. Create Tasks
    console.log('Creating tasks...');
    await sequelize.query(`
      INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, created_by, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'Design Homepage', 'Create wireframes and mockups for homepage', 'TODO', 'HIGH', :dueDate1, :project1Id, :adminId, :now, :now),
        (gen_random_uuid(), 'Setup Database', 'Design and setup PostgreSQL database schema', 'IN_PROGRESS', 'URGENT', :dueDate2, :project2Id, :managerId, :now, :now),
        (gen_random_uuid(), 'API Development', 'Develop REST APIs for task management', 'TODO', 'MEDIUM', :dueDate3, :project2Id, :managerId, :now, :now);
    `, {
      replacements: { 
        project1Id, project2Id, adminId, managerId, now,
        dueDate1: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        dueDate2: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        dueDate3: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('✅ Tasks created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@taskmanager.com / Admin@123');
    console.log('Manager: manager@taskmanager.com / User@123');
    console.log('Member 1: john@taskmanager.com / User@123');
    console.log('Member 2: jane@taskmanager.com / User@123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();