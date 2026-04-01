'use strict';
const express = require('express');
const router = express.Router();
const { OperationTask, User, DisasterEvent } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status, priority, event_id } = req.query;
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (event_id) where.event_id = event_id;
        R.success(res, await OperationTask.findAll({ 
            where, 
            include: [{ model: DisasterEvent, attributes: ['id', 'title'] }],
            order: [['createdAt', 'DESC']] 
        }));
    } catch (e) { next(e); }
});

router.post('/', authenticate, isOperator, async (req, res, next) => {
    try { R.created(res, await OperationTask.create({ ...req.body, created_by: req.user.id }), 'Task berhasil dibuat'); }
    catch (e) { next(e); }
});

router.put('/:id', authenticate, isOperator, async (req, res, next) => {
    try {
        const t = await OperationTask.findByPk(req.params.id);
        if (!t) return R.notFound(res, 'Task tidak ditemukan');
        if (req.body.status === 'done') req.body.completed_at = new Date();
        R.success(res, await t.update(req.body));
    } catch (e) { next(e); }
});

// PATCH — update status saja (Kanban drag-drop)
router.patch('/:id/status', authenticate, isOperator, async (req, res, next) => {
    try {
        const t = await OperationTask.findByPk(req.params.id);
        if (!t) return R.notFound(res, 'Task tidak ditemukan');
        const updateData = { status: req.body.status };
        if (req.body.status === 'done') updateData.completed_at = new Date();
        R.success(res, await t.update(updateData), 'Status task berhasil diupdate');
    } catch (e) { next(e); }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const t = await OperationTask.findByPk(req.params.id);
        if (!t) return R.notFound(res, 'Task tidak ditemukan');
        await t.destroy();
        R.success(res, null, 'Task berhasil dihapus');
    } catch (e) { next(e); }
});

module.exports = router;
