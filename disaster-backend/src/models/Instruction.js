'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Instruction = sequelize.define('Instruction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    from_user_id: { type: DataTypes.INTEGER, allowNull: false },
    target_module: {
        type: DataTypes.ENUM('dasbor', 'peta', 'operasi', 'logistik', 'pengungsi', 'anggaran'),
        allowNull: false,
    },
    instruction_text: { type: DataTypes.TEXT, allowNull: false },
    priority: {
        type: DataTypes.ENUM('biasa', 'penting', 'segera'),
        defaultValue: 'biasa',
    },
    status: {
        type: DataTypes.ENUM('baru', 'dibaca', 'dikerjakan', 'selesai'),
        defaultValue: 'baru',
    },
    assigned_to_role: { type: DataTypes.STRING(50), allowNull: true },
    response_text: { type: DataTypes.TEXT, allowNull: true },
    responded_by: { type: DataTypes.INTEGER, allowNull: true },
    responded_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'instructions',
    timestamps: true,
});

module.exports = Instruction;
