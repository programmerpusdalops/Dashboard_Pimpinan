/**
 * services/dashboard.service.js
 * API calls untuk modul Dashboard (KPI, priorities, peta)
 */
import api from '../lib/axios';

export const dashboardService = {
    getKpi: (eventId) =>
        api.get('/dashboard/kpi', { params: { event_id: eventId } }).then(r => r.data.data),

    getPriorities: (eventId) =>
        api.get('/dashboard/priorities', { params: { event_id: eventId } }).then(r => r.data.data),

    getMapGeoJson: (eventId) =>
        api.get('/dashboard/map/geojson', { params: { event_id: eventId } }).then(r => r.data.data),
};
