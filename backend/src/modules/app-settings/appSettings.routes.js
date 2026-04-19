'use strict';
const express = require('express');
const router = express.Router();
const svc = require('./appSettings.service');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isSuperAdmin } = require('../../middlewares/rbac.middleware');
const appEmitter = require('../../utils/eventEmitter');
const { Notification } = require('../../models');

// Helper to notify clients
const notifyClients = async (message, target_role = 'all') => {
    try {
        const notif = await Notification.create({ title: 'System Update', message, type: 'admin_update', target_role });
        appEmitter.emit('app_settings_changed', notif);
    } catch(e) {}
};

// ═══════════════════════════════════════════════════════════════
// SSE STREAM
// ═══════════════════════════════════════════════════════════════
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onChange = (data) => {
        res.write(`event: settings_changed\ndata: ${JSON.stringify(data || {})}\n\n`);
    };

    appEmitter.on('app_settings_changed', onChange);

    req.on('close', () => {
        appEmitter.off('app_settings_changed', onChange);
    });
});

// ═══════════════════════════════════════════════════════════════
// SEED — Auto-seed default configs (dipanggil saat startup)
// ═══════════════════════════════════════════════════════════════
router.post('/seed', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        await svc.seedAll();
        R.success(res, null, 'Seed app settings berhasil');
    } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// NAV ACCESS
// ═══════════════════════════════════════════════════════════════

// GET semua nav access (superadmin panel)
router.get('/nav-access', authenticate, isSuperAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getAllNavAccess()); } catch (e) { next(e); }
});

// GET nav access per role (untuk sidebar — semua user bisa akses milik role-nya)
router.get('/nav-access/role/:role', authenticate, async (req, res, next) => {
    try {
        // User hanya bisa query role sendiri, kecuali superadmin
        if (req.user.role !== 'superadmin' && req.user.role !== req.params.role) {
            return R.forbidden(res, 'Anda hanya bisa mengakses konfigurasi role Anda sendiri');
        }
        R.success(res, await svc.getNavAccessByRole(req.params.role));
    } catch (e) { next(e); }
});

// PATCH toggle visibility single nav access
router.patch('/nav-access/:id/toggle', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.toggleNavAccess(req.params.id, req.user.id);
        const action = result.is_visible ? 'diberikan' : 'dicabut';
        await notifyClients(`Akses ke halaman ${result.nav_label} telah ${action}.`, result.role);
        R.success(res, result, 'Nav visibility diubah');
    } catch (e) { next(e); }
});

// PUT bulk update nav access
router.put('/nav-access/bulk', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.bulkUpdateNavAccess(req.body.updates, req.user.id);
        await notifyClients('Konfigurasi navigasi telah diperbarui secara massal');
        R.success(res, result, 'Nav access diperbarui');
    } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// COMPONENT VISIBILITY
// ═══════════════════════════════════════════════════════════════

// GET semua component visibility (superadmin panel)
router.get('/components', authenticate, isSuperAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getAllComponents()); } catch (e) { next(e); }
});

// GET components per nav key (untuk halaman — semua user)
router.get('/components/:navKey', authenticate, async (req, res, next) => {
    try { R.success(res, await svc.getComponentsByNavKey(req.params.navKey)); } catch (e) { next(e); }
});

// PATCH toggle component visibility
router.patch('/components/:id/toggle', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.toggleComponent(req.params.id, req.user.id);
        const action = result.is_visible ? 'ditampilkan' : 'disembunyikan';
        await notifyClients(`Komponen ${result.component_label} telah ${action}.`, 'all');
        R.success(res, result, 'Component visibility diubah');
    } catch (e) { next(e); }
});

// PUT bulk update component visibility
router.put('/components/bulk', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.bulkUpdateComponents(req.body.updates, req.user.id);
        await notifyClients('Konfigurasi komponen telah diperbarui secara massal');
        R.success(res, result, 'Component visibility diperbarui');
    } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION DOTS
// ═══════════════════════════════════════════════════════════════

// GET semua notif dot configs (superadmin panel)
router.get('/notif-dots', authenticate, isSuperAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getAllNotifDots()); } catch (e) { next(e); }
});

// GET notif dots (public — untuk sidebar semua role)
router.get('/notif-dots/public', authenticate, async (req, res, next) => {
    try { R.success(res, await svc.getNotifDotsPublic()); } catch (e) { next(e); }
});

// PATCH toggle notif dot
router.patch('/notif-dots/:id/toggle', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.toggleNotifDot(req.params.id, req.user.id);
        await notifyClients('Update konfigurasi indikator notifikasi.');
        R.success(res, result, 'Notification dot diubah');
    } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM SYSTEM MESSAGES
// ═══════════════════════════════════════════════════════════════
router.post('/notifications', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const { title, message, target_role, type } = req.body;
        if (!title || !message) {
            return R.error(res, 'Title and message are required', 400);
        }
        const notif = await Notification.create({
            title,
            message,
            type: type || 'system',
            target_role: target_role || 'all'
        });
        
        // Broadcast
        appEmitter.emit('app_settings_changed', notif);
        
        R.success(res, notif, 'Notification sent.');
    } catch (e) { next(e); }
});

module.exports = router;
