'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BudgetAllocation = sequelize.define('BudgetAllocation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.INTEGER, allowNull: true },
    source: {
        type: DataTypes.ENUM('BTT', 'BNPB', 'Kemensos', 'Donasi', 'Lainnya'),
        defaultValue: 'BTT',
    },
    total_amount: { type: DataTypes.BIGINT, defaultValue: 0 },
    sector: { type: DataTypes.STRING(100), allowNull: false },
    allocated_at: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, {
    tableName: 'budget_allocations',
    timestamps: true,
});

module.exports = BudgetAllocation;
