/**
 * services/events.service.js
 * API calls untuk modul Disaster Events & Casualties
 */
import api from '../lib/axios';

export const eventsService = {
    // ── Events ──────────────────────────────────────────────────────
    getAll: (params = {}) =>
        api.get('/events', { params }).then(r => r.data),   // returns { data, pagination }

    getById: (id) =>
        api.get(`/events/${id}`).then(r => r.data.data),

    getGeoJson: () =>
        api.get('/events/geojson').then(r => r.data.data),

    create: (payload) =>
        api.post('/events', payload).then(r => r.data.data),

    update: (id, payload) =>
        api.put(`/events/${id}`, payload).then(r => r.data.data),

    updateStatus: (id, status) =>
        api.patch(`/events/${id}/status`, { status }).then(r => r.data.data),

    remove: (id) =>
        api.delete(`/events/${id}`).then(r => r.data),

    // ── Casualties ──────────────────────────────────────────────────
    getCasualties: (eventId) =>
        api.get(`/events/${eventId}/casualties`).then(r => r.data.data),

    upsertCasualties: (eventId, payload) =>
        api.put(`/events/${eventId}/casualties`, payload).then(r => r.data.data),
};
