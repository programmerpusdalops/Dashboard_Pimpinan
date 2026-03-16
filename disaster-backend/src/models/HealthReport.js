'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthReport = sequelize.define('HealthReport', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shelter_id: { type: DataTypes.INTEGER, allowNull: false },
    disease_name: { type: DataTypes.STRING(100), allowNull: false },
    case_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    severity: {
        type: DataTypes.ENUM('ringan', 'sedang', 'kritis'),
        defaultValue: 'ringan',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    reported_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reported_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'health_reports',
    timestamps: true,
});

module.exports = HealthReport;
