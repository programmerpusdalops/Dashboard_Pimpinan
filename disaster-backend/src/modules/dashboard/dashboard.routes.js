'use strict';
const express = require('express');
const router = express.Router();
const { DisasterEvent, Casualty, Shelter, Refugee, OperationTask, DecisionLog, LogisticsShipment } = require('../../models');
const { Op } = require('sequelize');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');

// GET /dashboard/kpi — agregat semua KPI
router.get('/kpi', authenticate, async (req, res, next) => {
    try {
        const activeEvents = await DisasterEvent.findAll({
            where: { status: { [Op.in]: ['siaga', 'tanggap_darurat'] } },
        });
        const eventIds = activeEvents.map(e => e.id);

        const casualtyTotals = eventIds.length > 0
            ? await Casualty.findAll({
                where: { event_id: { [Op.in]: eventIds } },
                order: [['recorded_at', 'DESC']],
            })
            : [];

        // Ambil data paling baru per event
        const latestByEvent = {};
        casualtyTotals.forEach(c => {
            if (!latestByEvent[c.event_id]) latestByEvent[c.event_id] = c;
        });
        const casualties = Object.values(latestByEvent);

        const kpi = {
            totalKejadian: activeEvents.length,
            totalMeninggal: casualties.reduce((s, c) => s + (c.meninggal || 0), 0),
            totalLuka: casualties.reduce((s, c) => s + (c.luka_berat || 0) + (c.luka_ringan || 0), 0),
            totalHilang: casualties.reduce((s, c) => s + (c.hilang || 0), 0),
            totalRumahRusak: casualties.reduce((s, c) => s + (c.rumah_rusak_berat || 0) + (c.rumah_rusak_sedang || 0) + (c.rumah_rusak_ringan || 0), 0),
            totalAksesJalanPutus: casualties.reduce((s, c) => s + (c.akses_jalan_putus || 0), 0),
        };

        // Agregat pengungsi
        const shelters = await Shelter.findAll({
            where: { status: 'aktif' },
            include: [{ model: Refugee, as: 'refugees' }],
        });
        let totalPengungsi = 0;
        shelters.forEach(s => {
            const latest = s.refugees[s.refugees.length - 1];
            if (latest) totalPengungsi += latest.total_jiwa || 0;
        });
        kpi.totalPengungsi = totalPengungsi;
        kpi.totalPosko = shelters.length;

        R.success(res, kpi);
    } catch (e) { next(e); }
});

// GET /dashboard/priorities — top 5 task kritis/tinggi yang belum selesai
router.get('/priorities', authenticate, async (req, res, next) => {
    try {
        const priorities = await OperationTask.findAll({
            where: {
                status: { [Op.in]: ['todo', 'in_progress'] },
                priority: { [Op.in]: ['critical', 'high', 'kritis', 'tinggi'] },
            },
            order: [['priority', 'ASC'], ['createdAt', 'ASC']],
            limit: 5,
        });
        R.success(res, priorities);
    } catch (e) { next(e); }
});

// GET /dashboard/map/geojson — gabungan titik peta event & posko
router.get('/map/geojson', authenticate, async (req, res, next) => {
    try {
        const events = await DisasterEvent.findAll({
            where: { status: { [Op.in]: ['siaga', 'tanggap_darurat'] } },
            attributes: ['id', 'title', 'type', 'severity', 'location_name', 'latitude', 'longitude', 'status'],
        });
        const shelterData = await Shelter.findAll({
            where: { status: 'aktif' },
            attributes: ['id', 'name', 'location_name', 'latitude', 'longitude', 'current_occupancy', 'capacity'],
        });

        const features = [
            ...events.filter(e => e.latitude && e.longitude).map(e => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)] },
                properties: { layerType: 'event', id: e.id, title: e.title, type: e.type, severity: e.severity, status: e.status },
            })),
            ...shelterData.filter(s => s.latitude && s.longitude).map(s => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [parseFloat(s.longitude), parseFloat(s.latitude)] },
                properties: { layerType: 'shelter', id: s.id, name: s.name, occupancy: s.current_occupancy, capacity: s.capacity },
            })),
        ];

        R.success(res, { type: 'FeatureCollection', features });
    } catch (e) { next(e); }
});

module.exports = router;

