'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Refugee = sequelize.define('Refugee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shelter_id: { type: DataTypes.INTEGER, allowNull: false },
    total_jiwa: { type: DataTypes.INTEGER, defaultValue: 0 },
    balita: { type: DataTypes.INTEGER, defaultValue: 0 },
    anak: { type: DataTypes.INTEGER, defaultValue: 0 },
    dewasa: { type: DataTypes.INTEGER, defaultValue: 0 },
    lansia: { type: DataTypes.INTEGER, defaultValue: 0 },
    ibu_hamil: { type: DataTypes.INTEGER, defaultValue: 0 },
    disabilitas: { type: DataTypes.INTEGER, defaultValue: 0 },
    recorded_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'refugees',
    timestamps: true,
});

module.exports = Refugee;
