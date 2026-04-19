'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationDotConfig = sequelize.define('NotificationDotConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nav_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Nav item identifier, e.g. dashboard, ops',
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Apakah notification dot aktif untuk nav ini',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
}, {
    tableName: 'notification_dot_configs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['nav_key'], name: 'uq_notif_dot_nav_key' },
    ],
});

module.exports = NotificationDotConfig;
