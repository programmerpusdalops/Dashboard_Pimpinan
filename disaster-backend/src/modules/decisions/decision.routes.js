'use strict';
const express = require('express');
const router = express.Router();
const { DecisionLog, User, DisasterEvent } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/rbac.middleware');

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { event_id } = req.query;
        const where = {};
        if (event_id) where.event_id = event_id;
        R.success(res, await DecisionLog.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: DisasterEvent, attributes: ['id', 'title'] }
            ],
            order: [['decided_at', 'DESC']],
        }));
    } catch (e) { next(e); }
});

router.post('/', authenticate, isAdmin, async (req, res, next) => {
    try {
        R.created(res, await DecisionLog.create({ ...req.body, created_by: req.user.id }), 'Keputusan berhasil dicatat');
    } catch (e) { next(e); }
});

module.exports = router;
