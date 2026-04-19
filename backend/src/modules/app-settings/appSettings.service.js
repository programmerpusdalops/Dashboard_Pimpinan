'use strict';
const {
    NavAccessConfig,
    ComponentVisibilityConfig,
    NotificationDotConfig,
    User,
} = require('../../models');

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
    await seedNavAccess();
    await seedComponents();
    await seedNotifDots();
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
};
