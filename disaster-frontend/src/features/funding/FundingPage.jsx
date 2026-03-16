import { useState } from 'react';
import { Landmark, TrendingUp, Wallet, AlertTriangle, Plus, X, PieChart as PieIcon } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { useFundingSummary, useBurnRate, useAllocations, useCreateAllocation, useCreateExpenditure } from './hooks/useFunding';
import { usePermission } from '../../hooks/usePermission';

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

const EMPTY_ALLOC = { sektor: '', amount: '', description: '' };
const EMPTY_EXP = { description: '', amount: '', sektor: '', expenditure_date: new Date().toISOString().slice(0, 10) };

// ── Main Page ────────────────────────────────────────────────────
export default function FundingPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [showAllocForm, setShowAllocForm] = useState(false);
    const [showExpForm, setShowExpForm] = useState(false);
    const [allocForm, setAllocForm] = useState(EMPTY_ALLOC);
    const [expForm, setExpForm] = useState(EMPTY_EXP);

    const { isAdmin } = usePermission();

    const { data: funding, isLoading: fLoading } = useFundingSummary();
    const { data: burnRate, isLoading: brLoading } = useBurnRate();
    const { data: allocs, isLoading: aLoading } = useAllocations();
    const createAlloc = useCreateAllocation();
    const createExp = useCreateExpenditure();

    // Chart data
    const burnChartData = (Array.isArray(burnRate) ? burnRate : []).map(d => ({
        tanggal: new Date(d.expenditure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        realisasi: Number(d.amount) / 1e6, // dalam juta
        dailyAvg: funding?.avgDailyBurn ? Number(funding.avgDailyBurn) / 1e6 : undefined,
    }));

    const sektorEntries = funding?.sektorBreakdown
        ? Object.entries(funding.sektorBreakdown)
        : [];

    const handleCreateAlloc = async (e) => {
        e.preventDefault();
        await createAlloc.mutateAsync({ ...allocForm, amount: Number(allocForm.amount) });
        setAllocForm(EMPTY_ALLOC);
        setShowAllocForm(false);
    };

    const handleCreateExp = async (e) => {
        e.preventDefault();
        await createExp.mutateAsync({ ...expForm, amount: Number(expForm.amount) });
        setExpForm(EMPTY_EXP);
        setShowExpForm(false);
    };

    const persen = funding?.persenRealisasi ?? 0;
    const isOverBudget = persen >= 90;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* ── KPI Cards ── */}
            <div className="kpi-grid" style={{ marginBottom: 20 }}>
                <div className="kpi-card info">
                    <div className="kpi-title"><Landmark size={13} /> Pagu BTT</div>
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

            {/* ── Progress Bar Serapan ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Serapan Anggaran</span>
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
                        {tab === 'overview' ? 'Grafik & Serapan' : tab === 'alokasi' ? 'Alokasi Anggaran' : 'Pencatatan Pengeluaran'}
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
                        <div className="card-title">Alokasi Anggaran per Sektor</div>
                        {isAdmin && (
                            <button
                                className={`btn ${showAllocForm ? 'btn-outline' : 'btn-primary'}`}
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => setShowAllocForm(v => !v)}>
                                {showAllocForm ? <X size={13} /> : <Plus size={13} />}
                                {showAllocForm ? ' Tutup' : ' Tambah Alokasi'}
                            </button>
                        )}
                    </div>

                    {showAllocForm && (
                        <form onSubmit={handleCreateAlloc}
                            style={{
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 16,
                                padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'
                            }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Nama Sektor / Kegiatan</label>
                                <input className="form-input" value={allocForm.sektor}
                                    onChange={e => setAllocForm({ ...allocForm, sektor: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Jumlah (Rp)</label>
                                <input className="form-input" type="number" value={allocForm.amount}
                                    onChange={e => setAllocForm({ ...allocForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Keterangan</label>
                                <input className="form-input" value={allocForm.description}
                                    onChange={e => setAllocForm({ ...allocForm, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary"
                                    disabled={createAlloc.isPending}>
                                    {createAlloc.isPending ? '...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    )}

                    {aLoading ? (
                        <div className="skeleton" style={{ height: 150 }} />
                    ) : !allocs || allocs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                            Belum ada alokasi anggaran.
                        </p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Sektor / Kegiatan</th><th>Alokasi</th><th>Realisasi</th><th>Sisa</th><th>Progress</th></tr>
                            </thead>
                            <tbody>
                                {allocs.map(a => {
                                    const pct = a.allocated > 0 ? Math.min(100, Math.round((a.realized / a.allocated) * 100)) : 0;
                                    return (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: 600 }}>{a.sektor ?? a.category ?? '—'}</td>
                                            <td>{fmt(a.allocated ?? a.amount)}</td>
                                            <td>{fmt(a.realized ?? 0)}</td>
                                            <td style={{ color: (a.allocated - (a.realized ?? 0)) < 0 ? 'var(--status-red)' : 'var(--status-green)' }}>
                                                {fmt((a.allocated ?? a.amount) - (a.realized ?? 0))}
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
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Pencatatan Pengeluaran Harian</div>
                        {isAdmin && (
                            <button
                                className={`btn ${showExpForm ? 'btn-outline' : 'btn-primary'}`}
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => setShowExpForm(v => !v)}>
                                {showExpForm ? <X size={13} /> : <Plus size={13} />}
                                {showExpForm ? ' Tutup' : ' Catat Pengeluaran'}
                            </button>
                        )}
                    </div>

                    {showExpForm && (
                        <form onSubmit={handleCreateExp}
                            style={{
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 16,
                                padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'
                            }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Keterangan *</label>
                                <input className="form-input" value={expForm.description}
                                    onChange={e => setExpForm({ ...expForm, description: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Jumlah (Rp)</label>
                                <input className="form-input" type="number" value={expForm.amount}
                                    onChange={e => setExpForm({ ...expForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Sektor</label>
                                <input className="form-input" value={expForm.sektor}
                                    onChange={e => setExpForm({ ...expForm, sektor: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Tanggal</label>
                                <input className="form-input" type="date" value={expForm.expenditure_date}
                                    onChange={e => setExpForm({ ...expForm, expenditure_date: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary"
                                    disabled={createExp.isPending}>
                                    {createExp.isPending ? '...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    )}

                    {brLoading ? (
                        <div className="skeleton" style={{ height: 150 }} />
                    ) : burnChartData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                            Belum ada data pengeluaran.
                        </p>
                    ) : (
                        <div className="chart-container" style={{ height: 300, marginTop: 8 }}>
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
            )}
        </div>
    );
}
