'use strict';
const express = require('express');
const router = express.Router();
const { DisasterEvent, User } = require('../../models');
const { Op } = require('sequelize');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

// GET /events — list semua kejadian, dengan pagination & filter
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status, type, severity, page = 1, limit = 10 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (severity) where.severity = severity;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await DisasterEvent.findAndCountAll({
            where,
            include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'opd'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
        });
        R.paginate(res, rows, count, page, limit);
    } catch (e) { next(e); }
});

// GET /events/geojson — untuk layer peta Leaflet
router.get('/geojson', authenticate, async (req, res, next) => {
    try {
        const events = await DisasterEvent.findAll({
            where: { status: { [Op.in]: ['siaga', 'tanggap_darurat'] } },
            attributes: ['id', 'title', 'type', 'severity', 'location_name', 'latitude', 'longitude', 'status'],
        });
        const geojson = {
            type: 'FeatureCollection',
            features: events
                .filter((e) => e.latitude && e.longitude)
                .map((e) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)] },
                    properties: { id: e.id, title: e.title, type: e.type, severity: e.severity, status: e.status, location: e.location_name },
                })),
        };
        R.success(res, geojson);
    } catch (e) { next(e); }
});

// GET /events/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const event = await DisasterEvent.findByPk(req.params.id, {
            include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
        });
        if (!event) return R.notFound(res, 'Kejadian tidak ditemukan');
        R.success(res, event);
    } catch (e) { next(e); }
});

// POST /events
router.post('/', authenticate, isOperator, async (req, res, next) => {
    try {
        const event = await DisasterEvent.create({ ...req.body, created_by: req.user.id });
        R.created(res, event, 'Kejadian bencana berhasil dibuat');
    } catch (e) { next(e); }
});

// PUT /events/:id
router.put('/:id', authenticate, isOperator, async (req, res, next) => {
    try {
        const event = await DisasterEvent.findByPk(req.params.id);
        if (!event) return R.notFound(res, 'Kejadian tidak ditemukan');
        await event.update(req.body);
        R.success(res, event, 'Kejadian berhasil diupdate');
    } catch (e) { next(e); }
});

// PATCH /events/:id/status — ubah status tanpa update field lain
router.patch('/:id/status', authenticate, isAdmin, async (req, res, next) => {
    try {
        const event = await DisasterEvent.findByPk(req.params.id);
        if (!event) return R.notFound(res, 'Kejadian tidak ditemukan');
        await event.update({ status: req.body.status });
        R.success(res, event, `Status kejadian diubah ke "${req.body.status}"`);
    } catch (e) { next(e); }
});

// DELETE /events/:id
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const event = await DisasterEvent.findByPk(req.params.id);
        if (!event) return R.notFound(res, 'Kejadian tidak ditemukan');
        await event.destroy();
        R.success(res, null, 'Kejadian berhasil dihapus');
    } catch (e) { next(e); }
});

module.exports = router;

