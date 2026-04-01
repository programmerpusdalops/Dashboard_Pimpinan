'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const { Casualty, User } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator } = require('../../middlewares/rbac.middleware');

// GET /events/:eventId/casualties
router.get('/:eventId/casualties', authenticate, async (req, res, next) => {
    try {
        const data = await Casualty.findAll({
            where: { event_id: req.params.eventId },
            include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
            order: [['recorded_at', 'DESC']],
        });
        R.success(res, data);
    } catch (e) { next(e); }
});

// PUT /events/:eventId/casualties — upsert (update atau create baru)
router.put('/:eventId/casualties', authenticate, isOperator, async (req, res, next) => {
    try {
        const data = await Casualty.create({
            ...req.body,
            event_id: req.params.eventId,
            updated_by: req.user.id,
            recorded_at: new Date(),
        });
        R.created(res, data, 'Data korban & kerusakan berhasil diperbaharui');
    } catch (e) { next(e); }
});

module.exports = router;
