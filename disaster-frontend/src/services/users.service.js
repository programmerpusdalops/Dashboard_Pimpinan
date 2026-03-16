/**
 * services/users.service.js
 * API calls untuk modul Admin — manajemen user
 */
import api from '../lib/axios';

export const usersService = {
    getAll: (params = {}) =>
        api.get('/users', { params }).then(r => r.data),   // returns { data, pagination }

    getById: (id) =>
        api.get(`/users/${id}`).then(r => r.data.data),

    create: (payload) =>
        api.post('/users', payload).then(r => r.data.data),

    update: (id, payload) =>
        api.put(`/users/${id}`, payload).then(r => r.data.data),

    remove: (id) =>
        api.delete(`/users/${id}`).then(r => r.data),

    toggleActive: (id) =>
        api.patch(`/users/${id}/activate`).then(r => r.data.data),
};
