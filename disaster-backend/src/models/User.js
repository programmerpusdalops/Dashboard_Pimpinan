'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: {
        type: DataTypes.ENUM('superadmin', 'admin', 'operator', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
    },
    opd: { type: DataTypes.STRING(100), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE, allowNull: true },
    refresh_token: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
}, {
    tableName: 'users',
    timestamps: true,
});

module.exports = User;

