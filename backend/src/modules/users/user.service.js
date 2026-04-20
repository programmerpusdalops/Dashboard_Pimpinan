'use strict';
const bcrypt = require('bcryptjs');
const { User, ComponentVisibilityConfig } = require('../../models');
const { Op } = require('sequelize');

const SAFE_ATTRIBUTES = { exclude: ['password_hash', 'refresh_token'] };

const ALL_ROLES = ['viewer', 'operator', 'admin', 'superadmin', 'pimpinan'];

const assertActorCanUseUsersModule = (actor) => {
    if (!actor) throw { statusCode: 401, message: 'Unauthorized' };
    if (!['admin', 'superadmin'].includes(actor.role)) {
        throw { statusCode: 403, message: 'Role Anda tidak memiliki izin untuk mengakses modul users' };
    }
};

const getAdminUserCrudCaps = async () => {
    // Non-destructive defaults for older DBs that don't have these configs yet.
    const defaults = {
        read: true,
        create: true,
        update: true,
        toggle_active: true,
    };

    const keys = [
        'users_crud:read',
        'users_crud:create',
        'users_crud:update',
        'users_crud:toggle_active',
    ];

    const rows = await ComponentVisibilityConfig.findAll({
        where: { nav_key: 'admin', component_key: keys },
        attributes: ['component_key', 'is_visible'],
    });

    if (!rows || rows.length === 0) return defaults;

    const out = { ...defaults };
    for (const r of rows) {
        const cap = String(r.component_key || '').split(':')[1];
        if (!cap) continue;
        out[cap] = !!r.is_visible;
    }
    return out;
};

const assertCrudAllowedForActor = async (actor, action) => {
    assertActorCanUseUsersModule(actor);
    if (actor.role === 'superadmin') return;
    if (actor.role !== 'admin') throw { statusCode: 403, message: 'Role Anda tidak memiliki izin untuk aksi ini' };

    const caps = await getAdminUserCrudCaps();
    if (!caps[action]) {
        throw { statusCode: 403, message: `Aksi users:${action} dinonaktifkan oleh superadmin` };
    }
};

const getAdminAllowedRolesFromConfig = async () => {
    // Using ComponentVisibilityConfig as the source of truth for admin-page role options.
    // If configs are missing (older DB), fall back to safe defaults.
    const defaults = ['viewer', 'operator', 'admin'];

    const rows = await ComponentVisibilityConfig.findAll({
        where: {
            nav_key: 'admin',
            component_key: { [Op.like]: 'users_allowed_role:%' },
        },
        attributes: ['component_key', 'is_visible'],
    });

    if (!rows || rows.length === 0) return defaults;

    const allowed = [];
    for (const r of rows) {
        const role = String(r.component_key || '').split(':')[1];
        if (!role) continue;
        if (!ALL_ROLES.includes(role)) continue;
        if (r.is_visible) allowed.push(role);
    }

    // Ensure we never return an empty set (would lock admins out of user creation)
    return allowed.length > 0 ? allowed : defaults;
};

const assertRoleAllowedForActor = async (actor, targetRole) => {
    assertActorCanUseUsersModule(actor);
    if (!targetRole) return;
    if (!ALL_ROLES.includes(targetRole)) {
        throw { statusCode: 400, message: 'Role tidak valid' };
    }

    // Superadmin bypasses admin-page role toggles (absolute access)
    if (actor?.role === 'superadmin') return;

    // Admin must follow role toggles from app-settings; other roles shouldn't hit this module.
    if (actor?.role === 'admin') {
        const allowed = await getAdminAllowedRolesFromConfig();
        if (!allowed.includes(targetRole)) {
            throw { statusCode: 403, message: `Admin tidak diizinkan menambahkan role "${targetRole}"` };
        }
        return;
    }

    throw { statusCode: 403, message: 'Role Anda tidak memiliki izin untuk aksi ini' };
};

const getAll = async ({ page = 1, limit = 20, role, is_active, include_superadmin = false } = {}, actor = null) => {
    assertActorCanUseUsersModule(actor);
    await assertCrudAllowedForActor(actor, 'read');
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const canSeeSuperadmin = actor?.role === 'superadmin';
    if (!include_superadmin || !canSeeSuperadmin) {
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

const getById = async (id, actor = null) => {
    assertActorCanUseUsersModule(actor);
    await assertCrudAllowedForActor(actor, 'read');
    const user = await User.findByPk(id, { attributes: SAFE_ATTRIBUTES });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    if (user.role === 'superadmin' && actor?.role !== 'superadmin') {
        throw { statusCode: 403, message: 'Akses ke akun superadmin dibatasi' };
    }
    return user;
};

const create = async (data, actor = null) => {
    await assertCrudAllowedForActor(actor, 'create');
    await assertRoleAllowedForActor(actor, data.role);
    const exists = await User.findOne({ where: { email: data.email } });
    if (exists) throw { statusCode: 400, message: 'Email sudah terdaftar' };
    const hash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, password_hash: hash });
    // Return tanpa password_hash
    const { password_hash: _, refresh_token: __, ...safeUser } = user.toJSON();
    return safeUser;
};

const update = async (id, data, actor = null) => {
    assertActorCanUseUsersModule(actor);
    await assertCrudAllowedForActor(actor, 'update');
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };

    if (user.role === 'superadmin' && actor?.role !== 'superadmin') {
        throw { statusCode: 403, message: 'Tidak dapat mengubah akun superadmin dari modul ini' };
    }

    if (data.role && data.role !== user.role) {
        await assertRoleAllowedForActor(actor, data.role);

        // Prevent removing the last superadmin (demote)
        if (user.role === 'superadmin' && actor?.role === 'superadmin' && data.role !== 'superadmin') {
            const remaining = await User.count({ where: { role: 'superadmin', id: { [Op.ne]: user.id } } });
            if (remaining <= 0) {
                throw { statusCode: 403, message: 'Tidak dapat menurunkan role superadmin terakhir' };
            }
        }
    }

    if (data.password) {
        data.password_hash = await bcrypt.hash(data.password, 12);
        delete data.password;
    }
    await user.update(data);
    return user.reload({ attributes: SAFE_ATTRIBUTES });
};

const remove = async (id, actor = null) => {
    assertActorCanUseUsersModule(actor);
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };

    if (user.role === 'superadmin') {
        if (actor?.role !== 'superadmin') {
            throw { statusCode: 403, message: 'Tidak dapat menghapus akun superadmin dari modul ini' };
        }
        if (actor?.id && user.id === actor.id) {
            throw { statusCode: 403, message: 'Tidak dapat menghapus akun yang sedang digunakan' };
        }
        const remaining = await User.count({ where: { role: 'superadmin', id: { [Op.ne]: user.id } } });
        if (remaining <= 0) {
            throw { statusCode: 403, message: 'Tidak dapat menghapus superadmin terakhir' };
        }
    }
    await user.destroy();
};

const toggleActive = async (id, actor = null) => {
    assertActorCanUseUsersModule(actor);
    await assertCrudAllowedForActor(actor, 'toggle_active');
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };

    if (user.role === 'superadmin') {
        if (actor?.role !== 'superadmin') {
            throw { statusCode: 403, message: 'Tidak dapat menonaktifkan akun superadmin dari modul ini' };
        }
        if (actor?.id && user.id === actor.id) {
            throw { statusCode: 403, message: 'Tidak dapat menonaktifkan akun yang sedang digunakan' };
        }
        if (user.is_active) {
            const remainingActive = await User.count({
                where: { role: 'superadmin', is_active: true, id: { [Op.ne]: user.id } },
            });
            if (remainingActive <= 0) {
                throw { statusCode: 403, message: 'Tidak dapat menonaktifkan superadmin aktif terakhir' };
            }
        }
    }
    await user.update({ is_active: !user.is_active });
    return user.reload({ attributes: SAFE_ATTRIBUTES });
};

module.exports = { getAll, getById, create, update, remove, toggleActive };

