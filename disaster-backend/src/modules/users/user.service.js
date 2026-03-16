'use strict';
const bcrypt = require('bcryptjs');
const { User } = require('../../models');

const SAFE_ATTRIBUTES = { exclude: ['password_hash', 'refresh_token'] };

const getAll = async ({ page = 1, limit = 20, role, is_active } = {}) => {
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

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
    return user;
};

const create = async (data) => {
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
    await user.destroy();
};

const toggleActive = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    await user.update({ is_active: !user.is_active });
    return user.reload({ attributes: SAFE_ATTRIBUTES });
};

module.exports = { getAll, getById, create, update, remove, toggleActive };

