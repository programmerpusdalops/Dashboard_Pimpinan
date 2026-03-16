'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyExpenditure = sequelize.define('DailyExpenditure', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    allocation_id: { type: DataTypes.INTEGER, allowNull: false },
    expenditure_date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.BIGINT, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    verified_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'daily_expenditures',
    timestamps: true,
});

module.exports = DailyExpenditure;
