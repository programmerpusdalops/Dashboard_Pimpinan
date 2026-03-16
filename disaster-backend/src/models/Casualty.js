'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Casualty = sequelize.define('Casualty', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    meninggal: { type: DataTypes.INTEGER, defaultValue: 0 },
    luka_berat: { type: DataTypes.INTEGER, defaultValue: 0 },
    luka_ringan: { type: DataTypes.INTEGER, defaultValue: 0 },
    hilang: { type: DataTypes.INTEGER, defaultValue: 0 },
    rumah_rusak_berat: { type: DataTypes.INTEGER, defaultValue: 0 },
    rumah_rusak_sedang: { type: DataTypes.INTEGER, defaultValue: 0 },
    rumah_rusak_ringan: { type: DataTypes.INTEGER, defaultValue: 0 },
    fasilitas_publik_rusak: { type: DataTypes.INTEGER, defaultValue: 0 },
    akses_jalan_putus: { type: DataTypes.INTEGER, defaultValue: 0 },
    recorded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'casualties',
    timestamps: true,
});

module.exports = Casualty;
