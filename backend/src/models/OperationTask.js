'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OperationTask = sequelize.define('OperationTask', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
    },
    status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'done', 'cancelled'),
        defaultValue: 'todo',
    },
    assigned_to_opd: { type: DataTypes.STRING(100), allowNull: true },
    estimated_hours: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'operation_tasks',
    timestamps: true,
});

module.exports = OperationTask;
