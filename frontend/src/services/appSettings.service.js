/**
 * services/appSettings.service.js
 * API calls untuk modul App Settings — nav access, component visibility, notif dots
 */
import api from '../lib/axios';

export const appSettingsService = {
    // Seed (superadmin only) — safe/idempotent seeding on backend
    seed: () =>
        api.post('/app-settings/seed').then(r => r.data.data),

    // Nav Access
    getNavAccess: () =>
        api.get('/app-settings/nav-access').then(r => r.data.data),

    getNavAccessByRole: (role) =>
        api.get(`/app-settings/nav-access/role/${role}`).then(r => r.data.data),

    toggleNavAccess: (id) =>
        api.patch(`/app-settings/nav-access/${id}/toggle`).then(r => r.data.data),

    bulkUpdateNavAccess: (updates) =>
        api.put('/app-settings/nav-access/bulk', { updates }).then(r => r.data.data),

    // Component Visibility
    getComponents: () =>
        api.get('/app-settings/components').then(r => r.data.data),

    getComponentsByNavKey: (navKey) =>
        api.get(`/app-settings/components/${navKey}`).then(r => r.data.data),

    toggleComponent: (id) =>
        api.patch(`/app-settings/components/${id}/toggle`).then(r => r.data.data),

    bulkUpdateComponents: (updates) =>
        api.put('/app-settings/components/bulk', { updates }).then(r => r.data.data),

    // Notification Dots
    getNotifDots: () =>
        api.get('/app-settings/notif-dots').then(r => r.data.data),

    getNotifDotsPublic: () =>
        api.get('/app-settings/notif-dots/public').then(r => r.data.data),

    toggleNotifDot: (id) =>
        api.patch(`/app-settings/notif-dots/${id}/toggle`).then(r => r.data.data),

    // System status
    getSystemStatusesPublic: () =>
        api.get('/app-settings/statuses/public').then(r => r.data.data),

    getSystemStatuses: () =>
        api.get('/app-settings/statuses').then(r => r.data.data),

    setCurrentSystemStatus: (id) =>
        api.patch(`/app-settings/statuses/current/${id}`).then(r => r.data.data),

    createSystemStatus: (payload) =>
        api.post('/app-settings/statuses', payload).then(r => r.data.data),

    updateSystemStatus: ({ id, payload }) =>
        api.put(`/app-settings/statuses/${id}`, payload).then(r => r.data.data),

    deleteSystemStatus: (id) =>
        api.delete(`/app-settings/statuses/${id}`).then(r => r.data.data),

    // Custom Notifications
    sendNotification: (payload) =>
        api.post('/app-settings/notifications', payload).then(r => r.data.data),

    getSystemNotifications: (limit = 50) =>
        api.get('/app-settings/notifications', { params: { limit } }).then(r => r.data.data),

    updateSystemNotification: ({ id, payload }) =>
        api.put(`/app-settings/notifications/${id}`, payload).then(r => r.data.data),

    deleteSystemNotification: (id) =>
        api.delete(`/app-settings/notifications/${id}`).then(r => r.data.data),

    bulkDeleteSystemNotifications: (payload) =>
        api.delete('/app-settings/notifications/bulk', { data: payload }).then(r => r.data.data),

    // Page Banners
    getBanners: () =>
        api.get('/app-settings/banners').then(r => r.data.data),

    getBannersByPath: (path) =>
        api.get('/app-settings/banners/page', { params: { path } }).then(r => r.data.data),

    createBanner: (payload) =>
        api.post('/app-settings/banners', payload).then(r => r.data.data),

    updateBanner: ({ id, payload }) =>
        api.put(`/app-settings/banners/${id}`, payload).then(r => r.data.data),

    toggleBanner: (id) =>
        api.patch(`/app-settings/banners/${id}/toggle`).then(r => r.data.data),

    deleteBanner: (id) =>
        api.delete(`/app-settings/banners/${id}`).then(r => r.data.data),

    // Nav Pages (dropdown helper)
    getNavPages: () =>
        api.get('/app-settings/pages').then(r => r.data.data),

    // Seed
    seed: () =>
        api.post('/app-settings/seed').then(r => r.data),
};
