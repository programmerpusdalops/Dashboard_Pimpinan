import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Map, RadioTower, Truck, Users, Landmark,
    ShieldAlert, Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Executive View' },
    { path: '/map', icon: Map, label: 'Risk & Impact Map' },
    { path: '/ops', icon: RadioTower, label: 'Operations (ICS)' },
    { path: '/logistics', icon: Truck, label: 'Logistics & Distribution' },
    { path: '/refugees', icon: Users, label: 'Refugee Services' },
    { path: '/funding', icon: Landmark, label: 'Funding & Budget' },
];

const adminItems = [
    { path: '/admin', icon: Settings, label: 'Admin Panel' },
];

export default function Sidebar() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <ShieldAlert size={24} className="logo-icon" />
                <h1>COMMAND CENTER</h1>
            </div>

            <nav>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </NavLink>
                ))}

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
