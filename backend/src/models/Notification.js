const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'system' },
    target_role: { type: DataTypes.STRING, defaultValue: 'all' }
}, {
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false
});

module.exports = Notification;
