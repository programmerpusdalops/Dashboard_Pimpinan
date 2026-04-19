/**
 * PagesComponentsTab — Kelola component visibility + notification dots per nav item
 */
import { useState } from 'react';
import {
    Eye, EyeOff, Bell, BellOff, Layers, RefreshCw,
    ChevronDown, ChevronRight, LayoutGrid,
} from 'lucide-react';
import {
    useComponents, useToggleComponent,
    useNotifDots, useToggleNotifDot,
} from '../hooks/useAppSettings';

const NAV_LABELS = {
    dashboard: 'Dasbor Utama',
    map: 'Peta Risiko & Dampak',
    ops: 'Pusat Pengendalian',
    logistics: 'Logistik & Peralatan',
    refugees: 'Data Pengungsi',
    funding: 'Anggaran & Pendanaan',
    instruksi: 'Instruksi Pimpinan',
};

const NAV_ORDER = ['dashboard', 'map', 'ops', 'logistics', 'refugees', 'funding', 'instruksi'];

export default function PagesComponentsTab() {
    const { data: components = [], isLoading: loadingComp, refetch: refetchComp } = useComponents();
    const { data: notifDots = [], isLoading: loadingDots, refetch: refetchDots } = useNotifDots();
    const toggleComp = useToggleComponent();
    const toggleDot = useToggleNotifDot();

    const [expandedNav, setExpandedNav] = useState('dashboard');

    // Group components by nav_key
    const grouped = NAV_ORDER.reduce((acc, key) => {
        acc[key] = components
            .filter(c => c.nav_key === key)
            .sort((a, b) => a.sort_order - b.sort_order);
        return acc;
    }, {});

    // Map notif dots by nav_key
    const dotMap = notifDots.reduce((acc, d) => {
        acc[d.nav_key] = d;
        return acc;
    }, {});

    const isLoading = loadingComp || loadingDots;

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
                    <Layers size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        Komponen Halaman & Notification Dots
                    </span>
                </div>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => { refetchComp(); refetchDots(); }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Notification Dots Summary */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                    <div className="card-title">
                        <Bell size={14} /> NOTIFICATION DOTS PER NAV ITEM
                    </div>
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 8, padding: '12px 16px',
                }}>
                    {NAV_ORDER.map(navKey => {
                        const dot = dotMap[navKey];
                        if (!dot) return null;
                        return (
                            <div key={navKey} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${dot.is_enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {dot.is_enabled ? (
                                        <Bell size={14} style={{ color: 'var(--status-green)' }} />
                                    ) : (
                                        <BellOff size={14} style={{ color: 'var(--status-red)' }} />
                                    )}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        {NAV_LABELS[navKey] || navKey}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    style={{
                                        padding: '3px 7px',
                                        fontSize: '0.7rem',
                                        color: dot.is_enabled ? 'var(--status-green)' : 'var(--status-red)',
                                        borderColor: dot.is_enabled ? 'var(--status-green)' : 'var(--status-red)',
                                    }}
                                    onClick={() => toggleDot.mutate(dot.id)}
                                    disabled={toggleDot.isPending}
                                >
                                    {dot.is_enabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Components per Nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {NAV_ORDER.map(navKey => {
                    const items = grouped[navKey] || [];
                    if (items.length === 0) return null;

                    const visibleCount = items.filter(i => i.is_visible).length;
                    const isExpanded = expandedNav === navKey;

                    return (
                        <div key={navKey} className="card" style={{
                            margin: 0,
                            border: isExpanded ? `1px solid var(--accent-primary)30` : undefined,
                        }}>
                            <div
                                onClick={() => setExpandedNav(isExpanded ? null : navKey)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
                                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <LayoutGrid size={16} style={{ color: 'var(--accent-primary)' }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                        {NAV_LABELS[navKey] || navKey}
                                    </span>
                                    <code style={{
                                        fontSize: '0.7rem', padding: '1px 6px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 4, color: 'var(--text-muted)',
                                    }}>
                                        {navKey}
                                    </code>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                    fontWeight: 600,
                                }}>
                                    {visibleCount}/{items.length} tampil
                                </span>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '8px 16px 12px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: 8,
                                    }}>
                                        {items.map(item => (
                                            <div key={item.id} style={{
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 14px',
                                                background: item.is_visible
                                                    ? 'var(--bg-secondary)'
                                                    : 'rgba(239,68,68,0.05)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1px solid ${item.is_visible ? 'var(--border-color)' : 'rgba(239,68,68,0.2)'}`,
                                                opacity: item.is_visible ? 1 : 0.6,
                                                transition: 'all 0.2s',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                                        {item.component_label}
                                                    </div>
                                                    <code style={{
                                                        fontSize: '0.68rem',
                                                        color: 'var(--text-muted)',
                                                    }}>
                                                        {item.component_key}
                                                    </code>
                                                </div>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{
                                                        padding: '5px 9px',
                                                        color: item.is_visible ? 'var(--status-green)' : 'var(--status-red)',
                                                        borderColor: item.is_visible ? 'var(--status-green)' : 'var(--status-red)',
                                                    }}
                                                    onClick={() => toggleComp.mutate(item.id)}
                                                    disabled={toggleComp.isPending}
                                                    title={item.is_visible ? 'Sembunyikan komponen' : 'Tampilkan komponen'}
                                                >
                                                    {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
