'use strict';
const jwt = require('jsonwebtoken');
const R = require('../utils/responseHelper');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return R.unauthorized(res, 'Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return R.unauthorized(res, err.name === 'TokenExpiredError' ? 'Token sudah kadaluarsa' : 'Token tidak valid');
    }
};

module.exports = { authenticate };
