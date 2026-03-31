import { useState } from 'react';
import { Landmark, TrendingUp, Wallet, AlertTriangle, PieChart as PieIcon, Filter } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { useFundingSummary, useBurnRate, useAllocations, useExpenditures } from './hooks/useFunding';

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (val) => {
    if (!val && val !== 0) return '—';
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} M`;
    if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(0)} Jt`;
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

const TOOLTIP_STYLE = {
    contentStyle: {
        background: '#1a1f2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        fontSize: 12,
    },
};

const SEKTOR_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#94a3b8', '#ef4444', '#a78bfa'];
const SOURCES = ['BTT', 'BNPB', 'Kemensos', 'Donasi', 'Lainnya'];
const SOURCE_COLORS = { BTT: '#f59e0b', BNPB: '#3b82f6', Kemensos: '#10b981', Donasi: '#8b5cf6', Lainnya: '#ef4444' };

// ── Main Page ────────────────────────────────────────────────────
export default function FundingPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [filterSource, setFilterSource] = useState('');

    const summaryParams = filterSource ? { source: filterSource } : {};
    const allocParams = filterSource ? { source: filterSource } : {};

    const { data: funding, isLoading: fLoading } = useFundingSummary(summaryParams);
    const { data: burnRate, isLoading: brLoading } = useBurnRate();
    const { data: allocs, isLoading: aLoading } = useAllocations(allocParams);
    const { data: expenditures, isLoading: expLoading } = useExpenditures();

    // Chart data
    const burnChartData = (Array.isArray(burnRate) ? burnRate : []).map(d => ({
        tanggal: new Date(d.expenditure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        realisasi: Number(d.amount) / 1e6,
        dailyAvg: funding?.avgDailyBurn ? Number(funding.avgDailyBurn) / 1e6 : undefined,
    }));

    const sektorEntries = funding?.sektorBreakdown
        ? Object.entries(funding.sektorBreakdown)
        : [];

    const sourceEntries = funding?.sourceBreakdown
        ? Object.entries(funding.sourceBreakdown)
        : [];


    const persen = funding?.persenRealisasi ?? 0;
    const isOverBudget = persen >= 90;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* ── Source Filter ── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 4 }}>Sumber Dana:</span>
                <button
                    className={`btn ${filterSource === '' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    onClick={() => setFilterSource('')}>
                    Semua
                </button>
                {SOURCES.map(s => (
                    <button key={s}
                        className={`btn ${filterSource === s ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                        onClick={() => setFilterSource(s)}>
                        {s}
                    </button>
                ))}
            </div>

            {/* ── KPI Cards ── */}
            <div className="kpi-grid" style={{ marginBottom: 20 }}>
                <div className="kpi-card info">
                    <div className="kpi-title"><Landmark size={13} /> Total Pagu {filterSource || ''}</div>
                    <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
                        {fLoading ? '—' : fmt(funding?.totalPagu)}
                    </div>
                </div>
                <div className="kpi-card warning">
                    <div className="kpi-title"><TrendingUp size={13} /> Total Realisasi</div>
                    <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
                        {fLoading ? '—' : fmt(funding?.totalRealisasi)}
                    </div>
                    <div className="kpi-trend">{fLoading ? '' : `${persen}% dari pagu`}</div>
                </div>
                <div className="kpi-card success">
                    <div className="kpi-title"><Wallet size={13} /> Sisa Saldo</div>
                    <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
                        {fLoading ? '—' : fmt(funding?.sisaSaldo)}
                    </div>
                </div>
                {isOverBudget && (
                    <div className="kpi-card danger" style={{ animation: 'pulse 2s infinite' }}>
                        <div className="kpi-title"><AlertTriangle size={13} /> Peringatan</div>
                        <div className="kpi-value" style={{ fontSize: '1rem' }}>Burn Rate Tinggi</div>
                        <div className="kpi-trend" style={{ color: 'var(--status-red)' }}>Serapan {persen}% dari pagu!</div>
                    </div>
                )}
            </div>

            {/* ── Dana per Sumber ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Dana per Sumber
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {SOURCES.map(src => {
                        const data = funding?.sourceBreakdown?.[src];
                        const pagu = data?.pagu ?? 0;
                        const real = data?.realisasi ?? 0;
                        return (
                            <div key={src} className="card" style={{
                                padding: '10px 14px', cursor: 'pointer',
                                border: filterSource === src ? '2px solid var(--accent-primary)' : undefined,
                            }}
                                onClick={() => setFilterSource(filterSource === src ? '' : src)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[src] || '#94a3b8' }} />
                                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>{src}</span>
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: pagu > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                    {pagu > 0 ? fmt(pagu) : 'Rp 0'}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    Realisasi: {fmt(real)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Progress Bar Serapan ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Serapan Anggaran {filterSource ? `(${filterSource})` : ''}</span>
                    <span style={{ fontWeight: 700, color: isOverBudget ? 'var(--status-red)' : 'var(--status-green)' }}>
                        {persen}%
                    </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4 }}>
                    <div style={{
                        height: '100%', width: `${Math.min(persen, 100)}%`, borderRadius: 4,
                        background: isOverBudget ? 'linear-gradient(90deg, var(--status-yellow), var(--status-red))'
                            : 'linear-gradient(90deg, var(--accent-primary), var(--status-green))',
                        transition: 'width 0.8s ease',
                    }} />
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['overview', 'alokasi', 'pengeluaran'].map(tab => (
                    <button key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '6px 14px', fontSize: '0.78rem', textTransform: 'capitalize' }}
                        onClick={() => setActiveTab(tab)}>
                        {tab === 'overview' ? 'Grafik & Serapan' : tab === 'alokasi' ? 'Alokasi Anggaran' : 'Realisasi Pengeluaran'}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
                <div className="grid-2-1">
                    {/* Burn Rate Line Chart */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Grafik Realisasi Harian (Burn Rate)</div>
                        </div>
                        <div className="chart-container" style={{ height: 280 }}>
                            {brLoading ? <div className="skeleton" style={{ height: '100%' }} /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={burnChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="tanggal" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}Jt`} />
                                        <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [`Rp ${v.toFixed(1)} Juta`, n]} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                        <Line type="monotone" dataKey="realisasi" name="Realisasi"
                                            stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
                                        {burnChartData[0]?.dailyAvg && (
                                            <ReferenceLine y={burnChartData[0].dailyAvg}
                                                stroke="#f59e0b" strokeDasharray="4 4"
                                                label={{ value: 'Rata-rata', fill: '#f59e0b', fontSize: 10 }} />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Sektor Breakdown */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><PieIcon size={14} /> Serapan per Sektor</div>
                        </div>
                        {fLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : sektorEntries.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Belum ada data serapan per sektor.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {sektorEntries.map(([name, amount], i) => {
                                    const pct = funding?.totalRealisasi > 0
                                        ? ((amount / funding.totalRealisasi) * 100).toFixed(1)
                                        : 0;
                                    return (
                                        <div key={name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                                <span>{name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{fmt(amount)} ({pct}%)</span>
                                            </div>
                                            <div style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                                                <div style={{
                                                    height: '100%', width: `${pct}%`, borderRadius: 2,
                                                    background: SEKTOR_COLORS[i % SEKTOR_COLORS.length],
                                                    transition: 'width 0.6s ease',
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Alokasi Tab ── */}
            {activeTab === 'alokasi' && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Alokasi Anggaran per Sektor {filterSource ? `(${filterSource})` : ''}</div>
                    </div>

                    {aLoading ? (
                        <div className="skeleton" style={{ height: 150 }} />
                    ) : !allocs || allocs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                            Belum ada alokasi anggaran {filterSource ? `dari ${filterSource}` : ''}.
                        </p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Sumber</th><th>Sektor / Kegiatan</th>
                                    <th style={{ textAlign: 'right' }}>Alokasi</th>
                                    <th style={{ textAlign: 'right' }}>Realisasi</th>
                                    <th style={{ textAlign: 'right' }}>Sisa</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocs.map(a => {
                                    const realized = a.realized ?? 0;
                                    const allocated = Number(a.total_amount ?? a.allocated ?? a.amount ?? 0);
                                    const sisa = allocated - realized;
                                    const pct = allocated > 0 ? Math.min(100, Math.round((realized / allocated) * 100)) : 0;
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <span className="pill" style={{
                                                    background: `${SOURCE_COLORS[a.source] || '#94a3b8'}22`,
                                                    color: SOURCE_COLORS[a.source] || '#94a3b8',
                                                }}>{a.source}</span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{a.sector ?? a.sektor ?? a.category ?? '—'}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(allocated)}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--status-yellow)' }}>{fmt(realized)}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace', color: sisa < 0 ? 'var(--status-red)' : 'var(--status-green)' }}>
                                                {fmt(sisa)}
                                            </td>
                                            <td style={{ minWidth: 100 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ flex: 1, height: 5, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                                                        <div style={{
                                                            height: '100%', width: `${pct}%`, borderRadius: 2,
                                                            background: pct >= 90 ? 'var(--status-red)' : 'var(--accent-primary)',
                                                            transition: 'width 0.4s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Pengeluaran Tab ── */}
            {activeTab === 'pengeluaran' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Chart */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Grafik Pengeluaran Harian</div>
                        </div>
                        {brLoading ? (
                            <div className="skeleton" style={{ height: 150 }} />
                        ) : burnChartData.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                                Belum ada data pengeluaran.
                            </p>
                        ) : (
                            <div className="chart-container" style={{ height: 280, marginTop: 8 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={burnChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="tanggal" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}Jt`} />
                                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`Rp ${v.toFixed(1)} Juta`]} />
                                        <Bar dataKey="realisasi" name="Pengeluaran" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Detail Table */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Rincian Pengeluaran</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {expLoading ? '...' : `${(expenditures || []).length} catatan`}
                            </span>
                        </div>
                        {expLoading ? (
                            <div className="skeleton" style={{ height: 150 }} />
                        ) : !expenditures || expenditures.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                                Belum ada catatan pengeluaran.
                            </p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Sumber — Sektor</th>
                                        <th>Keterangan</th>
                                        <th style={{ textAlign: 'right' }}>Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenditures.map(exp => {
                                        const alloc = (allocs || []).find(a => a.id === exp.allocation_id);
                                        return (
                                            <tr key={exp.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {exp.expenditure_date
                                                        ? new Date(exp.expenditure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </td>
                                                <td>
                                                    {alloc ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span className="pill" style={{
                                                                background: `${SOURCE_COLORS[alloc.source] || '#94a3b8'}22`,
                                                                color: SOURCE_COLORS[alloc.source] || '#94a3b8',
                                                                fontSize: '0.7rem',
                                                            }}>{alloc.source}</span>
                                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{alloc.sector}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                                    {exp.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada keterangan</span>}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--status-red)', whiteSpace: 'nowrap' }}>
                                                    -{fmt(exp.amount)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
