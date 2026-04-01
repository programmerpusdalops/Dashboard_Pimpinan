'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'logistik',
        validate: { isIn: [['logistik', 'peralatan', 'kendaraan']] },
    },
    item_name: { type: DataTypes.STRING(100), allowNull: false },
    unit: { type: DataTypes.STRING(30), allowNull: false },
    stock_quantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    daily_consumption: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    min_threshold: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, {
    tableName: 'inventory_items',
    timestamps: true,
});

module.exports = InventoryItem;
