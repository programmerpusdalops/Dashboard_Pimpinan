'use strict';
const R = require('../utils/responseHelper');

const ROLE_HIERARCHY = {
    viewer: 1,
    operator: 2,
    admin: 3,
    superadmin: 4,
    pimpinan: 5,
};

// Minimal role yang dibutuhkan
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return R.unauthorized(res);
        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const requiredLevel = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] || 99));
        if (userLevel < requiredLevel) {
            return R.forbidden(res, 'Role Anda tidak memiliki izin untuk aksi ini');
        }
        next();
    };
};

// Alias helpers
const isPimpinan = authorize('pimpinan');
const isAdmin = authorize('admin', 'superadmin', 'pimpinan');
const isSuperAdmin = authorize('superadmin', 'pimpinan');
const isOperator = authorize('operator', 'admin', 'superadmin', 'pimpinan');

module.exports = { authorize, isPimpinan, isAdmin, isSuperAdmin, isOperator };
