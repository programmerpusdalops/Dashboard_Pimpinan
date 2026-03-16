'use strict';
const R = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`, err.stack);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors.map((e) => e.message);
        return R.badRequest(res, 'Validasi data gagal', messages);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return R.unauthorized(res, 'Token tidak valid');
    }
    if (err.name === 'TokenExpiredError') {
        return R.unauthorized(res, 'Token sudah kadaluarsa');
    }

    // Custom app errors
    if (err.statusCode) {
        return R.error(res, err.message, err.statusCode);
    }

    return R.error(res, 'Terjadi kesalahan internal pada server', 500);
};

const notFound = (req, res, next) => {
    R.error(res, `Route ${req.originalUrl} tidak ditemukan`, 404);
};

module.exports = { errorHandler, notFound };
