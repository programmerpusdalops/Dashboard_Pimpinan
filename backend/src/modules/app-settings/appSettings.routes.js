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

const requireExactRole = (role) => (req, res, next) => {
    if (!req.user) return R.unauthorized(res);
    if (req.user.role !== role) {
        return R.forbidden(res, 'Role Anda tidak memiliki izin untuk aksi ini');
    }
    next();
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
// SYSTEM STATUS
router.get('/statuses/public', authenticate, async (req, res, next) => {
    try {
        R.success(res, await svc.getPublicSystemStatuses());
    } catch (e) { next(e); }
});

router.patch('/statuses/current/:id', authenticate, requireExactRole('pimpinan'), async (req, res, next) => {
    try {
        const result = await svc.setCurrentSystemStatus(req.params.id, req.user.id);
        appEmitter.emit('app_settings_changed', { type: 'system_status_changed', id: result.id });
        R.success(res, result, 'Status sistem diperbarui');
    } catch (e) { next(e); }
});

router.get('/statuses', authenticate, requireExactRole('superadmin'), async (req, res, next) => {
    try {
        R.success(res, await svc.getAllSystemStatuses());
    } catch (e) { next(e); }
});

router.post('/statuses', authenticate, requireExactRole('superadmin'), async (req, res, next) => {
    try {
        const created = await svc.createSystemStatus(req.body, req.user.id);
        appEmitter.emit('app_settings_changed', { type: 'system_status_created', id: created.id });
        R.success(res, created, 'Status sistem dibuat');
    } catch (e) { next(e); }
});

router.put('/statuses/:id', authenticate, requireExactRole('superadmin'), async (req, res, next) => {
    try {
        const updated = await svc.updateSystemStatus(req.params.id, req.body, req.user.id);
        appEmitter.emit('app_settings_changed', { type: 'system_status_updated', id: updated.id });
        R.success(res, updated, 'Status sistem diperbarui');
    } catch (e) { next(e); }
});

router.delete('/statuses/:id', authenticate, requireExactRole('superadmin'), async (req, res, next) => {
    try {
        const result = await svc.deleteSystemStatus(req.params.id);
        appEmitter.emit('app_settings_changed', { type: 'system_status_deleted', id: result.id });
        R.success(res, result, 'Status sistem dihapus');
    } catch (e) { next(e); }
});

// CUSTOM SYSTEM MESSAGES
// ═══════════════════════════════════════════════════════════════
// GET list notifications (superadmin panel)
router.get('/notifications', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
        const notifs = await Notification.findAll({
            order: [['createdAt', 'DESC']],
            limit,
        });
        R.success(res, notifs);
    } catch (e) { next(e); }
});

// DELETE bulk notifications (filtered by categories)
router.delete('/notifications/bulk', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const { Op } = require('sequelize');
        const body = req.body || {};
        const targetRoles = Array.isArray(body.target_roles) ? body.target_roles.filter(Boolean) : [];
        const types = Array.isArray(body.types) ? body.types.filter(Boolean) : [];
        const titles = Array.isArray(body.titles) ? body.titles.filter(Boolean) : [];

        const where = {};
        if (targetRoles.length) where.target_role = { [Op.in]: targetRoles };
        if (types.length) where.type = { [Op.in]: types };
        if (titles.length) where.title = { [Op.in]: titles };

        if (!Object.keys(where).length) {
            return R.error(res, 'Pilih minimal 1 kategori untuk bulk delete', 400);
        }

        const deletedCount = await Notification.destroy({ where });
        appEmitter.emit('app_settings_changed', { bulk_deleted: true });
        R.success(res, { deletedCount }, 'Bulk delete berhasil');
    } catch (e) { next(e); }
});

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

// PUT update notification
router.put('/notifications/:id', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const notif = await Notification.findByPk(req.params.id);
        if (!notif) return R.error(res, 'Notification tidak ditemukan', 404);

        const { title, message, target_role, type } = req.body;
        await notif.update({
            title: title !== undefined ? title : notif.title,
            message: message !== undefined ? message : notif.message,
            target_role: target_role !== undefined ? target_role : notif.target_role,
            type: type !== undefined ? type : notif.type,
        });

        await notifyClients('System message diperbarui.', 'all');
        appEmitter.emit('app_settings_changed', notif);
        R.success(res, notif, 'Notification updated.');
    } catch (e) { next(e); }
});

// DELETE notification
router.delete('/notifications/:id', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const notif = await Notification.findByPk(req.params.id);
        if (!notif) return R.error(res, 'Notification tidak ditemukan', 404);
        await notif.destroy();

        appEmitter.emit('app_settings_changed', { id: req.params.id, deleted: true });
        R.success(res, null, 'Notification deleted.');
    } catch (e) { next(e); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PAGE BANNERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// GET semua banners (superadmin panel)
router.get('/banners', authenticate, isSuperAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getAllBanners()); } catch (e) { next(e); }
});

// GET banners untuk halaman saat ini (semua user; filter by role + path)
router.get('/banners/page', authenticate, async (req, res, next) => {
    try {
        const path = req.query.path || '/';
        R.success(res, await svc.getBannersForPath(path, req.user.role));
    } catch (e) { next(e); }
});

// POST create banner
router.post('/banners', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const created = await svc.createBanner(req.body, req.user.id);
        await notifyClients(`Banner halaman (${created.page_path}) diperbarui.`, 'all');
        R.success(res, created, 'Banner dibuat');
    } catch (e) { next(e); }
});

// PUT update banner
router.put('/banners/:id', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const updated = await svc.updateBanner(req.params.id, req.body, req.user.id);
        await notifyClients(`Banner halaman (${updated.page_path}) diperbarui.`, 'all');
        R.success(res, updated, 'Banner diperbarui');
    } catch (e) { next(e); }
});

// PATCH toggle active banner
router.patch('/banners/:id/toggle', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        const result = await svc.toggleBanner(req.params.id, req.user.id);
        const action = result.is_active ? 'diaktifkan' : 'dinonaktifkan';
        await notifyClients(`Banner halaman telah ${action}.`, 'all');
        R.success(res, result, 'Banner ditoggle');
    } catch (e) { next(e); }
});

// DELETE banner
router.delete('/banners/:id', authenticate, isSuperAdmin, async (req, res, next) => {
    try {
        await svc.deleteBanner(req.params.id);
        await notifyClients('Banner halaman dihapus.', 'all');
        R.success(res, null, 'Banner dihapus');
    } catch (e) { next(e); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NAV PAGES (dropdown helper)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

router.get('/pages', authenticate, isSuperAdmin, async (req, res, next) => {
    try { R.success(res, await svc.getNavPages()); } catch (e) { next(e); }
});

module.exports = router;
