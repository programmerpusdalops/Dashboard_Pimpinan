/**
 * services/auth.service.js
 * Semua API call untuk modul Auth
 */
import api from '../lib/axios';

export const authService = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }).then(r => r.data.data),

    logout: () =>
        api.post('/auth/logout').then(r => r.data),

    refresh: (refreshToken) =>
        api.post('/auth/refresh', { refreshToken }).then(r => r.data.data),

    getMe: () =>
        api.get('/auth/me').then(r => r.data.data),

    changePassword: (old_password, new_password, confirm_password) =>
        api.put('/auth/change-password', { old_password, new_password, confirm_password }).then(r => r.data),
};
