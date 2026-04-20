/**
 * AppSettingsPage — Halaman utama App Settings (superadmin only)
 * 2 tab: Users > Access, Pages > Components
 */
import { useState, createElement } from 'react';
import { Users, Layers, ShieldAlert, MessageSquare, Activity } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import UsersAccessTab from './tabs/UsersAccessTab';
import PagesComponentsTab from './tabs/PagesComponentsTab';
import SystemMessagesTab from './tabs/SystemMessagesTab';
import PageBannersTab from './tabs/PageBannersTab';
import SystemStatusTab from './tabs/SystemStatusTab';

const TABS = [
    { key: 'users-access', label: 'Users Access', icon: Users },
    { key: 'pages-components', label: 'Pages Components', icon: Layers },
    { key: 'page-banners', label: 'Page Banners', icon: ShieldAlert },
    { key: 'system-status', label: 'System Status', icon: Activity },
    { key: 'system-messages', label: 'Custom Notifications', icon: MessageSquare },
];

export default function AppSettingsPage() {
    const { user } = useAuthStore();
    const [tab, setTab] = useState('users-access');

    if (user?.role !== 'superadmin') {
        return (
            <div className="card" style={{ margin: 0 }}>
                <div className="card-body" style={{ padding: 20 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Akses terbatas</div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Halaman ini hanya tersedia untuk role superadmin.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 16,
                padding: '4px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            }}>
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        className={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                            padding: '8px 16px', fontSize: '0.8rem',
                            border: tab === key ? undefined : 'none',
                            background: tab === key ? undefined : 'transparent',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onClick={() => setTab(key)}
                    >
                        {createElement(Icon, { size: 14 })} {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'users-access' && <UsersAccessTab />}
            {tab === 'pages-components' && <PagesComponentsTab />}
            {tab === 'page-banners' && <PageBannersTab />}
            {tab === 'system-status' && <SystemStatusTab />}
            {tab === 'system-messages' && <SystemMessagesTab />}
        </div>
    );
}
