/**
 * features/refugees/hooks/useRefugees.js
 * React Query hooks untuk modul Pengungsi
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refugeesService } from '../../../services/refugees.service';
import { toast } from '../../../lib/toast';

export const refugeesKeys = {
    shelters: (params) => ['shelters', params],
    shelter: (id) => ['shelters', id],
    summary: () => ['refugees', 'summary'],
    byShelter: (id) => ['refugees', 'shelter', id],
    health: (shelterId) => ['health-reports', shelterId],
};

export function useShelters(params = {}) {
    return useQuery({
        queryKey: refugeesKeys.shelters(params),
        queryFn: () => refugeesService.getShelters(params),
    });
}

export function useRefugeesSummary() {
    return useQuery({
        queryKey: refugeesKeys.summary(),
        queryFn: refugeesService.getRefugeesSummary,
        staleTime: 1000 * 60,
    });
}

export function useRefugeesByShelter(shelterId) {
    return useQuery({
        queryKey: refugeesKeys.byShelter(shelterId),
        queryFn: () => refugeesService.getRefugeesByShelter(shelterId),
        enabled: !!shelterId,
    });
}

export function useHealthReports(shelterId) {
    return useQuery({
        queryKey: refugeesKeys.health(shelterId),
        queryFn: () => refugeesService.getHealthReports(shelterId),
        enabled: !!shelterId,
    });
}

export function useCreateShelter() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: refugeesService.createShelter,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['shelters'] });
            toast.success('Posko berhasil ditambahkan');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambah posko'),
    });
}

export function useUpsertRefugees() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shelterId, ...payload }) => refugeesService.upsertRefugees(shelterId, payload),
        onSuccess: (_, { shelterId }) => {
            qc.invalidateQueries({ queryKey: refugeesKeys.byShelter(shelterId) });
            qc.invalidateQueries({ queryKey: refugeesKeys.summary() });
            toast.success('Data pengungsi diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal update data pengungsi'),
    });
}

export function useAddHealthReport() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shelterId, ...payload }) => refugeesService.addHealthReport(shelterId, payload),
        onSuccess: (_, { shelterId }) => {
            qc.invalidateQueries({ queryKey: refugeesKeys.health(shelterId) });
            toast.success('Laporan kesehatan berhasil disimpan');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal simpan laporan kesehatan'),
    });
}
