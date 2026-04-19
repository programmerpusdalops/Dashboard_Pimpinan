'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComponentVisibilityConfig = sequelize.define('ComponentVisibilityConfig', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nav_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Parent nav item identifier, e.g. dashboard, map',
    },
    component_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Identifier unik komponen, e.g. kpi_cards, mini_map',
    },
    component_label: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: 'Label tampilan komponen',
    },
    is_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
}, {
    tableName: 'component_visibility_configs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['nav_key', 'component_key'], name: 'uq_component_vis_nav_comp' },
    ],
});

module.exports = ComponentVisibilityConfig;
