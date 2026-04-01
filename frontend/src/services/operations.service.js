/**
 * services/operations.service.js
 * API calls untuk modul Operations (ICS Tasks) & Decisions
 */
import api from '../lib/axios';

export const operationsService = {
    // ── Tasks ───────────────────────────────────────────────────────
    getTasks: (params = {}) =>
        api.get('/tasks', { params }).then(r => r.data.data),

    createTask: (payload) =>
        api.post('/tasks', payload).then(r => r.data.data),

    updateTask: (id, payload) =>
        api.put(`/tasks/${id}`, payload).then(r => r.data.data),

    updateTaskStatus: (id, status) =>
        api.patch(`/tasks/${id}/status`, { status }).then(r => r.data.data),

    deleteTask: (id) =>
        api.delete(`/tasks/${id}`).then(r => r.data),
};

export const decisionsService = {
    // ── Decision Logs ───────────────────────────────────────────────
    getDecisions: (params = {}) =>
        api.get('/decisions', { params }).then(r => r.data.data),

    createDecision: (payload) =>
        api.post('/decisions', payload).then(r => r.data.data),

    updateDecision: (id, payload) =>
        api.put(`/decisions/${id}`, payload).then(r => r.data.data),

    deleteDecision: (id) =>
        api.delete(`/decisions/${id}`).then(r => r.data),
};
