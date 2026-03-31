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

// Helper: bersihkan field koordinat — kosong/invalid → null, clamp ke range valid
function sanitizeCoords(body) {
    const data = { ...body };
    // latitude: DECIMAL(10,8) → max ±99.99999999 (valid: -90 to 90)
    // longitude: DECIMAL(11,8) → max ±999.99999999 (valid: -180 to 180)
    const cleanCoord = (val, min, max) => {
        if (val === '' || val === null || val === undefined) return null;
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        if (num < min || num > max) return null;
        return num;
    };
    data.latitude = cleanCoord(data.latitude, -90, 90);
    data.longitude = cleanCoord(data.longitude, -180, 180);
    console.log('[sanitizeCoords]', { lat: data.latitude, lng: data.longitude, rawLat: body.latitude, rawLng: body.longitude });
    return data;
}

// POST /warehouses
router.post('/', authenticate, isAdmin, async (req, res, next) => {
    try { R.created(res, await Warehouse.create(sanitizeCoords(req.body)), 'Gudang berhasil ditambahkan'); }
    catch (e) { next(e); }
});

// PUT /warehouses/:id
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const wh = await Warehouse.findByPk(req.params.id);
        if (!wh) return R.notFound(res, 'Gudang tidak ditemukan');
        R.success(res, await wh.update(sanitizeCoords(req.body)), 'Gudang berhasil diupdate');
    } catch (e) { next(e); }
});

// GET /warehouses/:id/inventory
router.get('/:id/inventory', authenticate, async (req, res, next) => {
    try {
        const items = await InventoryItem.findAll({ where: { warehouse_id: req.params.id } });
        R.success(res, items);
    } catch (e) { next(e); }
});

// POST /warehouses/:id/inventory — tambah item inventaris baru
router.post('/:id/inventory', authenticate, isOperator, async (req, res, next) => {
    try {
        const item = await InventoryItem.create({ ...req.body, warehouse_id: req.params.id });
        R.created(res, item, 'Item inventaris berhasil ditambahkan');
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

// DELETE /inventory/:itemId — hapus item inventaris
router.delete('/inventory/:itemId', authenticate, isAdmin, async (req, res, next) => {
    try {
        const item = await InventoryItem.findByPk(req.params.itemId);
        if (!item) return R.notFound(res, 'Item tidak ditemukan');
        await item.destroy();
        R.success(res, null, 'Item berhasil dihapus');
    } catch (e) { next(e); }
});

module.exports = router;
