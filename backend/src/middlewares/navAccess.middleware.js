'use strict';
const { NavAccessConfig } = require('../models');
const R = require('../utils/responseHelper');

/**
 * Middleware: checkNavAccess(navKey)
 *
 * Memeriksa apakah role user saat ini punya akses ke nav_key yang diberikan.
 * Jika is_visible = false di tabel nav_access_configs, akses ditolak.
 * Jika config belum ada (tabel kosong/belum seed), default allow.
 *
 * Usage:
 *   router.get('/', authenticate, checkNavAccess('logistics'), ...)
 */
const checkNavAccess = (navKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user) return R.unauthorized(res);

            const config = await NavAccessConfig.findOne({
                where: { role: req.user.role, nav_key: navKey },
                attributes: ['is_visible'],
            });

            // Jika config belum exist, default allow (backward compatible)
            if (!config) return next();

            if (!config.is_visible) {
                return R.forbidden(res, `Akses ke modul "${navKey}" tidak diizinkan untuk role Anda`);
            }

            next();
        } catch (err) {
            // Jangan block request jika tabel belum ada
            console.warn('⚠️  checkNavAccess error (skipping):', err.message);
            next();
        }
    };
};

module.exports = { checkNavAccess };
