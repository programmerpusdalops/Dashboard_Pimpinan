/**
 * UsersAccessTab — Kelola nav item visibility per role
 */
import { useState } from 'react';
import { Eye, EyeOff, Shield, RefreshCw, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavAccess, useToggleNavAccess } from '../hooks/useAppSettings';

const ROLE_META = {
    admin: { label: 'Admin', color: 'var(--status-yellow)', bg: 'var(--status-yellow-bg)' },
    operator: { label: 'Operator', color: 'var(--status-blue)', bg: 'var(--status-blue-bg)' },
    viewer: { label: 'Viewer', color: 'var(--status-green)', bg: 'var(--status-green-bg)' },
    pimpinan: { label: 'Pimpinan', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

const ROLE_ORDER = ['pimpinan', 'admin', 'operator', 'viewer'];

export default function UsersAccessTab() {
    const { data: configs = [], isLoading, refetch } = useNavAccess();
    const toggleMutation = useToggleNavAccess();
    const [expandedRole, setExpandedRole] = useState('viewer');

    // Group configs by role
    const grouped = ROLE_ORDER.reduce((acc, role) => {
        acc[role] = configs
            .filter(c => c.role === role)
            .sort((a, b) => a.sort_order - b.sort_order);
        return acc;
    }, {});

    const handleToggle = (id) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) {
        return <div className="skeleton" style={{ height: 300 }} />;
    }

    return (
        <div>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        Akses Navigasi per Role
                    </span>
                </div>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={refetch}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLE_ORDER.map(role => {
                    const meta = ROLE_META[role];
                    const items = grouped[role] || [];
                    const visibleCount = items.filter(i => i.is_visible).length;
                    const isExpanded = expandedRole === role;

                    return (
                        <div key={role} className="card" style={{
                            margin: 0,
                            border: isExpanded ? `1px solid ${meta.color}30` : undefined,
                        }}>
                            <div
                                onClick={() => setExpandedRole(isExpanded ? null : role)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
                                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <Shield size={16} style={{ color: meta.color }} />
                                    <span className="pill" style={{
                                        background: meta.bg, color: meta.color,
                                        fontWeight: 700, fontSize: '0.78rem',
                                    }}>
                                        {meta.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                    fontWeight: 600,
                                }}>
                                    {visibleCount}/{items.length} nav aktif
                                </span>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '8px 16px 12px' }}>
                                    <table className="data-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>#</th>
                                                <th>Nav Key</th>
                                                <th>Label</th>
                                                <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                                                <th style={{ width: 70, textAlign: 'center' }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => {
                                                const isLocked = item.role === 'superadmin' && item.nav_key === 'app_settings';
                                                return (
                                                <tr key={item.id}
                                                    style={{
                                                        opacity: item.is_visible ? 1 : 0.5,
                                                        transition: 'opacity 0.2s',
                                                    }}>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        <code style={{
                                                            fontSize: '0.78rem', padding: '2px 6px',
                                                            background: 'var(--bg-secondary)',
                                                            borderRadius: 4,
                                                        }}>
                                                            {item.nav_key}
                                                        </code>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{item.nav_label}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`pill ${item.is_visible ? 'pill-safe' : 'pill-critical'}`}
                                                            style={{ fontSize: '0.72rem' }}>
                                                            {item.is_visible ? 'Tampil' : 'Tersembunyi'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{
                                                                padding: '4px 8px',
                                                                color: isLocked ? 'var(--text-muted)' : (item.is_visible ? 'var(--status-green)' : 'var(--status-red)'),
                                                                borderColor: isLocked ? 'var(--border-color)' : (item.is_visible ? 'var(--status-green)' : 'var(--status-red)'),
                                                                opacity: isLocked ? 0.5 : 1,
                                                                cursor: isLocked ? 'not-allowed' : 'pointer'
                                                            }}
                                                            onClick={() => !isLocked && handleToggle(item.id)}
                                                            disabled={toggleMutation.isPending || isLocked}
                                                            title={isLocked ? 'Akses sistem terkunci' : (item.is_visible ? 'Sembunyikan' : 'Tampilkan')}
                                                        >
                                                            {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
