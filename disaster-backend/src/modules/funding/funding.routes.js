'use strict';
const express = require('express');
const router = express.Router();
const { BudgetAllocation, DailyExpenditure, User } = require('../../models');
const { Op } = require('sequelize');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator, isAdmin } = require('../../middlewares/rbac.middleware');

// GET /funding — summary anggaran
router.get('/', authenticate, async (req, res, next) => {
    try {
        const allocations = await BudgetAllocation.findAll({ include: [{ model: DailyExpenditure, as: 'expenditures' }] });
        let totalPagu = 0, totalRealisasi = 0;
        const sektorBreakdown = {};
        allocations.forEach(a => {
            totalPagu += Number(a.total_amount);
            const exp = a.expenditures.reduce((s, e) => s + Number(e.amount), 0);
            totalRealisasi += exp;
            sektorBreakdown[a.sector] = (sektorBreakdown[a.sector] || 0) + exp;
        });
        R.success(res, {
            totalPagu,
            totalRealisasi,
            sisaSaldo: totalPagu - totalRealisasi,
            persenRealisasi: totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(1) : 0,
            sektorBreakdown,
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

// GET /funding/allocations
router.get('/allocations', authenticate, async (req, res, next) => {
    try { R.success(res, await BudgetAllocation.findAll({ order: [['allocated_at', 'DESC']] })); }
    catch (e) { next(e); }
});

// POST /funding/allocations
router.post('/allocations', authenticate, isAdmin, async (req, res, next) => {
    try { R.created(res, await BudgetAllocation.create(req.body), 'Alokasi anggaran berhasil ditambahkan'); }
    catch (e) { next(e); }
});

// GET /funding/expenditures
router.get('/expenditures', authenticate, async (req, res, next) => {
    try { R.success(res, await DailyExpenditure.findAll({ order: [['expenditure_date', 'DESC']] })); }
    catch (e) { next(e); }
});

// POST /funding/expenditures
router.post('/expenditures', authenticate, isOperator, async (req, res, next) => {
    try { R.created(res, await DailyExpenditure.create({ ...req.body, verified_by: req.user.id }), 'Pengeluaran dicatat'); }
    catch (e) { next(e); }
});

module.exports = router;
