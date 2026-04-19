'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NavAccessConfig = sequelize.define('NavAccessConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role: {
        type: DataTypes.ENUM('superadmin', 'admin', 'operator', 'viewer', 'pimpinan'),
        allowNull: false,
    },
    nav_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Identifier unik nav item, e.g. dashboard, map, ops',
    },
    nav_label: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Label tampilan nav item',
    },
    is_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
}, {
    tableName: 'nav_access_configs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['role', 'nav_key'], name: 'uq_nav_access_role_key' },
    ],
});

module.exports = NavAccessConfig;
