const { Task, User } = require('./backend/src/models');
const { Op } = require('sequelize');

async function test() {
    try {
        const user = await User.findOne();
        if (!user) return console.log('No user');

        const userId = user.id;
        console.log(`User: ${userId}`);

        const { count, rows } = await Task.findAndCountAll({
            where: {
                [Op.or]: [
                    { '$assignedUsers.id$': userId },
                    { [Op.and]: [{ project_id: null }, { created_by: userId }] }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'assignedUsers',
                    where: { id: userId },
                    required: false,
                    through: { attributes: [] }
                }
            ],
            subQuery: false
        });

        console.log(`Count: ${count}`);
        rows.forEach(r => console.log(`Task: ${r.title} (Project: ${r.project_id}, Status: ${r.status})`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
