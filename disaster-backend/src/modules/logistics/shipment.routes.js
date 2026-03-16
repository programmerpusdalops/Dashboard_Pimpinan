'use strict';
const express = require('express');
const router = express.Router();
const { LogisticsShipment, Warehouse, Shelter, User } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator } = require('../../middlewares/rbac.middleware');

// GET /shipments
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status) where.status = status;
        const data = await LogisticsShipment.findAll({
            where,
            include: [
                { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
                { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
                { model: Shelter, as: 'toShelter', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        R.success(res, data);
    } catch (e) { next(e); }
});

// GET /shipments/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const data = await LogisticsShipment.findByPk(req.params.id);
        if (!data) return R.notFound(res, 'Pengiriman tidak ditemukan');
        R.success(res, data);
    } catch (e) { next(e); }
});

// POST /shipments
router.post('/', authenticate, isOperator, async (req, res, next) => {
    try {
        // Generate shipment code
        const code = 'TRK-' + Math.floor(1000 + Math.random() * 9000);
        const data = await LogisticsShipment.create({ ...req.body, shipment_code: code, created_by: req.user.id });
        R.created(res, data, 'Pengiriman berhasil dibuat');
    } catch (e) { next(e); }
});

// PATCH /shipments/:id/status
router.patch('/:id/status', authenticate, isOperator, async (req, res, next) => {
    try {
        const shipment = await LogisticsShipment.findByPk(req.params.id);
        if (!shipment) return R.notFound(res, 'Pengiriman tidak ditemukan');
        await shipment.update({ status: req.body.status, delay_reason: req.body.delay_reason });
        R.success(res, shipment, 'Status pengiriman diupdate');
    } catch (e) { next(e); }
});

module.exports = router;
