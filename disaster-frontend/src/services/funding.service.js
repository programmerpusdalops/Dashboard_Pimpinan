/**
 * services/funding.service.js
 * API calls untuk modul Funding & Anggaran
 */
import api from '../lib/axios';

export const fundingService = {
    // Summary & charts
    getSummary: (params = {}) =>
        api.get('/funding', { params }).then(r => r.data.data),

    getBurnRate: () =>
        api.get('/funding/burn-rate').then(r => r.data.data),

    // Alokasi anggaran
    getAllocations: (params = {}) =>
        api.get('/funding/allocations', { params }).then(r => r.data.data),

    createAllocation: (payload) =>
        api.post('/funding/allocations', payload).then(r => r.data.data),

    updateAllocation: (id, payload) =>
        api.put(`/funding/allocations/${id}`, payload).then(r => r.data.data),

    deleteAllocation: (id) =>
        api.delete(`/funding/allocations/${id}`).then(r => r.data),

    // Pengeluaran harian
    getExpenditures: (params = {}) =>
        api.get('/funding/expenditures', { params }).then(r => r.data.data),

    createExpenditure: (payload) =>
        api.post('/funding/expenditures', payload).then(r => r.data.data),

    deleteExpenditure: (id) =>
        api.delete(`/funding/expenditures/${id}`).then(r => r.data),
};
