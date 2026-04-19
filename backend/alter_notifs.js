const sequelize = require('./src/config/database');
async function run() {
    try {
        await sequelize.query('ALTER TABLE notifications ADD COLUMN target_role VARCHAR(255) DEFAULT "all"');
        console.log("Column added");
    } catch(e) { console.log(e); }
    process.exit(0);
}
run();
