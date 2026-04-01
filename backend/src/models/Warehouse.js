'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    level: {
        type: DataTypes.ENUM('provinsi', 'kabupaten', 'kecamatan'),
        allowNull: false,
        defaultValue: 'kabupaten',
    },
    location_name: { type: DataTypes.STRING(200), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    capacity_pct: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    status: {
        type: DataTypes.ENUM('aktif', 'tidak_aktif'),
        defaultValue: 'aktif',
    },
}, {
    tableName: 'warehouses',
    timestamps: true,
});

module.exports = Warehouse;
