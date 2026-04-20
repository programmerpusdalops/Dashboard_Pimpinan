'use strict';
const {
    NavAccessConfig,
    ComponentVisibilityConfig,
    NotificationDotConfig,
    PageBanner,
    SystemStatusConfig,
    User,
} = require('../../models');
const { Op } = require('sequelize');

// ── Default nav items & components (untuk seeding awal) ─────────
const DEFAULT_NAV_ITEMS = [
    { nav_key: 'dashboard', nav_label: 'Dasbor Utama', sort_order: 1 },
    { nav_key: 'map', nav_label: 'Peta Risiko & Dampak', sort_order: 2 },
    { nav_key: 'ops', nav_label: 'Pusat Pengendalian', sort_order: 3 },
    { nav_key: 'logistics', nav_label: 'Logistik & Peralatan', sort_order: 4 },
    { nav_key: 'refugees', nav_label: 'Data Pengungsi', sort_order: 5 },
    { nav_key: 'funding', nav_label: 'Anggaran & Pendanaan', sort_order: 6 },
    { nav_key: 'admin', nav_label: 'Pengaturan Master', sort_order: 7 },
    { nav_key: 'instruksi', nav_label: 'Instruksi Pimpinan', sort_order: 8 },
    { nav_key: 'app-settings', nav_label: 'App Settings', sort_order: 9 },
];

const ALL_ROLES = ['superadmin', 'admin', 'operator', 'viewer', 'pimpinan'];

const DEFAULT_COMPONENTS = [
    // Dashboard
    { nav_key: 'dashboard', component_key: 'kpi_cards', component_label: 'KPI Cards', sort_order: 1 },
    { nav_key: 'dashboard', component_key: 'mini_map', component_label: 'Mini Map', sort_order: 2 },
    { nav_key: 'dashboard', component_key: 'top_priorities', component_label: 'Top Prioritas', sort_order: 3 },
    { nav_key: 'dashboard', component_key: 'decision_log', component_label: 'Log Keputusan', sort_order: 4 },
    { nav_key: 'dashboard', component_key: 'charts', component_label: 'Grafik Statistik', sort_order: 5 },
    { nav_key: 'dashboard', component_key: 'budget_progress', component_label: 'Progress Anggaran', sort_order: 6 },
    // Map
    { nav_key: 'map', component_key: 'map_sidebar', component_label: 'Sidebar Daftar Titik', sort_order: 1 },
    { nav_key: 'map', component_key: 'map_legend', component_label: 'Legenda', sort_order: 2 },
    { nav_key: 'map', component_key: 'map_stats_bar', component_label: 'Stats Bar', sort_order: 3 },
    { nav_key: 'map', component_key: 'map_detail_panel', component_label: 'Detail Panel', sort_order: 4 },
    // Ops
    { nav_key: 'ops', component_key: 'kanban_board', component_label: 'Kanban Board', sort_order: 1 },
    { nav_key: 'ops', component_key: 'task_form', component_label: 'Form Tambah Task', sort_order: 2 },
    { nav_key: 'ops', component_key: 'posko_info', component_label: 'Info Ketua Posko', sort_order: 3 },
    { nav_key: 'ops', component_key: 'decision_timeline', component_label: 'Timeline Keputusan', sort_order: 4 },
    // Logistics
    { nav_key: 'logistics', component_key: 'logistics_kpi', component_label: 'KPI Logistik', sort_order: 1 },
    { nav_key: 'logistics', component_key: 'warehouse_cards', component_label: 'Kartu Gudang', sort_order: 2 },
    { nav_key: 'logistics', component_key: 'shipment_list', component_label: 'Daftar Pengiriman', sort_order: 3 },
    // Refugees
    { nav_key: 'refugees', component_key: 'refugees_kpi', component_label: 'KPI Pengungsi', sort_order: 1 },
    { nav_key: 'refugees', component_key: 'refugees_charts', component_label: 'Grafik Pengungsi', sort_order: 2 },
    { nav_key: 'refugees', component_key: 'shelter_table', component_label: 'Tabel Posko', sort_order: 3 },
    // Funding
    { nav_key: 'funding', component_key: 'funding_kpi', component_label: 'KPI Anggaran', sort_order: 1 },
    { nav_key: 'funding', component_key: 'funding_charts', component_label: 'Grafik & Serapan', sort_order: 2 },
    { nav_key: 'funding', component_key: 'allocation_table', component_label: 'Alokasi Anggaran', sort_order: 3 },
    { nav_key: 'funding', component_key: 'expenditure_table', component_label: 'Realisasi Pengeluaran', sort_order: 4 },
    // Instructions
    { nav_key: 'instruksi', component_key: 'instruksi_stats', component_label: 'Statistik Instruksi', sort_order: 1 },
    { nav_key: 'instruksi', component_key: 'instruksi_filters', component_label: 'Filter Instruksi', sort_order: 2 },
    { nav_key: 'instruksi', component_key: 'instruksi_list', component_label: 'Daftar Instruksi', sort_order: 3 },

    // Admin (Pengaturan Master) — tab visibility + role options for "Tambah User"
    { nav_key: 'admin', component_key: 'tab_users', component_label: 'Tab: User', sort_order: 1 },
    { nav_key: 'admin', component_key: 'tab_events', component_label: 'Tab: Kejadian', sort_order: 2 },
    { nav_key: 'admin', component_key: 'tab_operations', component_label: 'Tab: Operasi', sort_order: 3 },
    { nav_key: 'admin', component_key: 'tab_logistics', component_label: 'Tab: Logistik & Peralatan', sort_order: 4 },
    { nav_key: 'admin', component_key: 'tab_refugees', component_label: 'Tab: Pengungsi', sort_order: 5 },
    { nav_key: 'admin', component_key: 'tab_funding', component_label: 'Tab: Pendanaan', sort_order: 6 },
    { nav_key: 'admin', component_key: 'tab_decisions', component_label: 'Tab: Keputusan', sort_order: 7 },

    // Roles allowed to be created by admin (superadmin always bypasses these toggles)
    { nav_key: 'admin', component_key: 'users_allowed_role:viewer', component_label: 'Tambah User: Role viewer', sort_order: 20, is_visible: true },
    { nav_key: 'admin', component_key: 'users_allowed_role:operator', component_label: 'Tambah User: Role operator', sort_order: 21, is_visible: true },
    { nav_key: 'admin', component_key: 'users_allowed_role:admin', component_label: 'Tambah User: Role admin', sort_order: 22, is_visible: true },
    { nav_key: 'admin', component_key: 'users_allowed_role:superadmin', component_label: 'Tambah User: Role superadmin', sort_order: 23, is_visible: false },
    { nav_key: 'admin', component_key: 'users_allowed_role:pimpinan', component_label: 'Tambah User: Role pimpinan', sort_order: 24, is_visible: false },

    // CRUD capabilities for admin on User module (superadmin always bypasses these toggles)
    { nav_key: 'admin', component_key: 'users_crud:read', component_label: 'Users CRUD: Lihat daftar/detail', sort_order: 30, is_visible: true },
    { nav_key: 'admin', component_key: 'users_crud:create', component_label: 'Users CRUD: Tambah user', sort_order: 31, is_visible: true },
    { nav_key: 'admin', component_key: 'users_crud:update', component_label: 'Users CRUD: Edit user', sort_order: 32, is_visible: true },
    { nav_key: 'admin', component_key: 'users_crud:toggle_active', component_label: 'Users CRUD: Aktif/nonaktif user', sort_order: 33, is_visible: true },
];

const DEFAULT_NOTIF_DOTS = [
    { nav_key: 'dashboard', is_enabled: true },
    { nav_key: 'map', is_enabled: true },
    { nav_key: 'ops', is_enabled: true },
    { nav_key: 'logistics', is_enabled: true },
    { nav_key: 'refugees', is_enabled: true },
    { nav_key: 'funding', is_enabled: true },
    { nav_key: 'instruksi', is_enabled: true },
];

const DEFAULT_SYSTEM_STATUSES = [
    {
        value: 'normal',
        label: 'Normal',
        description: 'Gunakan saat situasi operasional terkendali, tidak ada eskalasi bencana, dan monitoring berjalan rutin.',
        color: '#10b981',
        sort_order: 1,
        is_enabled: true,
        is_current: true,
    },
    {
        value: 'siaga',
        label: 'Siaga',
        description: 'Gunakan saat ada potensi gangguan atau peningkatan risiko yang membutuhkan kesiapan lintas unit dan pemantauan lebih intensif.',
        color: '#f59e0b',
        sort_order: 2,
        is_enabled: true,
        is_current: false,
    },
    {
        value: 'darurat',
        label: 'Darurat',
        description: 'Gunakan saat bencana atau gangguan besar sedang terjadi dan membutuhkan komando cepat, prioritas tinggi, serta respon penuh.',
        color: '#ef4444',
        sort_order: 3,
        is_enabled: true,
        is_current: false,
    },
];

let ensureSystemStatusesReadyPromise = null;

const ensureSystemStatusesReady = async () => {
    if (!ensureSystemStatusesReadyPromise) {
        ensureSystemStatusesReadyPromise = (async () => {
            await SystemStatusConfig.sync();

            const count = await SystemStatusConfig.count();
            if (count === 0) {
                await SystemStatusConfig.bulkCreate(DEFAULT_SYSTEM_STATUSES);
            }

            const enabledStatuses = await SystemStatusConfig.findAll({
                where: { is_enabled: true },
                order: [['sort_order', 'ASC'], ['id', 'ASC']],
            });

            const currentCount = enabledStatuses.filter((item) => item.is_current).length;
            if (enabledStatuses.length > 0 && currentCount !== 1) {
                const fallbackId = enabledStatuses[0].id;
                await SystemStatusConfig.update(
                    { is_current: false },
                    { where: {} },
                );
                await SystemStatusConfig.update(
                    { is_current: true },
                    { where: { id: fallbackId } },
                );
            }
        })().catch((error) => {
            ensureSystemStatusesReadyPromise = null;
            throw error;
        });
    }

    return ensureSystemStatusesReadyPromise;
};

const normalizeStatusValue = (input) => {
    return String(input || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
};

// ═══════════════════════════════════════════════════════════════
// NAV ACCESS
// ═══════════════════════════════════════════════════════════════

/**
 * Seed default nav access configs kalau belum ada
 */
const seedNavAccess = async () => {
    const count = await NavAccessConfig.count();
    if (count > 0) return;

    const records = [];
    for (const role of ALL_ROLES) {
        for (const nav of DEFAULT_NAV_ITEMS) {
            // Default visibility per role
            let is_visible = true;
            if (nav.nav_key === 'admin' && !['admin', 'superadmin'].includes(role)) is_visible = false;
            if (nav.nav_key === 'app-settings' && role !== 'superadmin') is_visible = false;

            records.push({
                role,
                nav_key: nav.nav_key,
                nav_label: nav.nav_label,
                is_visible,
                sort_order: nav.sort_order,
            });
        }
    }
    await NavAccessConfig.bulkCreate(records);
};

/**
 * Seed default component visibility configs kalau belum ada
 */
const seedComponents = async () => {
    const count = await ComponentVisibilityConfig.count();
    if (count > 0) return;
    await ComponentVisibilityConfig.bulkCreate(DEFAULT_COMPONENTS);
};

/**
 * Ensure default component configs exist (idempotent, non-destructive).
 * This allows adding new defaults (e.g. admin page toggles) without requiring table to be empty.
 */
const ensureComponentsReady = async () => {
    const existing = await ComponentVisibilityConfig.findAll({
        attributes: ['nav_key', 'component_key'],
    });
    const existingSet = new Set(existing.map((r) => `${r.nav_key}::${r.component_key}`));

    const missing = DEFAULT_COMPONENTS.filter((c) => !existingSet.has(`${c.nav_key}::${c.component_key}`));
    if (missing.length === 0) return;

    await ComponentVisibilityConfig.bulkCreate(missing);
};

/**
 * Seed default notification dot configs kalau belum ada
 */
const seedNotifDots = async () => {
    const count = await NotificationDotConfig.count();
    if (count > 0) return;
    await NotificationDotConfig.bulkCreate(DEFAULT_NOTIF_DOTS);
};

/**
 * Seed semua sekaligus
 */
const seedAll = async () => {
    // Create new feature table if missing (safe create; no alter)
    try {
        await PageBanner.sync();
    } catch (e) {
        // Don't block server startup if user hasn't migrated yet
        console.warn('⚠️  PageBanner.sync failed:', e.message);
    }

    await seedNavAccess();
    await seedComponents();
    // Add any new default component configs even if table already has data
    await ensureComponentsReady();
    await seedNotifDots();
    await ensureSystemStatusesReady();
};

// ── GET all nav access (superadmin view) ────────────────────
const getAllNavAccess = async () => {
    return NavAccessConfig.findAll({
        order: [['role', 'ASC'], ['sort_order', 'ASC']],
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

// ── GET nav access for a specific role (public — untuk sidebar) ──
const getNavAccessByRole = async (role) => {
    return NavAccessConfig.findAll({
        where: { role },
        order: [['sort_order', 'ASC']],
        attributes: ['nav_key', 'nav_label', 'is_visible', 'sort_order'],
    });
};

// ── TOGGLE nav visibility ───────────────────────────────────
const toggleNavAccess = async (id, userId) => {
    const config = await NavAccessConfig.findByPk(id);
    if (!config) throw { statusCode: 404, message: 'Nav config tidak ditemukan' };
    await config.update({ is_visible: !config.is_visible, updated_by: userId });
    return config.reload({
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

// ── BULK update nav access ──────────────────────────────────
const bulkUpdateNavAccess = async (updates, userId) => {
    // updates = [{ id, is_visible }, ...]
    for (const { id, is_visible } of updates) {
        await NavAccessConfig.update({ is_visible, updated_by: userId }, { where: { id } });
    }
    return getAllNavAccess();
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT VISIBILITY
// ═══════════════════════════════════════════════════════════════

const getAllComponents = async () => {
    return ComponentVisibilityConfig.findAll({
        order: [['nav_key', 'ASC'], ['sort_order', 'ASC']],
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

const getComponentsByNavKey = async (navKey) => {
    return ComponentVisibilityConfig.findAll({
        where: { nav_key: navKey },
        order: [['sort_order', 'ASC']],
        attributes: ['component_key', 'component_label', 'is_visible', 'sort_order'],
    });
};

const toggleComponent = async (id, userId) => {
    const config = await ComponentVisibilityConfig.findByPk(id);
    if (!config) throw { statusCode: 404, message: 'Component config tidak ditemukan' };
    await config.update({ is_visible: !config.is_visible, updated_by: userId });
    return config.reload({
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

const bulkUpdateComponents = async (updates, userId) => {
    for (const { id, is_visible } of updates) {
        await ComponentVisibilityConfig.update({ is_visible, updated_by: userId }, { where: { id } });
    }
    return getAllComponents();
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION DOT
// ═══════════════════════════════════════════════════════════════

const getAllNotifDots = async () => {
    return NotificationDotConfig.findAll({
        order: [['nav_key', 'ASC']],
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

const getNotifDotsPublic = async () => {
    return NotificationDotConfig.findAll({
        attributes: ['nav_key', 'is_enabled'],
    });
};

const toggleNotifDot = async (id, userId) => {
    const config = await NotificationDotConfig.findByPk(id);
    if (!config) throw { statusCode: 404, message: 'Notif dot config tidak ditemukan' };
    await config.update({ is_enabled: !config.is_enabled, updated_by: userId });
    return config.reload({
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

// SYSTEM STATUS

const getPublicSystemStatuses = async () => {
    await ensureSystemStatusesReady();

    const statuses = await SystemStatusConfig.findAll({
        where: { is_enabled: true },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
        attributes: ['id', 'value', 'label', 'description', 'color', 'sort_order', 'is_current'],
    });

    const currentStatus = statuses.find((item) => item.is_current) || statuses[0] || null;
    return { statuses, currentStatus };
};

const getAllSystemStatuses = async () => {
    await ensureSystemStatusesReady();

    return SystemStatusConfig.findAll({
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'updater', attributes: ['id', 'name'] },
        ],
    });
};

const setCurrentSystemStatus = async (id, userId) => {
    await ensureSystemStatusesReady();

    const target = await SystemStatusConfig.findByPk(id);
    if (!target) throw { statusCode: 404, message: 'Status tidak ditemukan' };
    if (!target.is_enabled) throw { statusCode: 400, message: 'Status nonaktif tidak dapat diterapkan' };

    await SystemStatusConfig.update(
        { is_current: false, updated_by: userId },
        { where: { is_current: true } },
    );

    await target.update({ is_current: true, updated_by: userId });

    return target.reload({
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

const createSystemStatus = async (payload, userId) => {
    await ensureSystemStatusesReady();

    const value = normalizeStatusValue(payload.value || payload.label);
    if (!value) throw { statusCode: 400, message: 'Value status wajib diisi' };
    if (!payload.label?.trim()) throw { statusCode: 400, message: 'Label status wajib diisi' };
    if (!payload.description?.trim()) throw { statusCode: 400, message: 'Keterangan status wajib diisi' };

    const existing = await SystemStatusConfig.findOne({ where: { value } });
    if (existing) throw { statusCode: 400, message: 'Value status sudah digunakan' };

    const hasCurrent = await SystemStatusConfig.count({ where: { is_current: true, is_enabled: true } });

    const created = await SystemStatusConfig.create({
        value,
        label: payload.label.trim(),
        description: payload.description.trim(),
        color: payload.color || '#f59e0b',
        sort_order: Number(payload.sort_order) || 0,
        is_enabled: payload.is_enabled !== undefined ? !!payload.is_enabled : true,
        is_current: hasCurrent === 0 && (payload.is_enabled !== false),
        created_by: userId,
        updated_by: userId,
    });

    return created.reload({
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'updater', attributes: ['id', 'name'] },
        ],
    });
};

const updateSystemStatus = async (id, payload, userId) => {
    await ensureSystemStatusesReady();

    const status = await SystemStatusConfig.findByPk(id);
    if (!status) throw { statusCode: 404, message: 'Status tidak ditemukan' };

    if (payload.label !== undefined && !payload.label.trim()) {
        throw { statusCode: 400, message: 'Label status wajib diisi' };
    }
    if (payload.description !== undefined && !payload.description.trim()) {
        throw { statusCode: 400, message: 'Keterangan status wajib diisi' };
    }

    const nextValue = payload.value !== undefined || payload.label !== undefined
        ? normalizeStatusValue(payload.value || payload.label || status.value)
        : status.value;

    if (!nextValue) throw { statusCode: 400, message: 'Value status wajib diisi' };

    const existing = await SystemStatusConfig.findOne({
        where: {
            value: nextValue,
            id: { [Op.ne]: id },
        },
    });
    if (existing) throw { statusCode: 400, message: 'Value status sudah digunakan' };

    const nextIsEnabled = payload.is_enabled !== undefined ? !!payload.is_enabled : status.is_enabled;

    if (!nextIsEnabled && status.is_current) {
        const fallback = await SystemStatusConfig.findOne({
            where: {
                id: { [Op.ne]: id },
                is_enabled: true,
            },
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
        });

        if (!fallback) {
            throw { statusCode: 400, message: 'Minimal harus ada satu status aktif' };
        }

        await fallback.update({ is_current: true, updated_by: userId });
    }

    await status.update({
        value: nextValue,
        label: payload.label !== undefined ? payload.label.trim() : status.label,
        description: payload.description !== undefined ? payload.description.trim() : status.description,
        color: payload.color !== undefined ? payload.color : status.color,
        sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) || 0 : status.sort_order,
        is_enabled: nextIsEnabled,
        is_current: nextIsEnabled ? status.is_current : false,
        updated_by: userId,
    });

    return status.reload({
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'updater', attributes: ['id', 'name'] },
        ],
    });
};

const deleteSystemStatus = async (id) => {
    await ensureSystemStatusesReady();

    const status = await SystemStatusConfig.findByPk(id);
    if (!status) throw { statusCode: 404, message: 'Status tidak ditemukan' };

    const total = await SystemStatusConfig.count();
    if (total <= 1) {
        throw { statusCode: 400, message: 'Minimal harus ada satu status' };
    }

    const wasCurrent = status.is_current;
    await status.destroy();

    if (wasCurrent) {
        const fallback = await SystemStatusConfig.findOne({
            where: { is_enabled: true },
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
        });

        if (fallback) {
            await SystemStatusConfig.update({ is_current: false }, { where: {} });
            await fallback.update({ is_current: true });
        }
    }

    return { id };
};

// ═════════════════════════════════════════════════════════════════════════════
// PAGE BANNERS
// ═════════════════════════════════════════════════════════════════════════════

const getAllBanners = async () => {
    try {
        return PageBanner.findAll({
            order: [['page_path', 'ASC'], ['sort_order', 'ASC'], ['id', 'ASC']],
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'updater', attributes: ['id', 'name'] },
            ],
        });
    } catch (e) {
        // If table doesn't exist yet, fail gracefully (frontend will show empty)
        console.warn('⚠️  getAllBanners failed:', e.message);
        return [];
    }
};

const getBannersForPath = async (pagePath, role) => {
    const { Op } = require('sequelize');
    const safePath = pagePath && typeof pagePath === 'string' ? pagePath : '/';

    try {
        return PageBanner.findAll({
            where: {
                is_active: true,
                page_path: { [Op.in]: ['*', safePath] },
                target_role: { [Op.in]: ['all', role] },
            },
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            attributes: [
                'id', 'page_path', 'banner_type', 'title', 'message',
                'target_role', 'is_active', 'is_dismissible', 'sort_order', 'updatedAt',
            ],
        });
    } catch (e) {
        console.warn('⚠️  getBannersForPath failed:', e.message);
        return [];
    }
};

const createBanner = async (payload, userId) => {
    const data = {
        page_path: payload.page_path,
        banner_type: payload.banner_type,
        title: payload.title,
        message: payload.message,
        target_role: payload.target_role || 'all',
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        is_dismissible: payload.is_dismissible !== undefined ? payload.is_dismissible : true,
        sort_order: payload.sort_order || 0,
        created_by: userId,
        updated_by: userId,
    };
    return PageBanner.create(data);
};

const updateBanner = async (id, payload, userId) => {
    const banner = await PageBanner.findByPk(id);
    if (!banner) throw { statusCode: 404, message: 'Banner tidak ditemukan' };

    await banner.update({
        page_path: payload.page_path !== undefined ? payload.page_path : banner.page_path,
        banner_type: payload.banner_type !== undefined ? payload.banner_type : banner.banner_type,
        title: payload.title !== undefined ? payload.title : banner.title,
        message: payload.message !== undefined ? payload.message : banner.message,
        target_role: payload.target_role !== undefined ? payload.target_role : banner.target_role,
        is_active: payload.is_active !== undefined ? payload.is_active : banner.is_active,
        is_dismissible: payload.is_dismissible !== undefined ? payload.is_dismissible : banner.is_dismissible,
        sort_order: payload.sort_order !== undefined ? payload.sort_order : banner.sort_order,
        updated_by: userId,
    });

    return banner.reload({
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'updater', attributes: ['id', 'name'] },
        ],
    });
};

const toggleBanner = async (id, userId) => {
    const banner = await PageBanner.findByPk(id);
    if (!banner) throw { statusCode: 404, message: 'Banner tidak ditemukan' };
    await banner.update({ is_active: !banner.is_active, updated_by: userId });
    return banner.reload({
        include: [{ model: User, as: 'updater', attributes: ['id', 'name'] }],
    });
};

const deleteBanner = async (id) => {
    const banner = await PageBanner.findByPk(id);
    if (!banner) throw { statusCode: 404, message: 'Banner tidak ditemukan' };
    await banner.destroy();
    return { id };
};

// ═════════════════════════════════════════════════════════════════════════════
// NAV PAGES (dropdown helper)
// ═════════════════════════════════════════════════════════════════════════════

const NAV_KEY_TO_PATH = {
    dashboard: '/',
    map: '/map',
    ops: '/ops',
    logistics: '/logistics',
    refugees: '/refugees',
    funding: '/funding',
    admin: '/admin',
    instruksi: '/instruksi',
    'app-settings': '/app-settings',
};

const getNavPages = async () => {
    try {
        // Ambil set nav items terlengkap dari role superadmin (seed default juga dari sini).
        // Ini memastikan label berasal dari DB (bisa di-rename lewat nav_access_configs).
        const rows = await NavAccessConfig.findAll({
            where: { role: 'superadmin' },
            attributes: ['nav_key', 'nav_label', 'sort_order'],
            order: [['sort_order', 'ASC']],
        });

        return rows
            .map(r => ({
                nav_key: r.nav_key,
                nav_label: r.nav_label,
                sort_order: r.sort_order,
                path: NAV_KEY_TO_PATH[r.nav_key],
            }))
            .filter(r => !!r.path);
    } catch (e) {
        console.warn('⚠️  getNavPages failed:', e.message);
        // Fallback static mapping (label may not match DB rename)
        return Object.entries(NAV_KEY_TO_PATH).map(([nav_key, path], idx) => ({
            nav_key,
            nav_label: nav_key,
            sort_order: idx + 1,
            path,
        }));
    }
};

module.exports = {
    seedAll,
    // Nav access
    getAllNavAccess,
    getNavAccessByRole,
    toggleNavAccess,
    bulkUpdateNavAccess,
    // Component visibility
    getAllComponents,
    getComponentsByNavKey,
    toggleComponent,
    bulkUpdateComponents,
    // Notification dots
    getAllNotifDots,
    getNotifDotsPublic,
    toggleNotifDot,
    // System statuses
    getPublicSystemStatuses,
    getAllSystemStatuses,
    setCurrentSystemStatus,
    createSystemStatus,
    updateSystemStatus,
    deleteSystemStatus,
    // Page banners
    getAllBanners,
    getBannersForPath,
    createBanner,
    updateBanner,
    toggleBanner,
    deleteBanner,
    // Nav pages
    getNavPages,
};
