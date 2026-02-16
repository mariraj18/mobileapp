require('dotenv').config();
const axios = require('axios');
const { User, Task } = require('./src/models');
const jwt = require('jsonwebtoken');

async function simulate() {
    try {
        // 1. Get Balu
        const balu = await User.findOne({ where: { email: 'balu@gmail.com' } });
        if (!balu) throw new Error('Balu not found');

        // 2. Generate token for Balu
        const token = jwt.sign({ id: balu.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

        // 3. Find a task
        const task = await Task.findOne({ where: { project_id: { [require('sequelize').Op.ne]: null } } });
        if (!task) throw new Error('No project task found');

        console.log(`Balu is commenting on Task: ${task.id}`);

        // 4. Call API
        const response = await axios.post(`http://localhost:5000/api/v1/tasks/${task.id}/comments`, {
            content: "Automated test comment to check logs"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API Response:', response.data);
        process.exit(0);
    } catch (err) {
        console.error('API Call Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

simulate();
