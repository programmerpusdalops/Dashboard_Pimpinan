/**
 * services/appSettings.service.js
 * API calls untuk modul App Settings — nav access, component visibility, notif dots
 */
import api from '../lib/axios';

export const appSettingsService = {
    // ── Nav Access ─────────────────────────────────────────
    getNavAccess: () =>
        api.get('/app-settings/nav-access').then(r => r.data.data),

    getNavAccessByRole: (role) =>
        api.get(`/app-settings/nav-access/role/${role}`).then(r => r.data.data),

    toggleNavAccess: (id) =>
        api.patch(`/app-settings/nav-access/${id}/toggle`).then(r => r.data.data),

    bulkUpdateNavAccess: (updates) =>
        api.put('/app-settings/nav-access/bulk', { updates }).then(r => r.data.data),

    // ── Component Visibility ──────────────────────────────
    getComponents: () =>
        api.get('/app-settings/components').then(r => r.data.data),

    getComponentsByNavKey: (navKey) =>
        api.get(`/app-settings/components/${navKey}`).then(r => r.data.data),

    toggleComponent: (id) =>
        api.patch(`/app-settings/components/${id}/toggle`).then(r => r.data.data),

    bulkUpdateComponents: (updates) =>
        api.put('/app-settings/components/bulk', { updates }).then(r => r.data.data),

    // ── Notification Dots ─────────────────────────────────
    getNotifDots: () =>
        api.get('/app-settings/notif-dots').then(r => r.data.data),

    getNotifDotsPublic: () =>
        api.get('/app-settings/notif-dots/public').then(r => r.data.data),

    toggleNotifDot: (id) =>
        api.patch(`/app-settings/notif-dots/${id}/toggle`).then(r => r.data.data),

    // ── Custom Notifications ───────────────────────────────
    sendNotification: (payload) =>
        api.post('/app-settings/notifications', payload).then(r => r.data.data),

    // ── Seed ──────────────────────────────────────────────
    seed: () =>
        api.post('/app-settings/seed').then(r => r.data),
};
