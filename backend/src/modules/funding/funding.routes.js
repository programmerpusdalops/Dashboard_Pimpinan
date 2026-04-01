'use strict';
const express = require('express');
const router = express.Router();
const { BudgetAllocation, DailyExpenditure, User, DisasterEvent } = require('../../models');
const { Op } = require('sequelize');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

// GET /funding — summary anggaran (dengan filter source opsional)
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { event_id, source } = req.query;
        const where = {};
        if (event_id) where.event_id = event_id;
        if (source) where.source = source;

        const allocations = await BudgetAllocation.findAll({ 
            where,
            include: [{ model: DailyExpenditure, as: 'expenditures' }] 
        });
        
        let totalPagu = 0, totalRealisasi = 0;
        const sektorBreakdown = {};
        const sourceBreakdown = {};
        
        allocations.forEach(a => {
            totalPagu += Number(a.total_amount);
            const exp = a.expenditures.reduce((s, e) => s + Number(e.amount), 0);
            totalRealisasi += exp;
            sektorBreakdown[a.sector] = (sektorBreakdown[a.sector] || 0) + exp;
            // Breakdown per sumber dana
            sourceBreakdown[a.source] = sourceBreakdown[a.source] || { pagu: 0, realisasi: 0 };
            sourceBreakdown[a.source].pagu += Number(a.total_amount);
            sourceBreakdown[a.source].realisasi += exp;
        });
        
        R.success(res, {
            totalPagu,
            totalRealisasi,
            sisaSaldo: totalPagu - totalRealisasi,
            persenRealisasi: totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 100) : 0,
            sektorBreakdown,
            sourceBreakdown,
        });
    } catch (e) { next(e); }
});

// GET /funding/burn-rate — data harian untuk chart
router.get('/burn-rate', authenticate, async (req, res, next) => {
    try {
        const data = await DailyExpenditure.findAll({
            attributes: ['expenditure_date', 'amount', 'description'],
            order: [['expenditure_date', 'ASC']],
        });
        R.success(res, data);
    } catch (e) { next(e); }
});

// GET /funding/allocations — list alokasi (filter source, event_id)
router.get('/allocations', authenticate, async (req, res, next) => {
    try {
        const { source, event_id } = req.query;
        const where = {};
        if (source) where.source = source;
        if (event_id) where.event_id = event_id;

        const data = await BudgetAllocation.findAll({
            where,
            include: [
                { model: DailyExpenditure, as: 'expenditures', attributes: ['id', 'amount'] },
                { model: DisasterEvent, attributes: ['id', 'title'] },
            ],
            order: [['allocated_at', 'DESC']],
        });

        // Tambahkan total realisasi per alokasi
        const result = data.map(a => {
            const plain = a.toJSON();
            plain.realized = (plain.expenditures || []).reduce((s, e) => s + Number(e.amount), 0);
            return plain;
        });

        R.success(res, result);
    } catch (e) { next(e); }
});

// POST /funding/allocations — buat alokasi baru
router.post('/allocations', authenticate, isAdmin, async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (!data.allocated_at || isNaN(new Date(data.allocated_at).getTime())) {
            data.allocated_at = new Date().toISOString().split('T')[0];
        }
        R.created(res, await BudgetAllocation.create(data), 'Alokasi anggaran berhasil ditambahkan');
    } catch (e) { next(e); }
});

// PUT /funding/allocations/:id — edit alokasi
router.put('/allocations/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const alloc = await BudgetAllocation.findByPk(req.params.id);
        if (!alloc) return R.notFound(res, 'Alokasi tidak ditemukan');
        const data = { ...req.body };
        if (data.allocated_at && isNaN(new Date(data.allocated_at).getTime())) {
            delete data.allocated_at;
        }
        R.success(res, await alloc.update(data), 'Alokasi berhasil diperbarui');
    } catch (e) { next(e); }
});

// DELETE /funding/allocations/:id — hapus alokasi
router.delete('/allocations/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const alloc = await BudgetAllocation.findByPk(req.params.id);
        if (!alloc) return R.notFound(res, 'Alokasi tidak ditemukan');
        // Hapus expenditures terkait dulu
        await DailyExpenditure.destroy({ where: { allocation_id: alloc.id } });
        await alloc.destroy();
        R.success(res, null, 'Alokasi dan pengeluaran terkait berhasil dihapus');
    } catch (e) { next(e); }
});

// GET /funding/expenditures — list pengeluaran (filter allocation_id)
router.get('/expenditures', authenticate, async (req, res, next) => {
    try {
        const { allocation_id } = req.query;
        const where = {};
        if (allocation_id) where.allocation_id = allocation_id;
        R.success(res, await DailyExpenditure.findAll({ where, order: [['expenditure_date', 'DESC']] }));
    } catch (e) { next(e); }
});

// POST /funding/expenditures
router.post('/expenditures', authenticate, isOperator, async (req, res, next) => {
    try { R.created(res, await DailyExpenditure.create({ ...req.body, verified_by: req.user.id }), 'Pengeluaran dicatat'); }
    catch (e) { next(e); }
});

// DELETE /funding/expenditures/:id
router.delete('/expenditures/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const exp = await DailyExpenditure.findByPk(req.params.id);
        if (!exp) return R.notFound(res, 'Pengeluaran tidak ditemukan');
        await exp.destroy();
        R.success(res, null, 'Pengeluaran berhasil dihapus');
    } catch (e) { next(e); }
});

module.exports = router;
