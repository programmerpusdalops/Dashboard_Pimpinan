/**
 * services/funding.service.js
 * API calls untuk modul Funding & Anggaran
 */
import api from '../lib/axios';

export const fundingService = {
    // Summary & charts
    getSummary: () =>
        api.get('/funding').then(r => r.data.data),

    getBurnRate: () =>
        api.get('/funding/burn-rate').then(r => r.data.data),

    // Alokasi anggaran
    getAllocations: () =>
        api.get('/funding/allocations').then(r => r.data.data),

    createAllocation: (payload) =>
        api.post('/funding/allocations', payload).then(r => r.data.data),

    // Pengeluaran harian
    getExpenditures: () =>
        api.get('/funding/expenditures').then(r => r.data.data),

    createExpenditure: (payload) =>
        api.post('/funding/expenditures', payload).then(r => r.data.data),
};
