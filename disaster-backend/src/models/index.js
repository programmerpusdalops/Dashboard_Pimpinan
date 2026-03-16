'use strict';
const sequelize = require('../config/database');
const User = require('./User');
const DisasterEvent = require('./DisasterEvent');
const Casualty = require('./Casualty');
const Shelter = require('./Shelter');
const Refugee = require('./Refugee');
const HealthReport = require('./HealthReport');
const Warehouse = require('./Warehouse');
const InventoryItem = require('./InventoryItem');
const LogisticsShipment = require('./LogisticsShipment');
const OperationTask = require('./OperationTask');
const DecisionLog = require('./DecisionLog');
const BudgetAllocation = require('./BudgetAllocation');
const DailyExpenditure = require('./DailyExpenditure');

// ── DisasterEvent associations ──────────────────────────────
DisasterEvent.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
DisasterEvent.hasMany(Casualty, { foreignKey: 'event_id', as: 'casualties' });
DisasterEvent.hasMany(Shelter, { foreignKey: 'event_id', as: 'shelters' });
DisasterEvent.hasMany(OperationTask, { foreignKey: 'event_id', as: 'tasks' });
DisasterEvent.hasMany(DecisionLog, { foreignKey: 'event_id', as: 'decisions' });
DisasterEvent.hasMany(BudgetAllocation, { foreignKey: 'event_id', as: 'budgets' });

// ── Casualty associations ───────────────────────────────────
Casualty.belongsTo(DisasterEvent, { foreignKey: 'event_id' });
Casualty.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ── Shelter & Refugee associations ─────────────────────────
Shelter.belongsTo(DisasterEvent, { foreignKey: 'event_id' });
Shelter.hasMany(Refugee, { foreignKey: 'shelter_id', as: 'refugees' });
Shelter.hasMany(HealthReport, { foreignKey: 'shelter_id', as: 'healthReports' });

Refugee.belongsTo(Shelter, { foreignKey: 'shelter_id' });
Refugee.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

HealthReport.belongsTo(Shelter, { foreignKey: 'shelter_id' });
HealthReport.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

// ── Logistics associations ─────────────────────────────────
Warehouse.hasMany(InventoryItem, { foreignKey: 'warehouse_id', as: 'inventory' });
InventoryItem.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });

LogisticsShipment.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
LogisticsShipment.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
LogisticsShipment.belongsTo(Shelter, { foreignKey: 'to_shelter_id', as: 'toShelter' });
LogisticsShipment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Operations associations ────────────────────────────────
OperationTask.belongsTo(DisasterEvent, { foreignKey: 'event_id' });
OperationTask.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Decision associations ──────────────────────────────────
DecisionLog.belongsTo(DisasterEvent, { foreignKey: 'event_id' });
DecisionLog.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Budget associations ────────────────────────────────────
BudgetAllocation.belongsTo(DisasterEvent, { foreignKey: 'event_id' });
BudgetAllocation.hasMany(DailyExpenditure, { foreignKey: 'allocation_id', as: 'expenditures' });
DailyExpenditure.belongsTo(BudgetAllocation, { foreignKey: 'allocation_id' });
DailyExpenditure.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

module.exports = {
    sequelize,
    User, DisasterEvent, Casualty,
    Shelter, Refugee, HealthReport,
    Warehouse, InventoryItem, LogisticsShipment,
    OperationTask, DecisionLog,
    BudgetAllocation, DailyExpenditure,
};
