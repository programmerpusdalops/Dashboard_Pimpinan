'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageBanner = sequelize.define('PageBanner', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    page_path: {
        type: DataTypes.STRING(120),
        allowNull: false,
        comment: 'Target route path, e.g. /admin, /ops, or * for global',
    },
    banner_type: {
        type: DataTypes.ENUM('alert', 'warning', 'info'),
        allowNull: false,
        defaultValue: 'info',
    },
    title: {
        type: DataTypes.STRING(120),
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    target_role: {
        type: DataTypes.ENUM('all', 'superadmin', 'admin', 'operator', 'viewer', 'pimpinan'),
        allowNull: false,
        defaultValue: 'all',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    is_dismissible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
}, {
    tableName: 'page_banners',
    timestamps: true,
    indexes: [
        { fields: ['page_path', 'is_active'], name: 'idx_page_banners_path_active' },
        { fields: ['target_role'], name: 'idx_page_banners_target_role' },
    ],
});

module.exports = PageBanner;

