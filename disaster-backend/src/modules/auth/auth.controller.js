'use strict';
const authService = require('./auth.service');
const R = require('../../utils/responseHelper');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.login(email, password);
        return R.success(res, data, 'Login berhasil');
    } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
    try {
        // Front-end mengirim refreshToken di body (bukan cookie) untuk simplicity
        const { refreshToken } = req.body;
        const data = await authService.refreshTokens(refreshToken);
        return R.success(res, data, 'Token berhasil diperbarui');
    } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.id);
        return R.success(res, user);
    } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        await authService.changePassword(req.user.id, old_password, new_password);
        return R.success(res, null, 'Password berhasil diubah. Silakan login ulang.');
    } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);
        return R.success(res, null, 'Logout berhasil');
    } catch (err) { next(err); }
};

module.exports = { login, refresh, getMe, changePassword, logout };

