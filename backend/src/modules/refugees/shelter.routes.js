'use strict';
const express = require('express');
const router = express.Router();
const { Shelter, Refugee, DisasterEvent } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { event_id } = req.query;
        const where = {};
        if (event_id) where.event_id = event_id;
        R.success(res, await Shelter.findAll({ where, include: [{ model: Refugee, as: 'refugees' }], order: [['createdAt', 'DESC']] }));
    } catch (e) { next(e); }
});

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const s = await Shelter.findByPk(req.params.id, { include: [{ model: Refugee, as: 'refugees' }] });
        if (!s) return R.notFound(res, 'Posko tidak ditemukan');
        R.success(res, s);
    } catch (e) { next(e); }
});

router.post('/', authenticate, isOperator, async (req, res, next) => {
    try { R.created(res, await Shelter.create(req.body), 'Posko berhasil ditambahkan'); }
    catch (e) { next(e); }
});

router.put('/:id', authenticate, isOperator, async (req, res, next) => {
    try {
        const s = await Shelter.findByPk(req.params.id);
        if (!s) return R.notFound(res, 'Posko tidak ditemukan');
        R.success(res, await s.update(req.body), 'Posko berhasil diupdate');
    } catch (e) { next(e); }
});

module.exports = router;
