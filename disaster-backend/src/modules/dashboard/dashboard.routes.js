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
        const { event_id } = req.query;

        const activeEventsCondition = { status: { [Op.in]: ['siaga', 'tanggap_darurat'] } };
        if (event_id) activeEventsCondition.id = event_id;

        const activeEvents = await DisasterEvent.findAll({
            where: activeEventsCondition,
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

        // Agregat pengungsi (filter by event_id for shelters if needed)
        const shelterCondition = { status: 'aktif' };
        if (event_id) shelterCondition.event_id = event_id;

        const shelters = await Shelter.findAll({
            where: shelterCondition,
            include: [{ model: Refugee, as: 'refugees' }],
        });
        let totalPengungsi = 0;
        shelters.forEach(s => {
            const latest = s.refugees[s.refugees.length - 1]; // get latest
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
        const { event_id } = req.query;
        const where = {
            status: { [Op.in]: ['todo', 'in_progress'] },
            priority: { [Op.in]: ['critical', 'high', 'kritis', 'tinggi'] },
        };
        if (event_id) where.event_id = event_id;

        const priorities = await OperationTask.findAll({
            where,
            order: [['priority', 'ASC'], ['createdAt', 'ASC']],
            limit: 5,
        });
        R.success(res, priorities);
    } catch (e) { next(e); }
});

// GET /dashboard/map/geojson — gabungan titik peta event & posko
router.get('/map/geojson', authenticate, async (req, res, next) => {
    try {
        const { event_id } = req.query;

        const eventCondition = { status: { [Op.in]: ['siaga', 'tanggap_darurat'] } };
        if (event_id) eventCondition.id = event_id;

        const events = await DisasterEvent.findAll({
            where: eventCondition,
            attributes: ['id', 'title', 'type', 'severity', 'location_name', 'latitude', 'longitude', 'status'],
        });

        // Ambil data korban terbaru per event untuk ditampilkan di peta
        const eventIds = events.map(e => e.id);
        const casualties = eventIds.length > 0
            ? await Casualty.findAll({
                where: { event_id: { [Op.in]: eventIds } },
                order: [['recorded_at', 'DESC']],
            })
            : [];
        // Group: ambil record terbaru per event_id
        const latestCasualtyByEvent = {};
        casualties.forEach(c => {
            if (!latestCasualtyByEvent[c.event_id]) latestCasualtyByEvent[c.event_id] = c;
        });

        const shelterCondition = {};
        if (event_id) shelterCondition.event_id = event_id;

        const shelterData = await Shelter.findAll({
            where: shelterCondition,
            attributes: ['id', 'name', 'status', 'location_name', 'latitude', 'longitude', 'current_occupancy', 'capacity', 'pic_name'],
        });

        const features = [
            ...events.filter(e => e.latitude && e.longitude).map(e => {
                const cas = latestCasualtyByEvent[e.id];
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [parseFloat(e.longitude), parseFloat(e.latitude)] },
                    properties: {
                        layerType: 'event', id: e.id, title: e.title, type: e.type,
                        severity: e.severity, status: e.status, location_name: e.location_name,
                        // Data korban & kerusakan
                        meninggal: cas?.meninggal ?? 0,
                        luka: (cas?.luka_berat ?? 0) + (cas?.luka_ringan ?? 0),
                        hilang: cas?.hilang ?? 0,
                        rumahRusak: (cas?.rumah_rusak_berat ?? 0) + (cas?.rumah_rusak_sedang ?? 0) + (cas?.rumah_rusak_ringan ?? 0),
                    },
                };
            }),
            ...shelterData.filter(s => s.latitude && s.longitude).map(s => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [parseFloat(s.longitude), parseFloat(s.latitude)] },
                properties: {
                    layerType: 'shelter', id: s.id, name: s.name,
                    status: s.status, location_name: s.location_name, pic_name: s.pic_name,
                    occupancy: s.current_occupancy, capacity: s.capacity,
                },
            })),
        ];

        R.success(res, { type: 'FeatureCollection', features });
    } catch (e) { next(e); }
});

module.exports = router;

