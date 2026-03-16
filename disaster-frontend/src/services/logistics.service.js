/**
 * services/logistics.service.js
 * API calls untuk modul Logistics (Gudang, Inventaris, Pengiriman)
 */
import api from '../lib/axios';

export const logisticsService = {
    // ── Warehouses ──────────────────────────────────────────────────
    getWarehouses: () =>
        api.get('/warehouses').then(r => r.data.data),

    getWarehouseById: (id) =>
        api.get(`/warehouses/${id}`).then(r => r.data.data),

    createWarehouse: (payload) =>
        api.post('/warehouses', payload).then(r => r.data.data),

    updateWarehouse: (id, payload) =>
        api.put(`/warehouses/${id}`, payload).then(r => r.data.data),

    // ── Inventory ───────────────────────────────────────────────────
    getInventory: (warehouseId) =>
        api.get(`/warehouses/${warehouseId}/inventory`).then(r => r.data.data),

    addInventoryItem: (warehouseId, payload) =>
        api.post(`/warehouses/${warehouseId}/inventory`, payload).then(r => r.data.data),

    updateInventoryItem: (itemId, payload) =>
        api.put(`/warehouses/inventory/${itemId}`, payload).then(r => r.data.data),

    // ── Shipments ───────────────────────────────────────────────────
    getShipments: (params = {}) =>
        api.get('/shipments', { params }).then(r => r.data.data),

    getShipmentById: (id) =>
        api.get(`/shipments/${id}`).then(r => r.data.data),

    createShipment: (payload) =>
        api.post('/shipments', payload).then(r => r.data.data),

    updateShipmentStatus: (id, status, delay_reason) =>
        api.patch(`/shipments/${id}/status`, { status, delay_reason }).then(r => r.data.data),
};
