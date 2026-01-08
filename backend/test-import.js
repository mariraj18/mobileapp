const PgBossMap = require('pg-boss');
console.log('PgBossMap keys:', Object.keys(PgBossMap));
const PgBoss = PgBossMap.default || PgBossMap;
console.log('PgBoss type:', typeof PgBoss);
try {
    const boss = new PgBoss('postgres://localhost/test');
    console.log('Successfully created PgBoss instance');
} catch (e) {
    console.error('Failed to create PgBoss instance:', e);
}
process.exit(0);
