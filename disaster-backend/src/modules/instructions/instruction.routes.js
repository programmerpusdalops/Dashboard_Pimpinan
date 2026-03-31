'use strict';
const express = require('express');
const router = express.Router();
const { Instruction, User } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isPimpinan, isOperator } = require('../../middlewares/rbac.middleware');

// GET — list instruksi (semua role bisa melihat, filter berdasarkan target_module, status)
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { target_module, status, priority } = req.query;
        const where = {};
        if (target_module) where.target_module = target_module;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const instructions = await Instruction.findAll({
            where,
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },
                { model: User, as: 'responder', attributes: ['id', 'name', 'role'] },
            ],
            order: [
                ['status', 'ASC'],        // baru & dikerjakan dulu
                ['priority', 'DESC'],     // segera/penting duluan
                ['createdAt', 'DESC'],
            ],
        });
        R.success(res, instructions);
    } catch (e) { next(e); }
});

// GET — hitung instruksi baru per modul (untuk badge sidebar)
router.get('/count', authenticate, async (req, res, next) => {
    try {
        const { Op } = require('sequelize');
        const counts = await Instruction.findAll({
            where: { status: { [Op.in]: ['baru', 'dibaca', 'dikerjakan'] } },
            attributes: [
                'target_module',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
            ],
            group: ['target_module'],
            raw: true,
        });
        // Ubah ke object { dasbor: 2, logistik: 1, ... }
        const result = {};
        counts.forEach(c => { result[c.target_module] = parseInt(c.count); });
        R.success(res, result);
    } catch (e) { next(e); }
});

// POST — buat instruksi baru (hanya pimpinan/superadmin)
router.post('/', authenticate, isPimpinan, async (req, res, next) => {
    try {
        const { target_module, instruction_text, priority, assigned_to_role } = req.body;
        if (!target_module || !instruction_text) {
            return R.badRequest(res, 'target_module dan instruction_text wajib diisi');
        }
        const instruction = await Instruction.create({
            from_user_id: req.user.id,
            target_module,
            instruction_text,
            priority: priority || 'biasa',
            assigned_to_role: assigned_to_role || null,
        });
        R.created(res, instruction, 'Instruksi berhasil dikirim');
    } catch (e) { next(e); }
});

// PATCH — update status instruksi (operator/admin memproses)
router.patch('/:id/status', authenticate, isOperator, async (req, res, next) => {
    try {
        const inst = await Instruction.findByPk(req.params.id);
        if (!inst) return R.notFound(res, 'Instruksi tidak ditemukan');

        const { status } = req.body;
        const validStatuses = ['dibaca', 'dikerjakan', 'selesai'];
        if (!validStatuses.includes(status)) {
            return R.badRequest(res, 'Status tidak valid. Pilih: dibaca, dikerjakan, selesai');
        }

        const updateData = { status };
        if (status === 'selesai') updateData.completed_at = new Date();

        R.success(res, await inst.update(updateData), 'Status instruksi diperbarui');
    } catch (e) { next(e); }
});

// PATCH — balas/respon instruksi (operator/admin)
router.patch('/:id/respond', authenticate, isOperator, async (req, res, next) => {
    try {
        const inst = await Instruction.findByPk(req.params.id);
        if (!inst) return R.notFound(res, 'Instruksi tidak ditemukan');

        const { response_text, status } = req.body;
        if (!response_text) return R.badRequest(res, 'response_text wajib diisi');

        const updateData = {
            response_text,
            responded_by: req.user.id,
            responded_at: new Date(),
        };
        if (status) {
            updateData.status = status;
            if (status === 'selesai') updateData.completed_at = new Date();
        } else if (inst.status === 'baru') {
            updateData.status = 'dibaca';
        }

        R.success(res, await inst.update(updateData), 'Respon berhasil disimpan');
    } catch (e) { next(e); }
});

module.exports = router;
