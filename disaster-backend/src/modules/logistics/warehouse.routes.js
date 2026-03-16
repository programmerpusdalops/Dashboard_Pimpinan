'use strict';
const express = require('express');
const router = express.Router();
const { Warehouse, InventoryItem } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

// GET /warehouses
router.get('/', authenticate, async (req, res, next) => {
    try {
        const data = await Warehouse.findAll({
            include: [{ model: InventoryItem, as: 'inventory' }],
            order: [['level', 'ASC']],
        });
        R.success(res, data);
    } catch (e) { next(e); }
});

// POST /warehouses
router.post('/', authenticate, isAdmin, async (req, res, next) => {
    try { R.created(res, await Warehouse.create(req.body), 'Gudang berhasil ditambahkan'); }
    catch (e) { next(e); }
});

// PUT /warehouses/:id
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const wh = await Warehouse.findByPk(req.params.id);
        if (!wh) return R.notFound(res, 'Gudang tidak ditemukan');
        R.success(res, await wh.update(req.body), 'Gudang berhasil diupdate');
    } catch (e) { next(e); }
});

// GET /warehouses/:id/inventory
router.get('/:id/inventory', authenticate, async (req, res, next) => {
    try {
        const items = await InventoryItem.findAll({ where: { warehouse_id: req.params.id } });
        R.success(res, items);
    } catch (e) { next(e); }
});

// PUT /inventory/:itemId — update satu item stok
router.put('/inventory/:itemId', authenticate, isOperator, async (req, res, next) => {
    try {
        const item = await InventoryItem.findByPk(req.params.itemId);
        if (!item) return R.notFound(res, 'Item tidak ditemukan');
        R.success(res, await item.update(req.body), 'Stok berhasil diupdate');
    } catch (e) { next(e); }
});

module.exports = router;
