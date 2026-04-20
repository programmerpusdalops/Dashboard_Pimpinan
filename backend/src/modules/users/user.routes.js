'use strict';
const express = require('express');
const router = express.Router();
const svc = require('./user.service');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdmin, isSuperAdmin } = require('../../middlewares/rbac.middleware');

// GET /users — list dengan pagination & filter role
router.get('/', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, is_active } = req.query;
        const include_superadmin = req.user?.role === 'superadmin';
        const result = await svc.getAll({ page, limit, role, is_active, include_superadmin }, req.user);
        R.paginate(res, result.rows, result.count, page, limit);
    } catch (e) { next(e); }
});

// GET /users/:id
router.get('/:id', authenticate, isAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getById(req.params.id, req.user)); } catch (e) { next(e); }
});

// POST /users — superadmin & admin bisa buat user
router.post('/', authenticate, isAdmin, async (req, res, next) => {
    try { R.created(res, await svc.create(req.body, req.user), 'User berhasil dibuat'); } catch (e) { next(e); }
});

// PUT /users/:id
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
    try { R.success(res, await svc.update(req.params.id, req.body, req.user), 'User berhasil diupdate'); } catch (e) { next(e); }
});

// DELETE /users/:id — hanya superadmin
router.delete('/:id', authenticate, isSuperAdmin, async (req, res, next) => {
    try { await svc.remove(req.params.id, req.user); R.success(res, null, 'User berhasil dihapus'); } catch (e) { next(e); }
});

// PATCH /users/:id/activate — toggle aktif/nonaktif
router.patch('/:id/activate', authenticate, isAdmin, async (req, res, next) => {
    try { R.success(res, await svc.toggleActive(req.params.id, req.user), 'Status user berhasil diubah'); } catch (e) { next(e); }
});

module.exports = router;

