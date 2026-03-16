import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, ClipboardList, MapPin, RefreshCw } from 'lucide-react';
import {
    useDashboardKpi,
    useDashboardPriorities,
    useMapGeoJson,
    useRecentDecisions,
} from './hooks/useDashboard';
import queryClient from '../../lib/queryClient';
import { dashboardKeys } from './hooks/useDashboard';

// Custom map marker icon
const makeMarkerIcon = (color) => L.divIcon({
    className: '',
    html: `<div style="
        background:${color};
        width:12px;height:12px;border-radius:50%;
        box-shadow:0 0 10px ${color};
        border:2px solid rgba(255,255,255,0.8);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const SEVERITY_COLOR = {
    kritis: '#ef4444',
    berat: '#f97316',
    sedang: '#f59e0b',
    ringan: '#22c55e',
};

function KpiSkeleton() {
    return (
        <div className="kpi-grid">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="kpi-card skeleton" style={{ height: 80 }} />
            ))}
        </div>
    );
}

export default function ExecutivePage() {
    const { data: kpi, isLoading: kpiLoading, isError: kpiError } = useDashboardKpi();
    const { data: priorities = [], isLoading: prioLoading } = useDashboardPriorities();
    const { data: geoJson, isLoading: mapLoading } = useMapGeoJson();
    const { data: decisions = [], isLoading: decLoading } = useRecentDecisions(5);

    const mapFeatures = geoJson?.features ?? [];

    const kpiCards = kpi ? [
        { title: 'Kejadian Aktif', value: kpi.totalKejadian, unit: 'Titik', type: 'danger' },
        { title: 'Meninggal / Luka', value: `${kpi.totalMeninggal} / ${kpi.totalLuka}`, unit: 'Jiwa', type: 'danger' },
        { title: 'Pengungsi', value: kpi.totalPengungsi?.toLocaleString('id-ID') ?? '—', unit: 'Jiwa', type: 'warning' },
        { title: 'Rumah Rusak', value: kpi.totalRumahRusak, unit: 'Unit', type: 'danger' },
        { title: 'Jalan Putus', value: kpi.totalAksesJalanPutus, unit: 'Titik', type: 'warning' },
    ] : [];

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* ── KPI Grid ─────────────────────────────────────────── */}
            {kpiLoading ? <KpiSkeleton /> : kpiError ? (
                <div className="alert alert-error">Gagal memuat data KPI. Periksa koneksi ke server.</div>
            ) : (
                <div className="kpi-grid">
                    {kpiCards.map((k, i) => (
                        <div key={i} className={`kpi-card ${k.type}`}>
                            <div className="kpi-title">{k.title}</div>
                            <div className="kpi-value">
                                {k.value}{' '}
                                {k.unit && <span className="kpi-unit">{k.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Refresh button ───────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                    id="dashboard-refresh"
                    className="btn btn-outline"
                    style={{ padding: '5px 12px', fontSize: '0.78rem', gap: 6, display: 'flex', alignItems: 'center' }}
                    onClick={handleRefresh}
                >
                    <RefreshCw size={13} /> Refresh Data
                </button>
            </div>

            {/* ── Map + Side Panels ─────────────────────────────────── */}
            <div className="grid-2-1">
                {/* Peta */}
                <div className="card">
                    <div className="card-header mb-0">
                        <div className="card-title">
                            <MapPin size={15} /> PETA SEBARAN KEJADIAN
                        </div>
                    </div>
                    <div className="map-wrapper" style={{ marginTop: 10 }}>
                        {!mapLoading && (
                            <MapContainer
                                center={[-2.5, 118]}
                                zoom={5}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                {mapFeatures.map((f, i) => {
                                    const [lng, lat] = f.geometry.coordinates;
                                    const isEvent = f.properties.layerType === 'event';
                                    const color = isEvent
                                        ? (SEVERITY_COLOR[f.properties.severity] ?? '#f59e0b')
                                        : '#3b82f6';
                                    return (
                                        <Marker
                                            key={i}
                                            position={[lat, lng]}
                                            icon={makeMarkerIcon(color)}
                                        >
                                            <Popup>
                                                <strong>
                                                    {f.properties.title ?? f.properties.name}
                                                </strong>
                                                <br />
                                                {isEvent
                                                    ? `Tipe: ${f.properties.type} | Status: ${f.properties.status}`
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
        </div>
    );
}
