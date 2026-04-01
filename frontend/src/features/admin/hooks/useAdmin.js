/**
 * features/admin/hooks/useAdmin.js
 * React Query hooks untuk Admin Panel — manajemen user
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../../services/users.service';
import { toast } from '../../../lib/toast';

export const adminKeys = {
    users: (params) => ['admin', 'users', params],
    user: (id) => ['admin', 'users', id],
};

export function useUsers(params = {}) {
    return useQuery({
        queryKey: adminKeys.users(params),
        queryFn: () => usersService.getAll(params),
        select: (res) => ({ data: res.data, pagination: res.pagination }),
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User berhasil dibuat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat user'),
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => usersService.update(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User berhasil diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui user'),
    });
}

export function useToggleUserActive() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.toggleActive,
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success(`User ${data.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah status user'),
    });
}

export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User berhasil dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus user'),
    });
}
