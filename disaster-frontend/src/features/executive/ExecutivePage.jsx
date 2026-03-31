import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    AlertTriangle, ClipboardList, MapPin, RefreshCw,
    DollarSign, Filter, Tv, BarChart3,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    useDashboardKpi,
    useDashboardPriorities,
    useMapGeoJson,
    useRecentDecisions,
    useFundingSummary,
    useActiveEvents,
} from './hooks/useDashboard';
import queryClient from '../../lib/queryClient';
import { dashboardKeys } from './hooks/useDashboard';

// ── Custom map marker icon ───────────────────────────────────────
const makeMarkerIcon = (color, isCritical = false) => L.divIcon({
    className: '',
    html: `<div class="${isCritical ? 'marker-pulse' : ''}" style="
        background:${color};
        width:${isCritical ? 14 : 12}px;height:${isCritical ? 14 : 12}px;border-radius:50%;
        box-shadow:0 0 ${isCritical ? 16 : 10}px ${color};
        border:2px solid rgba(255,255,255,${isCritical ? 1 : 0.8});
    "></div>`,
    iconSize: [isCritical ? 14 : 12, isCritical ? 14 : 12],
    iconAnchor: [isCritical ? 7 : 6, isCritical ? 7 : 6],
});

const SEVERITY_COLOR = {
    kritis: '#ef4444',
    berat: '#f97316',
    sedang: '#f59e0b',
    ringan: '#22c55e',
};

const EVENT_TYPE_LABEL = {
    banjir: 'Banjir', longsor: 'Longsor', gempa: 'Gempa',
    karhutla: 'Karhutla', angin_kencang: 'Angin Kencang', lainnya: 'Lainnya',
};

const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a855f7', '#ec4899'];

const rupiah = (v) => Number(v || 0).toLocaleString('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

// ── Auto-resize helper — fixes Leaflet rendering bug on container resize ──
function MapAutoResize() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [map]);
    return null;
}

function KpiSkeleton() {
    return (
        <div className="kpi-grid">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="kpi-card skeleton" style={{ height: 80 }} />
            ))}
        </div>
    );
}

// ── Countdown for auto-refresh indicator ─────────────────────────
function AutoRefreshBadge() {
    const [countdown, setCountdown] = useState(30);
    useEffect(() => {
        const t = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums',
        }}>
            <Tv size={11} /> Auto-refresh {countdown}s
        </span>
    );
}

export default function ExecutivePage() {
    // ── Global event filter ──────────────────────────────────────
    const [filterEventId, setFilterEventId] = useState('');

    // ── Data hooks ───────────────────────────────────────────────
    const { data: kpi, isLoading: kpiLoading, isError: kpiError } = useDashboardKpi(filterEventId || undefined);
    const { data: priorities = [], isLoading: prioLoading } = useDashboardPriorities(filterEventId || undefined);
    const { data: geoJson, isLoading: mapLoading } = useMapGeoJson(filterEventId || undefined);
    const { data: decisions = [], isLoading: decLoading } = useRecentDecisions(5, filterEventId || undefined);
    const { data: funding, isLoading: fundLoading } = useFundingSummary(filterEventId || undefined);
    const { data: activeEvents = [] } = useActiveEvents();

    // ── Map features (filtered by API) ───────────────────────────
    const mapFeatures = useMemo(() => {
        return geoJson?.features ?? [];
    }, [geoJson]);

    // ── KPI Cards (with funding) ─────────────────────────────────
    const kpiCards = kpi ? [
        { title: 'Kejadian Aktif', value: kpi.totalKejadian, unit: 'Titik', type: 'danger' },
        { title: 'Meninggal / Luka', value: `${kpi.totalMeninggal} / ${kpi.totalLuka}`, unit: 'Jiwa', type: 'danger' },
        { title: 'Pengungsi', value: kpi.totalPengungsi?.toLocaleString('id-ID') ?? '—', unit: 'Jiwa', type: 'warning' },
        { title: 'Rumah Rusak', value: kpi.totalRumahRusak, unit: 'Unit', type: 'danger' },
        { title: 'Jalan Putus', value: kpi.totalAksesJalanPutus, unit: 'Titik', type: 'warning' },
        // Funding cards
        ...(funding ? [
            { title: 'Total Anggaran', value: rupiah(funding.totalAllocated), unit: '', type: 'info' },
            {
                title: 'Sisa Dana',
                value: rupiah(funding.remaining),
                unit: `${funding.burnPct}% terpakai`,
                type: funding.remaining > 0 ? 'success' : 'danger',
            },
        ] : []),
    ] : [];

    // ── Chart: Events by type (Bar chart) ────────────────────────
    const eventsByType = useMemo(() => {
        const counts = {};
        activeEvents.forEach(ev => {
            const label = EVENT_TYPE_LABEL[ev.type] ?? ev.type;
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).map(([name, jumlah]) => ({ name, jumlah }));
    }, [activeEvents]);

    // ── Chart: Severity distribution (Pie chart) ──────────────────
    const severityDist = useMemo(() => {
        const counts = {};
        activeEvents.forEach(ev => {
            const label = ev.severity ?? 'ringan';
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [activeEvents]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* ── Toolbar: Filter + Refresh ─────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14, flexWrap: 'wrap', gap: 10,
            }}>
                {/* Global event filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                    <select
                        id="global-event-filter"
                        className="form-input"
                        style={{ width: 280, padding: '7px 12px', fontSize: '0.82rem' }}
                        value={filterEventId}
                        onChange={e => setFilterEventId(e.target.value)}
                    >
                        <option value="">Semua Kejadian Aktif</option>
                        {activeEvents.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} — {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AutoRefreshBadge />
                    <button
                        id="dashboard-refresh"
                        className="btn btn-outline"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', gap: 6, display: 'flex', alignItems: 'center' }}
                        onClick={handleRefresh}
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── KPI Grid ─────────────────────────────────────────── */}
            {kpiLoading || fundLoading ? <KpiSkeleton /> : kpiError ? (
                <div className="alert alert-error">Gagal memuat data KPI. Periksa koneksi ke server.</div>
            ) : (
                <div className="kpi-grid">
                    {kpiCards.map((k, i) => (
                        <div key={i} className={`kpi-card ${k.type}`}>
                            <div className="kpi-title">{k.title}</div>
                            <div className="kpi-value" style={{
                                fontSize: k.title.includes('Anggaran') || k.title.includes('Sisa') ? '1.05rem' : undefined,
                            }}>
                                {k.value}{' '}
                                {k.unit && <span className="kpi-unit">{k.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Map + Side Panels ───────────────────────────────── */}
            <div className="grid-2-1" style={{ marginBottom: 16, alignItems: 'stretch' }}>
                {/* Peta */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header mb-0">
                        <div className="card-title">
                            <MapPin size={15} /> PETA SEBARAN KEJADIAN
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {mapFeatures.length} titik
                        </span>
                    </div>
                    <div className="map-wrapper" style={{ marginTop: 10, flex: 1, minHeight: 300 }}>
                        {!mapLoading && (
                            <MapContainer
                                center={[-1.5, 121]}
                                zoom={7}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                <MapAutoResize />
                                {mapFeatures.map((f, i) => {
                                    const [lng, lat] = f.geometry.coordinates;
                                    const isEvent = f.properties.layerType === 'event';
                                    const isCritical = isEvent && f.properties.severity === 'kritis';
                                    const color = isEvent
                                        ? (SEVERITY_COLOR[f.properties.severity] ?? '#f59e0b')
                                        : '#3b82f6';
                                    return (
                                        <Marker
                                            key={i}
                                            position={[lat, lng]}
                                            icon={makeMarkerIcon(color, isCritical)}
                                        >
                                            <Popup>
                                                <strong>
                                                    {f.properties.title ?? f.properties.name}
                                                </strong>
                                                <br />
                                                {isEvent
                                                    ? `Tipe: ${EVENT_TYPE_LABEL[f.properties.type] ?? f.properties.type} | Severity: ${f.properties.severity} | Status: ${f.properties.status}`
                                                    : `Kapasitas: ${f.properties.occupancy ?? 0} / ${f.properties.capacity ?? 0}`
                                                }
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        )}
                    </div>
                </div>

                {/* Side panels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Top Prioritas */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title text-red">
                                <AlertTriangle size={15} /> TOP PRIORITAS
                            </div>
                        </div>
                        {prioLoading ? (
                            <div className="skeleton" style={{ height: 80 }} />
                        ) : priorities.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                Tidak ada task prioritas aktif.
                            </p>
                        ) : (
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {priorities.map((p, i) => (
                                    <li
                                        key={p.id}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-secondary)',
                                            borderLeft: `3px solid ${p.priority === 'critical' || p.priority === 'kritis'
                                                    ? 'var(--status-red)'
                                                    : 'var(--status-yellow)'
                                                }`,
                                            fontSize: '0.82rem',
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>
                                        {p.title}
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                            PIC: {p.assigned_to ?? p.assigned_to_opd ?? '—'}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Log Keputusan */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title text-blue">
                                <ClipboardList size={15} /> LOG KEPUTUSAN
                            </div>
                        </div>
                        {decLoading ? (
                            <div className="skeleton" style={{ height: 80 }} />
                        ) : decisions.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                Belum ada keputusan yang dicatat.
                            </p>
                        ) : (
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {decisions.map((d) => (
                                    <li
                                        key={d.id}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-secondary)',
                                            borderLeft: '3px solid var(--accent-primary)',
                                            fontSize: '0.82rem',
                                        }}
                                    >
                                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 2 }}>
                                            {d.decided_by ?? '—'} — {d.decided_at
                                                ? new Date(d.decided_at).toLocaleDateString('id-ID')
                                                : '—'}
                                        </div>
                                        {d.decision_text ?? d.title ?? '—'}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Charts Row ──────────────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: 16 }}>
                {/* Bar Chart: Kejadian per Tipe */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <BarChart3 size={15} /> KEJADIAN PER JENIS BENCANA
                        </div>
                    </div>
                    <div className="chart-container">
                        {eventsByType.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>
                                Belum ada data kejadian aktif.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventsByType} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="jumlah" name="Jumlah" radius={[4, 4, 0, 0]}>
                                        {eventsByType.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Distribusi Severity */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <AlertTriangle size={15} /> DISTRIBUSI TINGKAT KEPARAHAN
                        </div>
                    </div>
                    <div className="chart-container">
                        {severityDist.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>
                                Belum ada data.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={severityDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={{ stroke: 'var(--text-muted)' }}
                                    >
                                        {severityDist.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={SEVERITY_COLOR[entry.name] ?? '#94a3b8'}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        wrapperStyle={{ fontSize: '0.75rem' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Funding Progress Bar (below charts) ─────────────── */}
            {funding && funding.totalAllocated > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <div className="card-title">
                            <DollarSign size={15} /> PENYERAPAN ANGGARAN (BTT)
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {funding.burnPct}% terserap
                        </span>
                    </div>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
                        marginBottom: 14
                    }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>
                                Total Alokasi
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-blue)' }}>
                                {rupiah(funding.totalAllocated)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>
                                Total Terpakai
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-red)' }}>
                                {rupiah(funding.totalSpent)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>
                                Sisa Dana
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: funding.remaining > 0 ? 'var(--status-green)' : 'var(--status-red)' }}>
                                {rupiah(funding.remaining)}
                            </div>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                        height: 10, borderRadius: 5,
                        background: 'var(--bg-secondary)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 5,
                            width: `${Math.min(100, funding.burnPct)}%`,
                            background: funding.burnPct >= 90
                                ? 'linear-gradient(90deg, var(--status-red), #f97316)'
                                : funding.burnPct >= 70
                                    ? 'linear-gradient(90deg, var(--status-yellow), #f97316)'
                                    : 'linear-gradient(90deg, var(--status-blue), #3b82f6)',
                            transition: 'width 0.6s ease',
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}
