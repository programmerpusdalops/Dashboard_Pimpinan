/**
 * services/instruction.service.js
 * API calls untuk modul Instruksi Pimpinan
 */
import api from '../lib/axios';

export const instructionService = {
    getAll: (params = {}) =>
        api.get('/instructions', { params }).then(r => r.data.data),

    getCount: () =>
        api.get('/instructions/count').then(r => r.data.data),

    create: (payload) =>
        api.post('/instructions', payload).then(r => r.data.data),

    updateStatus: (id, status) =>
        api.patch(`/instructions/${id}/status`, { status }).then(r => r.data.data),

    respond: (id, payload) =>
        api.patch(`/instructions/${id}/respond`, payload).then(r => r.data.data),
};
