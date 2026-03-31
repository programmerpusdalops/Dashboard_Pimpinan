/**
 * hooks/useInstructions.js
 * React Query hooks untuk modul Instruksi Pimpinan
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructionService } from '../services/instruction.service';
import { toast } from '../lib/toast';

export const instructionKeys = {
    all: (params) => ['instructions', params],
    count: () => ['instructions', 'count'],
};

export function useInstructions(params = {}) {
    return useQuery({
        queryKey: instructionKeys.all(params),
        queryFn: () => instructionService.getAll(params),
        staleTime: 1000 * 10,
        refetchInterval: 1000 * 15,  // auto-refresh setiap 15 detik
    });
}

export function useInstructionCount() {
    return useQuery({
        queryKey: instructionKeys.count(),
        queryFn: instructionService.getCount,
        staleTime: 1000 * 15,  // refresh setiap 15 detik
        refetchInterval: 1000 * 30,  // auto-refresh setiap 30 detik
    });
}

export function useCreateInstruction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: instructionService.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructions'] });
            toast.success('Instruksi berhasil dikirim');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim instruksi'),
    });
}

export function useUpdateInstructionStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => instructionService.updateStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructions'] });
            toast.success('Status instruksi diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal update status'),
    });
}

export function useRespondInstruction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => instructionService.respond(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructions'] });
            toast.success('Respon berhasil disimpan');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan respon'),
    });
}
