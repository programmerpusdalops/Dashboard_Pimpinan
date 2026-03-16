'use strict';
const express = require('express');
const router = express.Router();
const { Refugee, Shelter } = require('../../models');
const { Op } = require('sequelize');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isOperator } = require('../../middlewares/rbac.middleware');

// GET /refugees/summary — agregat
router.get('/summary', authenticate, async (req, res, next) => {
    try {
        const shelters = await Shelter.findAll({ where: { status: 'aktif' }, include: [{ model: Refugee, as: 'refugees' }] });
        let totalJiwa = 0, totalBalita = 0, totalLansia = 0, totalIbuHamil = 0, totalDisabilitas = 0;
        shelters.forEach(s => {
            const r = s.refugees[s.refugees.length - 1];
            if (r) {
                totalJiwa += r.total_jiwa;
                totalBalita += r.balita;
                totalLansia += r.lansia;
                totalIbuHamil += r.ibu_hamil;
                totalDisabilitas += r.disabilitas;
            }
        });
        R.success(res, { totalJiwa, totalBalita, totalLansia, totalIbuHamil, totalDisabilitas, totalShelters: shelters.length });
    } catch (e) { next(e); }
});

// GET /shelters/:shelterId/refugees
router.get('/shelters/:shelterId', authenticate, async (req, res, next) => {
    try {
        R.success(res, await Refugee.findAll({ where: { shelter_id: req.params.shelterId }, order: [['recorded_date', 'DESC']] }));
    } catch (e) { next(e); }
});

// PUT /shelters/:shelterId/refugees — update data pengungsi
router.put('/shelters/:shelterId', authenticate, isOperator, async (req, res, next) => {
    try {
        const data = await Refugee.create({ ...req.body, shelter_id: req.params.shelterId, updated_by: req.user.id });
        await Shelter.update({ current_occupancy: req.body.total_jiwa }, { where: { id: req.params.shelterId } });
        R.created(res, data, 'Data pengungsi berhasil diperbaharui');
    } catch (e) { next(e); }
});

module.exports = router;
