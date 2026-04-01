'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shelter = sequelize.define('Shelter', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    location_name: { type: DataTypes.STRING(200), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
    current_occupancy: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
        type: DataTypes.ENUM('aktif', 'penuh', 'tutup'),
        defaultValue: 'aktif',
    },
    pic_name: { type: DataTypes.STRING(100), allowNull: true },
}, {
    tableName: 'shelters',
    timestamps: true,
});

module.exports = Shelter;
