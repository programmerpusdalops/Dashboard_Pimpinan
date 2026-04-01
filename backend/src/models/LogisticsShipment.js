'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogisticsShipment = sequelize.define('LogisticsShipment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shipment_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    from_warehouse_id: { type: DataTypes.INTEGER, allowNull: true },
    to_warehouse_id: { type: DataTypes.INTEGER, allowNull: true },
    to_shelter_id: { type: DataTypes.INTEGER, allowNull: true },
    cargo_description: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('preparing', 'in_transit', 'arrived', 'delayed', 'cancelled'),
        defaultValue: 'preparing',
    },
    departure_time: { type: DataTypes.DATE, allowNull: true },
    eta: { type: DataTypes.DATE, allowNull: true },
    delay_reason: { type: DataTypes.TEXT, allowNull: true },
    driver_name: { type: DataTypes.STRING(100), allowNull: true },
    vehicle_plate: { type: DataTypes.STRING(20), allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'logistics_shipments',
    timestamps: true,
});

module.exports = LogisticsShipment;
