'use strict';
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { Op } = require('sequelize');

const SAFE_ATTRIBUTES = { exclude: ['password_hash', 'refresh_token'] };

const getAll = async ({ page = 1, limit = 20, role, is_active, include_superadmin = false } = {}) => {
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (!include_superadmin) {
        where.role = where.role ? where.role : { [Op.ne]: 'superadmin' };
        if (where.role && typeof where.role === 'string' && where.role === 'superadmin') {
            // explicit request, but blocked by default
            where.role = { [Op.ne]: 'superadmin' };
        }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    return User.findAndCountAll({
        where,
        attributes: SAFE_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
    });
};

const getById = async (id) => {
    const user = await User.findByPk(id, { attributes: SAFE_ATTRIBUTES });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    if (user.role === 'superadmin') throw { statusCode: 403, message: 'Akses ke akun superadmin dibatasi' };
    return user;
};

const create = async (data) => {
    if (data.role === 'superadmin') throw { statusCode: 403, message: 'Tidak dapat membuat akun superadmin dari modul ini' };
    const exists = await User.findOne({ where: { email: data.email } });
    if (exists) throw { statusCode: 400, message: 'Email sudah terdaftar' };
    const hash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, password_hash: hash });
    // Return tanpa password_hash
    const { password_hash: _, refresh_token: __, ...safeUser } = user.toJSON();
    return safeUser;
};

const update = async (id, data) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    if (user.role === 'superadmin') throw { statusCode: 403, message: 'Tidak dapat mengubah akun superadmin dari modul ini' };
    if (data.role === 'superadmin') throw { statusCode: 403, message: 'Tidak dapat menaikkan role menjadi superadmin dari modul ini' };
    if (data.password) {
        data.password_hash = await bcrypt.hash(data.password, 12);
        delete data.password;
    }
    await user.update(data);
    return user.reload({ attributes: SAFE_ATTRIBUTES });
};

const remove = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    if (user.role === 'superadmin') throw { statusCode: 403, message: 'Tidak dapat menghapus akun superadmin dari modul ini' };
    await user.destroy();
};

const toggleActive = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    if (user.role === 'superadmin') throw { statusCode: 403, message: 'Tidak dapat menonaktifkan akun superadmin dari modul ini' };
    await user.update({ is_active: !user.is_active });
    return user.reload({ attributes: SAFE_ATTRIBUTES });
};

module.exports = { getAll, getById, create, update, remove, toggleActive };

