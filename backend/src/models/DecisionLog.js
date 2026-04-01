'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DecisionLog = sequelize.define('DecisionLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.INTEGER, allowNull: true },
    decision_text: { type: DataTypes.TEXT, allowNull: false },
    decided_by: { type: DataTypes.STRING(100), allowNull: false },
    decided_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'decision_logs',
    timestamps: true,
});

module.exports = DecisionLog;
