import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import './Sidebar.css';

import {
    LayoutDashboard, Map, RadioTower, Truck, Users, Landmark,
    Settings, Cog, Bell, CheckCircle, Clock, LogOut, ScrollText
} from 'lucide-react';
import BpbdLogo from './BpbdLogo';
import ConfirmDialog from './ConfirmDialog';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/useLayoutStore';
import { useInstructionCount } from '../../hooks/useInstructions';
import { useNavAccessByRole, useNotifDotsPublic } from '../../features/app-settings/hooks/useAppSettings';
import { useRealtimeAppEvents, useNotifications } from '../../hooks/useRealtime';

// Map path → target_module untuk badge instruksi
const PATH_TO_MODULE = {
    '/': 'dasbor',
    '/map': 'peta',
    '/ops': 'operasi',
    '/logistics': 'logistik',
    '/refugees': 'pengungsi',
    '/funding': 'anggaran',
};

// Map nav_key → { path, icon, label (fallback) }
const NAV_KEY_MAP = {
    dashboard:      { path: '/',            icon: LayoutDashboard, label: 'Dasbor Utama' },
    map:            { path: '/map',         icon: Map,             label: 'Peta Risiko & Dampak' },
    ops:            { path: '/ops',         icon: RadioTower,      label: 'Pusat Pengendalian' },
    logistics:      { path: '/logistics',   icon: Truck,           label: 'Logistik & Peralatan' },
    refugees:       { path: '/refugees',    icon: Users,           label: 'Data Pengungsi' },
    funding:        { path: '/funding',     icon: Landmark,        label: 'Anggaran & Pendanaan' },
    admin:          { path: '/admin',       icon: Settings,        label: 'Admin' },
    instruksi:      { path: '/instruksi',   icon: ScrollText,      label: 'Instruksi Pimpinan' },
    'app-settings': { path: '/app-settings', icon: Cog,            label: 'App Settings' },
};

// Admin-level nav keys (dibawah separator)
const ADMIN_NAV_KEYS = ['admin', 'app-settings'];

// Fallback static nav items jika config belum di-load
const DEFAULT_NAV_KEYS = ['dashboard', 'map', 'ops', 'logistics', 'refugees', 'funding'];

export default function Sidebar() {
    // ── Realtime Setup ──
    useRealtimeAppEvents();

    const { sidebarCollapsed: collapsed } = useLayoutStore();

    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const role = user?.role;
    const { data: badgeCounts = {} } = useInstructionCount();

    // Fetch nav access config from DB for current role
    const { data: navConfigs } = useNavAccessByRole(role);

    // Fetch notification dot configs from DB
    const { data: dotConfigs } = useNotifDotsPublic();

    // Fetch system notifications for popover
    const { data: notifications = [] } = useNotifications();
    const [showNotif, setShowNotif] = useState(false);
    const notifRef = useRef(null);
    const navRef = useRef(null);

    const [tooltip, setTooltip] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Cache unread status
    const [lastReadNotifId, setLastReadNotifId] = useState(() => {
        return parseInt(localStorage.getItem('last_read_notif_id') || '0', 10);
    });

    const hasUnreadNotif = notifications.length > 0 && notifications[0].id > lastReadNotifId;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const requestLogout = () => {
        setShowLogoutConfirm(true);
    };

    const toggleNotif = () => {
        const nextState = !showNotif;
        setShowNotif(nextState);
        if (nextState && notifications.length > 0) {
            const maxId = notifications[0].id;
            setLastReadNotifId(maxId);
            localStorage.setItem('last_read_notif_id', maxId.toString());
        }
    };

    // Click outside handler for popover
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotif(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const onAnyScroll = () => setTooltip(null);
        const navEl = navRef.current;
        if (navEl) navEl.addEventListener('scroll', onAnyScroll);
        window.addEventListener('resize', onAnyScroll);
        return () => {
            if (navEl) navEl.removeEventListener('scroll', onAnyScroll);
            window.removeEventListener('resize', onAnyScroll);
        };
    }, []);

    const showTooltip = (targetEl, text) => {
        if (!collapsed) return;
        if (!targetEl || !text) return;
        const rect = targetEl.getBoundingClientRect();
        setTooltip({
            text,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    };

    const showTooltipAny = (targetEl, text) => {
        if (!targetEl || !text) return;
        const rect = targetEl.getBoundingClientRect();
        setTooltip({
            text,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    };

    const hideTooltip = () => setTooltip(null);

    // Build notification dot lookup (nav_key → boolean)
    const dotEnabled = {};
    if (dotConfigs) {
        dotConfigs.forEach(d => { dotEnabled[d.nav_key] = d.is_enabled; });
    }

    // Build visible nav items from DB config
    let mainItems = [];
    let adminItems = [];

    if (navConfigs && navConfigs.length > 0) {
        const visibleConfigs = navConfigs
            .filter(c => c.is_visible)
            .sort((a, b) => a.sort_order - b.sort_order);

        visibleConfigs.forEach(cfg => {
            const meta = NAV_KEY_MAP[cfg.nav_key];
            if (!meta) return;
            const item = {
                path: meta.path,
                icon: meta.icon,
                label: cfg.nav_label || meta.label,
                navKey: cfg.nav_key,
            };

            if (ADMIN_NAV_KEYS.includes(cfg.nav_key)) {
                adminItems.push(item);
            } else {
                mainItems.push(item);
            }
        });
    } else {
        // Fallback sampai config ter-load
        mainItems = DEFAULT_NAV_KEYS.map(key => {
            const meta = NAV_KEY_MAP[key];
            return { path: meta.path, icon: meta.icon, label: meta.label, navKey: key };
        });

        // Fallback: admin/superadmin gets admin nav
        if (role === 'admin' || role === 'superadmin') {
            adminItems.push({
                path: '/admin', icon: Settings, label: 'Admin', navKey: 'admin',
            });
        }
        if (role === 'superadmin') {
            adminItems.push({
                path: '/app-settings', icon: Cog, label: 'Pengaturan Aplikasi', navKey: 'app-settings',
            });
        }
    }

    const renderNavItem = (item) => {
        const moduleKey = PATH_TO_MODULE[item.path];
        // Badge hanya tampil kalau notification dot dari DB di-enable (atau belum ada config)
        const isDotEnabled = dotEnabled[item.navKey] !== undefined ? dotEnabled[item.navKey] : true;
        const badge = (moduleKey && isDotEnabled) ? (badgeCounts[moduleKey] || 0) : 0;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ position: 'relative' }}
                data-tooltip={collapsed ? item.label : undefined}
                onMouseEnter={(e) => showTooltip(e.currentTarget, item.label)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(e.currentTarget, item.label)}
                onBlur={hideTooltip}
                onClick={hideTooltip}
            >
                <item.icon size={18} />
                <span className="nav-label">{item.label}</span>
                {badge > 0 && (
                    <span style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: '#ef4444', color: '#fff',
                        borderRadius: 10, padding: '1px 6px',
                        fontSize: '0.62rem', fontWeight: 700,
                        minWidth: 16, textAlign: 'center',
                        animation: 'pulse 2s infinite',
                    }}>{badge}</span>
                )}
            </NavLink>
        );
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <BpbdLogo size={collapsed ? 38 : 42} />

                <div className="sidebar-logo-text">
                    <h1>BPBD SULTENG</h1>
                    <div className="sidebar-logo-sub">Command Center</div>
                </div>
            </div>

            <nav ref={navRef}>
                {mainItems.map(renderNavItem)}

                {adminItems.length > 0 && (
                    <>
                        <div style={{ height: 1, background: 'var(--border-color)', margin: '12px 0' }} />
                        {adminItems.map(renderNavItem)}
                    </>
                )}
            </nav>

            {tooltip && collapsed && (
                <div className="sidebar-tooltip" style={{ top: tooltip.top, left: tooltip.left }}>
                    {tooltip.text}
                </div>
            )}

            <div style={{ position: 'relative' }} ref={notifRef}>
                <div 
                    onClick={() => { hideTooltip(); toggleNotif(); }}
                    className="nav-link sidebar-system-link" 
                    style={{ cursor: 'pointer', background: showNotif ? 'rgba(59, 130, 246, 0.1)' : undefined }}
                    data-tooltip={collapsed ? 'Notifikasi' : undefined}
                    onMouseEnter={(e) => showTooltip(e.currentTarget, 'Notifikasi')}
                    onMouseLeave={hideTooltip}
                >
                    <Bell size={18} />
                    <span className="nav-label">Notifikasi</span>
                    {hasUnreadNotif && (
                        <span className="sidebar-unread-dot" />
                    )}
                </div>

                {/* Notif Popover */}
                {showNotif && (
                    <div style={{
                        position: 'absolute', bottom: 'calc(100% + 4px)', left: 12, right: -12,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', padding: 0, zIndex: 1000,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', width: 260,
                        animation: 'fadeIn 0.2s ease', overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '10px 12px', borderBottom: '1px solid var(--border-color)',
                            fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)'
                        }}>
                            Aktifitas Sistem Terakhir
                        </div>
                        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    Tidak ada pesan terbaru.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} style={{
                                        padding: '10px 12px', borderBottom: '1px solid var(--border-color)',
                                        display: 'flex', gap: 10, alignItems: 'flex-start'
                                    }}>
                                        <div style={{
                                            background: notif.type === 'admin_update' ? 'var(--status-blue-bg)' : 'var(--bg-primary)',
                                            color: notif.type === 'admin_update' ? 'var(--status-blue)' : 'var(--text-muted)',
                                            padding: 6, borderRadius: '50%'
                                        }}>
                                            <Cog size={13} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 2, lineHeight: 1.2 }}>
                                                {notif.title}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                {notif.message}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} /> 
                                                {new Date(notif.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-account">
                    <div className="sidebar-account-info">
                        <div className="sidebar-account-name">{user?.name || '—'}</div>
                        <div className="sidebar-account-role">{(user?.role || 'viewer').toUpperCase()}</div>
                    </div>
                    <button
                        onClick={() => { hideTooltip(); requestLogout(); }}
                        className="btn btn-outline sidebar-logout-btn"
                        style={{ padding: '6px 10px' }}
                        data-tooltip="Logout"
                        onMouseEnter={(e) => showTooltipAny(e.currentTarget, 'Logout')}
                        onMouseLeave={hideTooltip}
                        onFocus={(e) => showTooltipAny(e.currentTarget, 'Logout')}
                        onBlur={hideTooltip}
                    >
                        <LogOut size={15} style={{ transform: 'scaleX(-1)' }} />
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={showLogoutConfirm}
                title="Konfirmasi Logout"
                message="Anda yakin ingin keluar dari aplikasi?"
                confirmText="Ya, Logout"
                cancelText="Batal"
                confirmVariant="danger"
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={async () => {
                    setShowLogoutConfirm(false);
                    await handleLogout();
                }}
            />
        </aside>
    );
}
