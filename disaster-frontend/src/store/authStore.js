import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),

    // Dipanggil setelah login berhasil
    setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    // Dipanggil saat logout tombol diklik (panggil API dulu, lalu clear state)
    logout: async () => {
        try {
            // Beritahu backend agar invalidasi refresh token di DB
            await api.post('/auth/logout');
        } catch (_) {
            // Tetap lanjut logout lokal meski API gagal (ex: token sudah expired)
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
    },

    // Dipanggil oleh event 'auth:logout' dari axios interceptor (forceLogout)
    clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    // Update profil user (setelah edit profil)
    updateUser: (userData) => {
        const merged = { ...get().user, ...userData };
        localStorage.setItem('user', JSON.stringify(merged));
        set({ user: merged });
    },

    // Helper: cek apakah user punya role tertentu atau lebih tinggi
    hasRole: (minRole) => {
        const hierarchy = { viewer: 1, operator: 2, admin: 3, superadmin: 4, pimpinan: 5 };
        const userLevel = hierarchy[get().user?.role] || 0;
        const required = hierarchy[minRole] || 99;
        return userLevel >= required;
    },
}));

// Listen event dari axios interceptor (saat refresh token gagal / expired)
if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
        useAuthStore.getState().clearAuth();
    });
}

export default useAuthStore;
