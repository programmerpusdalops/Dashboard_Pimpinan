'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemStatusConfig = sequelize.define('SystemStatusConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
    },
    label: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    color: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '#f59e0b',
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    is_current: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    tableName: 'system_status_configs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['value'], name: 'uq_system_status_configs_value' },
        { fields: ['is_enabled', 'sort_order'], name: 'idx_system_status_configs_enabled_sort' },
        { fields: ['is_current'], name: 'idx_system_status_configs_current' },
    ],
});

module.exports = SystemStatusConfig;

