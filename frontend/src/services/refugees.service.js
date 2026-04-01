/**
 * services/refugees.service.js
 * API calls untuk modul Pengungsi (Shelter, Pengungsi, Laporan Kesehatan)
 */
import api from '../lib/axios';

export const refugeesService = {
    // ── Shelters ────────────────────────────────────────────────────
    getShelters: (params = {}) =>
        api.get('/shelters', { params }).then(r => r.data.data),

    getShelterById: (id) =>
        api.get(`/shelters/${id}`).then(r => r.data.data),

    createShelter: (payload) =>
        api.post('/shelters', payload).then(r => r.data.data),

    updateShelter: (id, payload) =>
        api.put(`/shelters/${id}`, payload).then(r => r.data.data),

    // ── Refugees ────────────────────────────────────────────────────
    getRefugeesSummary: () =>
        api.get('/refugees/summary').then(r => r.data.data),

    getRefugeesByShelter: (shelterId) =>
        api.get(`/refugees/shelters/${shelterId}`).then(r => r.data.data),

    upsertRefugees: (shelterId, payload) =>
        api.put(`/refugees/shelters/${shelterId}`, payload).then(r => r.data.data),

    // ── Health Reports ──────────────────────────────────────────────
    getHealthReports: (shelterId) =>
        api.get(`/shelters/${shelterId}/health`).then(r => r.data.data),

    addHealthReport: (shelterId, payload) =>
        api.post(`/shelters/${shelterId}/health`, payload).then(r => r.data.data),
};
