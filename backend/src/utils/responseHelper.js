'use strict';

const success = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

const created = (res, data = null, message = 'Data berhasil dibuat') => {
    return success(res, data, message, 201);
};

const paginate = (res, data, total, page, limit, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
    });
};

const error = (res, message = 'Terjadi kesalahan', statusCode = 500, errors = null) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Request tidak valid', errors = null) => {
    return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Tidak terautentikasi') => {
    return error(res, message, 401);
};

const forbidden = (res, message = 'Akses ditolak') => {
    return error(res, message, 403);
};

const notFound = (res, message = 'Data tidak ditemukan') => {
    return error(res, message, 404);
};

module.exports = { success, created, paginate, error, badRequest, unauthorized, forbidden, notFound };
