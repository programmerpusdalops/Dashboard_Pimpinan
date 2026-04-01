'use strict';
require('dotenv').config();
const app = require('./src/config/app');
const sequelize = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');

        // ⚠️  JANGAN gunakan sequelize.sync() di production!
        // Gunakan: npx sequelize-cli db:migrate
        // sync({ alter: true }) HANYA aktif jika env DB_SYNC_DEV=true (untuk onboarding dev baru)
        if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC_DEV === 'true') {
            await sequelize.sync({ alter: true });
            console.log('⚠️  Models force-synced (dev mode). Nonaktifkan DB_SYNC_DEV di .env setelah setup awal.');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
