'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const generateTokens = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        opd: user.opd,
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    return { accessToken, refreshToken };
};

const login = async (email, password) => {
    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user) throw { statusCode: 401, message: 'Email atau password salah' };

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw { statusCode: 401, message: 'Email atau password salah' };

    const { accessToken, refreshToken } = generateTokens(user);

    // Simpan refresh token di DB (server-side invalidation)
    await user.update({ last_login: new Date(), refresh_token: refreshToken });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            opd: user.opd,
        },
    };
};

const refreshTokens = async (token) => {
    if (!token) throw { statusCode: 401, message: 'Refresh token tidak ditemukan' };

    // Verifikasi signature & expiry
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
        throw { statusCode: 401, message: 'Refresh token tidak valid atau sudah kadaluarsa' };
    }

    // Cek apakah token cocok dengan yang tersimpan di DB (cegah reuse setelah logout)
    const user = await User.findOne({ where: { id: decoded.id, is_active: true } });
    if (!user || user.refresh_token !== token) {
        throw { statusCode: 401, message: 'Refresh token sudah tidak berlaku. Silakan login ulang.' };
    }

    // Rotate: buat token set baru, hapus yang lama
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    await user.update({ refresh_token: newRefreshToken });

    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            opd: user.opd,
        },
    };
};

const logout = async (userId) => {
    // Hapus refresh token dari DB → token lama jadi tidak valid meski belum expire
    await User.update({ refresh_token: null }, { where: { id: userId } });
};

const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash', 'refresh_token'] },
    });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    return user;
};

const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) throw { statusCode: 400, message: 'Password lama tidak sesuai' };

    const hash = await bcrypt.hash(newPassword, 12);
    // Setelah ganti password, invalidasi semua refresh token (paksa login ulang)
    await user.update({ password_hash: hash, refresh_token: null });
};

module.exports = { login, refreshTokens, logout, getProfile, changePassword };

