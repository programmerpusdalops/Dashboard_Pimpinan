import { useState } from 'react';
import { Users, Baby, HeartPulse, Tent, Plus, X, ChevronRight, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    useShelters, useRefugeesSummary, useCreateShelter,
} from './hooks/useRefugees';
import { usePermission } from '../../hooks/usePermission';

// ── Helpers ──────────────────────────────────────────────────────
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

const TOOLTIP_STYLE = {
    contentStyle: {
        background: '#1a1f2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        fontSize: 12,
    },
};

const occupancyPill = (cur, cap) => {
    if (!cap) return 'pill-info';
    const pct = cur / cap;
    if (pct >= 1) return 'pill-critical';
    if (pct >= 0.85) return 'pill-warn';
    return 'pill-safe';
};

const EMPTY_FORM = { name: '', location_name: '', capacity: '', pic_name: '', latitude: '', longitude: '' };

// ── Main Page ────────────────────────────────────────────────────
export default function RefugeesPage() {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const { isOperator } = usePermission();

    const { data: summary, isLoading: sumLoading } = useRefugeesSummary();
    const { data: shelters = [], isLoading: shelterLoading, isError: shelterError } = useShelters();
    const createShelter = useCreateShelter();

    // Chart data
    const barData = shelters
        .slice(0, 12)
        .map(s => ({ name: s.name?.substring(0, 14) ?? '—', jiwa: s.current_occupancy ?? 0 }));

    const pieData = summary ? [
        { name: 'Balita', value: summary.totalBalita ?? 0 },
        { name: 'Lansia', value: summary.totalLansia ?? 0 },
        { name: 'Ibu Hamil', value: summary.totalIbuHamil ?? 0 },
        { name: 'Disabilitas', value: summary.totalDisabilitas ?? 0 },
    ].filter(d => d.value > 0) : [];

    const handleCreate = async (e) => {
        e.preventDefault();
        await createShelter.mutateAsync({ ...form, capacity: Number(form.capacity) });
        setForm(EMPTY_FORM);
        setShowForm(false);
    };

    const totalVulnerable = (summary?.totalBalita ?? 0) + (summary?.totalLansia ?? 0);

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* ── KPI Summary ── */}
            <div className="kpi-grid" style={{ marginBottom: 20 }}>
                <div className="kpi-card warning">
                    <div className="kpi-title"><Users size={13} /> Total Pengungsi</div>
                    <div className="kpi-value">
                        {sumLoading ? '—' : (summary?.totalJiwa?.toLocaleString('id-ID') ?? 0)}
                        <span className="kpi-unit"> Jiwa</span>
                    </div>
                </div>
                <div className="kpi-card info">
                    <div className="kpi-title"><Tent size={13} /> Total Posko Aktif</div>
                    <div className="kpi-value">
                        {shelters.filter(s => s.status === 'aktif').length}
                        <span className="kpi-unit"> Posko</span>
                    </div>
                </div>
                <div className="kpi-card danger">
                    <div className="kpi-title"><Baby size={13} /> Kelompok Rentan</div>
                    <div className="kpi-value">
                        {sumLoading ? '—' : totalVulnerable.toLocaleString('id-ID')}
                        <span className="kpi-unit"> Jiwa</span>
                    </div>
                </div>
                <div className="kpi-card success">
                    <div className="kpi-title"><HeartPulse size={13} /> Kapasitas Tersisa</div>
                    <div className="kpi-value">
                        {shelters.reduce((s, sh) => s + Math.max(0, (sh.capacity - (sh.current_occupancy ?? 0))), 0).toLocaleString('id-ID')}
                        <span className="kpi-unit"> Tempat</span>
                    </div>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
                {/* Bar chart */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title"><Activity size={14} /> Distribusi Pengungsi per Posko</div>
                    </div>
                    <div className="chart-container">
                        {shelterLoading ? (
                            <div className="skeleton" style={{ height: '100%' }} />
                        ) : barData.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Data kosong.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip {...TOOLTIP_STYLE} />
                                    <Bar dataKey="jiwa" name="Pengungsi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie chart */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title"><Baby size={14} /> Demografi Kelompok Rentan</div>
                    </div>
                    <div className="chart-container">
                        {sumLoading ? (
                            <div className="skeleton" style={{ height: '100%' }} />
                        ) : pieData.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Data kosong.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={85}
                                        dataKey="value" paddingAngle={3}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip {...TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Shelter Table ── */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title"><Tent size={15} /> DAFTAR POSKO PENGUNGSIAN</div>
                    {isOperator && (
                        <button
                            className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={() => setShowForm(v => !v)}
                        >
                            {showForm ? <><X size={13} /> Tutup</> : <><Plus size={13} /> Tambah Posko</>}
                        </button>
                    )}
                </div>

                {showForm && (
                    <form onSubmit={handleCreate}
                        style={{
                            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: 10, marginBottom: 16,
                            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'
                        }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nama Posko</label>
                            <input className="form-input" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Lokasi</label>
                            <input className="form-input" value={form.location_name}
                                onChange={e => setForm({ ...form, location_name: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kapasitas</label>
                            <input className="form-input" type="number" min="1" value={form.capacity}
                                onChange={e => setForm({ ...form, capacity: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">PIC</label>
                            <input className="form-input" value={form.pic_name}
                                onChange={e => setForm({ ...form, pic_name: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary"
                                disabled={createShelter.isPending}>
                                {createShelter.isPending ? '...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                )}

                {shelterLoading ? (
                    <div className="skeleton" style={{ height: 120 }} />
                ) : shelterError ? (
                    <div className="alert alert-error">Gagal memuat data posko.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Posko</th>
                                <th>Lokasi</th>
                                <th>Status</th>
                                <th>Terisi / Kapasitas</th>
                                <th>Hunian</th>
                                <th>PIC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shelters.map(s => {
                                const pct = s.capacity > 0 ? Math.round(((s.current_occupancy ?? 0) / s.capacity) * 100) : 0;
                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <ChevronRight size={13} style={{ color: 'var(--accent-primary)' }} />
                                                {s.name}
                                            </span>
                                        </td>
                                        <td>{s.location_name ?? '—'}</td>
                                        <td>
                                            <span className={`pill ${s.status === 'aktif' ? 'pill-safe' : s.status === 'penuh' ? 'pill-warn' : 'pill-critical'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {(s.current_occupancy ?? 0).toLocaleString('id-ID')} / {(s.capacity ?? 0).toLocaleString('id-ID')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 5, background: 'var(--bg-primary)', borderRadius: 2 }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 2, width: `${Math.min(pct, 100)}%`,
                                                        background: pct >= 100 ? 'var(--status-red)' : pct >= 85 ? 'var(--status-yellow)' : 'var(--status-green)',
                                                        transition: 'width 0.4s ease',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 30 }}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>{s.pic_name ?? '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
