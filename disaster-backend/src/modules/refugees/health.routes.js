'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const { HealthReport, User } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator } = require('../../middlewares/rbac.middleware');

// GET /shelters/:shelterId/health
router.get('/:shelterId/health', authenticate, async (req, res, next) => {
    try {
        R.success(res, await HealthReport.findAll({
            where: { shelter_id: req.params.shelterId },
            include: [{ model: User, as: 'reporter', attributes: ['id', 'name'] }],
            order: [['reported_at', 'DESC']],
        }));
    } catch (e) { next(e); }
});

// POST /shelters/:shelterId/health
router.post('/:shelterId/health', authenticate, isOperator, async (req, res, next) => {
    try {
        const data = await HealthReport.create({
            ...req.body,
            shelter_id: req.params.shelterId,
            reported_by: req.user.id,
            reported_at: new Date(),
        });
        R.created(res, data, 'Laporan kesehatan berhasil ditambahkan');
    } catch (e) { next(e); }
});

module.exports = router;
