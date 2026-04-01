'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DisasterEvent = sequelize.define('DisasterEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    type: {
        type: DataTypes.ENUM('banjir', 'longsor', 'gempa', 'karhutla', 'angin_kencang', 'lainnya'),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('siaga', 'tanggap_darurat', 'pemulihan', 'selesai'),
        allowNull: false,
        defaultValue: 'siaga',
    },
    severity: {
        type: DataTypes.ENUM('ringan', 'sedang', 'berat', 'kritis'),
        allowNull: false,
        defaultValue: 'ringan',
    },
    location_name: { type: DataTypes.STRING(200), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    posko_leader: { type: DataTypes.STRING(200), allowNull: true },
    posko_leader_position: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'disaster_events',
    timestamps: true,
});

module.exports = DisasterEvent;
