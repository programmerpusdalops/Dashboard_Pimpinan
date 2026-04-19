/**
 * AppSettingsPage — Halaman utama App Settings (superadmin only)
 * 2 tab: Users > Access, Pages > Components
 */
import { useState, createElement } from 'react';
import { Users, Layers, ShieldAlert, MessageSquare } from 'lucide-react';
import UsersAccessTab from './tabs/UsersAccessTab';
import PagesComponentsTab from './tabs/PagesComponentsTab';
import SystemMessagesTab from './tabs/SystemMessagesTab';
import AlertBanner from '../../components/common/AlertBanner';

const TABS = [
    { key: 'users-access', label: 'Users Access', icon: Users },
    { key: 'pages-components', label: 'Pages Components', icon: Layers },
    { key: 'system-messages', label: 'Custom Notifications', icon: MessageSquare },
];

export default function AppSettingsPage() {
    const [tab, setTab] = useState('users-access');

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
            {tab === 'system-messages' && <SystemMessagesTab />}
        </div>
    );
}
