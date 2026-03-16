/**
 * services/dashboard.service.js
 * API calls untuk modul Dashboard (KPI, priorities, peta)
 */
import api from '../lib/axios';

export const dashboardService = {
    getKpi: () =>
        api.get('/dashboard/kpi').then(r => r.data.data),

    getPriorities: () =>
        api.get('/dashboard/priorities').then(r => r.data.data),

    getMapGeoJson: () =>
        api.get('/dashboard/map/geojson').then(r => r.data.data),
};
