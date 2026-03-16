/**
 * features/funding/hooks/useFunding.js
 * React Query hooks untuk modul Funding & Anggaran
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundingService } from '../../../services/funding.service';
import { toast } from '../../../lib/toast';

export const fundingKeys = {
    summary: () => ['funding', 'summary'],
    burnRate: () => ['funding', 'burn-rate'],
    allocations: () => ['funding', 'allocations'],
    expenditures: () => ['funding', 'expenditures'],
};

export function useFundingSummary() {
    return useQuery({
        queryKey: fundingKeys.summary(),
        queryFn: fundingService.getSummary,
        staleTime: 1000 * 60 * 5,
    });
}

export function useBurnRate() {
    return useQuery({
        queryKey: fundingKeys.burnRate(),
        queryFn: fundingService.getBurnRate,
        staleTime: 1000 * 60 * 5,
    });
}

export function useAllocations() {
    return useQuery({
        queryKey: fundingKeys.allocations(),
        queryFn: fundingService.getAllocations,
    });
}

export function useExpenditures() {
    return useQuery({
        queryKey: fundingKeys.expenditures(),
        queryFn: fundingService.getExpenditures,
    });
}

export function useCreateAllocation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fundingService.createAllocation,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Alokasi anggaran berhasil ditambahkan');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambah alokasi'),
    });
}

export function useCreateExpenditure() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fundingService.createExpenditure,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Pengeluaran berhasil dicatat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mencatat pengeluaran'),
    });
}
