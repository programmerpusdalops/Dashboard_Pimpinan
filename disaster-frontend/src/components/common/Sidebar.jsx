import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Map, RadioTower, Truck, Users, Landmark,
    Settings
} from 'lucide-react';
import BpbdLogo from './BpbdLogo';
import useAuthStore from '../../store/authStore';
import { useInstructionCount } from '../../hooks/useInstructions';

// Map path → target_module untuk badge
const PATH_TO_MODULE = {
    '/': 'dasbor',
    '/map': 'peta',
    '/ops': 'operasi',
    '/logistics': 'logistik',
    '/refugees': 'pengungsi',
    '/funding': 'anggaran',
};

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dasbor Utama' },
    { path: '/map', icon: Map, label: 'Peta Risiko & Dampak' },
    { path: '/ops', icon: RadioTower, label: 'Pusat Pengendalian' },
    { path: '/logistics', icon: Truck, label: 'Logistik & Peralatan' },
    { path: '/refugees', icon: Users, label: 'Data Pengungsi' },
    { path: '/funding', icon: Landmark, label: 'Anggaran & Pendanaan' },
];

const adminItems = [
    { path: '/admin', icon: Settings, label: 'Pengaturan Master' },
];

export default function Sidebar() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const { data: badgeCounts = {} } = useInstructionCount();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 10px 16px' }}>
                <BpbdLogo size={42} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '0.9rem', marginBottom: 2, letterSpacing: '0.5px' }}>BPBD SULTENG</h1>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Command Center</div>
                </div>
            </div>

            <nav>
                {navItems.map((item) => {
                    const moduleKey = PATH_TO_MODULE[item.path];
                    const badge = moduleKey ? (badgeCounts[moduleKey] || 0) : 0;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <item.icon size={18} />
                            {item.label}
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
                })}

                {isAdmin && (
                    <>
                        <div style={{ height: 1, background: 'var(--border-color)', margin: '12px 0' }} />
                        {adminItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="alert-status">
                    <span className="status-dot" />
                    <span>STATUS: SIAGA</span>
                </div>
            </div>
        </aside>
    );
}

