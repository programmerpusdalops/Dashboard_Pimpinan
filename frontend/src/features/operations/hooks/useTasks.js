/**
 * features/operations/hooks/useTasks.js
 * React Query hooks untuk modul Operations (ICS Tasks)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsService, decisionsService } from '../../../services/operations.service';
import { toast } from '../../../lib/toast';

export const tasksKeys = {
    all: (params) => ['tasks', params],
    decisions: (params) => ['decisions', params],
};

export function useTasks(params = {}) {
    return useQuery({
        queryKey: tasksKeys.all(params),
        queryFn: () => operationsService.getTasks(params),
        staleTime: 1000 * 60,
    });
}

export function useCreateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: operationsService.createTask,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task berhasil dibuat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat task'),
    });
}

export function useUpdateTaskStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => operationsService.updateTaskStatus(id, status),
        // Optimistic update: langsung update UI tanpa tunggu server
        onMutate: async ({ id, status }) => {
            await qc.cancelQueries({ queryKey: ['tasks'] });
            const prev = qc.getQueryData(['tasks', {}]);
            if (prev) {
                qc.setQueryData(['tasks', {}], (old) =>
                    old?.map(t => t.id === id ? { ...t, status } : t)
                );
            }
            return { prev };
        },
        onError: (err, _, ctx) => {
            // Rollback jika gagal
            if (ctx?.prev) qc.setQueryData(['tasks', {}], ctx.prev);
            toast.error('Gagal update status task');
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] });
            qc.invalidateQueries({ queryKey: ['dashboard', 'priorities'] });
        },
    });
}

export function useDeleteTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: operationsService.deleteTask,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task berhasil dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus task'),
    });
}

export function useDecisions(params = {}) {
    return useQuery({
        queryKey: tasksKeys.decisions(params),
        queryFn: () => decisionsService.getDecisions(params),
    });
}

export function useCreateDecision() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: decisionsService.createDecision,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['decisions'] });
            toast.success('Keputusan berhasil dicatat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mencatat keputusan'),
    });
}
