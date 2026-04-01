/**
 * hooks/useAuth.js
 * Hook untuk mengakses auth state + mutation login/logout via React Query
 */
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import queryClient from '../lib/queryClient';

export function useAuth() {
    const { user, isAuthenticated, setAuth, logout: storeLogout, updateUser, hasRole } = useAuthStore();
    const navigate = useNavigate();

    // Mutation: Login
    const loginMutation = useMutation({
        mutationFn: async ({ email, password }) => {
            const api = (await import('../lib/axios')).default;
            const res = await api.post('/auth/login', { email, password });
            return res.data.data;
        },
        onSuccess: ({ user, accessToken, refreshToken }) => {
            setAuth(user, accessToken, refreshToken);
            // Invalidate semua cached query agar data fresh setelah login
            queryClient.invalidateQueries();
            navigate('/');
        },
    });

    // Mutation: Logout
    const logoutMutation = useMutation({
        mutationFn: storeLogout,
        onSettled: () => {
            // Clear semua cache query setelah logout
            queryClient.clear();
            navigate('/login');
        },
    });

    return {
        user,
        isAuthenticated,
        hasRole,
        updateUser,
        login: loginMutation.mutateAsync,
        loginPending: loginMutation.isPending,
        loginError: loginMutation.error?.response?.data?.message,
        logout: logoutMutation.mutate,
        logoutPending: logoutMutation.isPending,
    };
}
