/**
 * features/logistics/hooks/useLogistics.js
 * React Query hooks untuk modul Logistics
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../../../services/logistics.service';
import { toast } from '../../../lib/toast';

export const logisticsKeys = {
    warehouses: () => ['warehouses'],
    warehouse: (id) => ['warehouses', id],
    inventory: (warehouseId) => ['warehouses', warehouseId, 'inventory'],
    shipments: (params) => ['shipments', params],
};

export function useWarehouses() {
    return useQuery({
        queryKey: logisticsKeys.warehouses(),
        queryFn: logisticsService.getWarehouses,
    });
}

export function useInventory(warehouseId) {
    return useQuery({
        queryKey: logisticsKeys.inventory(warehouseId),
        queryFn: () => logisticsService.getInventory(warehouseId),
        enabled: !!warehouseId,
    });
}

export function useShipments(params = {}) {
    return useQuery({
        queryKey: logisticsKeys.shipments(params),
        queryFn: () => logisticsService.getShipments(params),
    });
}

export function useCreateShipment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: logisticsService.createShipment,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['shipments'] });
            toast.success('Pengiriman berhasil dibuat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat pengiriman'),
    });
}

export function useUpdateShipmentStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, delay_reason }) =>
            logisticsService.updateShipmentStatus(id, status, delay_reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['shipments'] });
            toast.success('Status pengiriman diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal update status'),
    });
}

export function useUpdateInventoryItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, ...payload }) => logisticsService.updateInventoryItem(itemId, payload),
        onSuccess: (_, { warehouseId }) => {
            qc.invalidateQueries({ queryKey: logisticsKeys.inventory(warehouseId) });
            toast.success('Stok berhasil diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal update stok'),
    });
}
