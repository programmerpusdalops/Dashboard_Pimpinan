import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './MapPage.css';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Layers, X, AlertTriangle, Tent, Info,
    ChevronRight, RefreshCw, Maximize2, Filter,
    MapPin, Users, Activity,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useShelters } from '../refugees/hooks/useRefugees';
import { useDebounce } from '../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const SEVERITY = {
    kritis: { color: '#ef4444', glow: '0 0 16px #ef4444', label: 'Kritis', order: 4 },
    berat: { color: '#f97316', glow: '0 0 14px #f97316', label: 'Berat', order: 3 },
    sedang: { color: '#f59e0b', glow: '0 0 12px #f59e0b', label: 'Sedang', order: 2 },
    ringan: { color: '#22c55e', glow: '0 0 10px #22c55e', label: 'Ringan', order: 1 },
};

const SHELTER_STATUS = {
    aktif: { color: '#3b82f6', label: 'Aktif' },
    penuh: { color: '#f59e0b', label: 'Penuh' },
    tutup: { color: '#64748b', label: 'Tutup' },
};

const TILE_LAYERS = {
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satelit (Default)' },
    dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', label: 'Gelap' },
    terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', label: 'Topografi' },
};

// ─────────────────────────────────────────────────────────────────
// Marker factories
// ─────────────────────────────────────────────────────────────────
const makeEventIcon = (severity, isSelected) => {
    const { color, glow } = SEVERITY[severity] ?? SEVERITY.sedang;
    const size = isSelected ? 18 : 13;
    return L.divIcon({
        className: '',
        html: `<div style="
            background:${color};
            width:${size}px; height:${size}px; border-radius:50%;
            box-shadow:${isSelected ? '0 0 0 4px rgba(255,255,255,0.25), ' : ''}${glow};
            border:2px solid rgba(255,255,255,${isSelected ? '0.9' : '0.6'});
            transition: all 0.2s ease;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const makeShelterIcon = (status, isSelected) => {
    const { color } = SHELTER_STATUS[status] ?? SHELTER_STATUS.aktif;
    const size = isSelected ? 16 : 11;
    return L.divIcon({
        className: '',
        html: `<div style="
            background:${color};
            width:${size}px; height:${size}px;
            border-radius:3px;
            box-shadow:0 0 10px ${color};
            border:2px solid rgba(255,255,255,${isSelected ? '0.9' : '0.5'});
            transition: all 0.2s ease;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// ─────────────────────────────────────────────────────────────────
// Map controller — fly ke koordinat dari luar komponen
// ─────────────────────────────────────────────────────────────────
function MapFlyTo({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 12, { duration: 1.2 });
    }, [coords, map]);
    return null;
}

// ── Auto-resize: fixes Leaflet not re-rendering when container resizes ──
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

// ─────────────────────────────────────────────────────────────────
// Sidebar item
// ─────────────────────────────────────────────────────────────────
function SidebarItem({ feature, isSelected, onClick }) {
    const isEvent = feature.type === 'event';
    const p = feature.properties;
    const sev = SEVERITY[p.severity] ?? SEVERITY.sedang;
    const sh = SHELTER_STATUS[p.status] ?? SHELTER_STATUS.aktif;
    const accentColor = isEvent ? sev.color : sh.color;

    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', textAlign: 'left', border: 'none',
                padding: '8px 12px', cursor: 'pointer', transition: 'background 0.15s',
                borderLeft: `3px solid ${isSelected ? accentColor : 'transparent'}`,
                background: isSelected ? 'var(--map-item-active)' : 'transparent',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--map-item-hover)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                    width: 8, height: 8, borderRadius: isEvent ? '50%' : 2,
                    background: accentColor, flexShrink: 0, marginTop: 5,
                    boxShadow: `0 0 6px ${accentColor}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--map-text-main)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {p.title ?? p.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--map-text-muted)', marginTop: 2 }}>
                        {isEvent
                            ? `${p.type ?? '—'} · ${sev.label}`
                            : `${(p.occupancy ?? 0).toLocaleString('id-ID')} / ${(p.capacity ?? 0).toLocaleString('id-ID')} jiwa`
                        }
                    </div>
                </div>
                {isSelected && <ChevronRight size={13} style={{ color: accentColor, flexShrink: 0, marginTop: 3 }} />}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
// Detail panel (bawah sidebar)
// ─────────────────────────────────────────────────────────────────
function DetailPanel({ feature, onClose }) {
    if (!feature) return null;
    const p = feature.properties;
    const isEvent = feature.type === 'event';
    const sev = SEVERITY[p.severity] ?? SEVERITY.sedang;
    const sh = SHELTER_STATUS[p.status] ?? SHELTER_STATUS.aktif;
    const accentColor = isEvent ? sev.color : sh.color;
    const occupancyPct = p.capacity > 0 ? Math.min(100, Math.round(((p.occupancy ?? 0) / p.capacity) * 100)) : 0;

    return (
        <div style={{
            borderTop: '1px solid var(--map-border)',
            padding: '12px 12px 14px',
            background: 'var(--map-item-hover)',
            maxHeight: 280, overflowY: 'auto',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                        color: accentColor, marginBottom: 3,
                    }}>
                        {isEvent ? 'Kejadian Bencana' : 'Posko Pengungsian'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--map-text-main)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {p.title ?? p.name ?? '—'}
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--map-text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                    <X size={14} />
                </button>
            </div>

            {/* Info baris */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                {isEvent ? (
                    <>
                        <InfoRow label="Jenis" value={p.type ?? '—'} />
                        <InfoRow label="Status" value={p.status ?? '—'} />
                        <InfoRow label="Tingkat" value={sev.label} valueColor={sev.color} />
                        <InfoRow label="Lokasi" value={p.location_name ?? '—'} />
                        {p.meninggal !== undefined && <InfoRow label="Meninggal" value={`${p.meninggal} jiwa`} valueColor="#ef4444" />}
                        {p.luka !== undefined && <InfoRow label="Luka" value={`${p.luka} jiwa`} valueColor="#f59e0b" />}
                        {p.hilang !== undefined && <InfoRow label="Hilang" value={`${p.hilang} jiwa`} valueColor="#f97316" />}
                        {p.rumahRusak !== undefined && <InfoRow label="Rumah Rusak" value={`${p.rumahRusak} unit`} />}
                    </>
                ) : (
                    <>
                        <InfoRow label="Status" value={sh.label} valueColor={sh.color} />
                        <InfoRow label="Lokasi" value={p.location_name ?? '—'} />
                        <InfoRow label="PIC" value={p.pic_name ?? '—'} />
                        <InfoRow label="Pengungsi"
                            value={`${(p.occupancy ?? 0).toLocaleString('id-ID')} / ${(p.capacity ?? 0).toLocaleString('id-ID')} jiwa`} />
                        {p.capacity > 0 && (
                            <div style={{ marginTop: 4 }}>
                                <div style={{ height: 5, background: 'var(--map-bar-track)', borderRadius: 2 }}>
                                    <div style={{
                                        height: '100%', width: `${occupancyPct}%`, borderRadius: 2,
                                        background: occupancyPct >= 100 ? '#ef4444' : occupancyPct >= 85 ? '#f59e0b' : 'var(--accent-primary)',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--map-text-muted)', marginTop: 2 }}>
                                    {occupancyPct}% terisi
                                </div>
                            </div>
                        )}
                    </>
                )}
                <InfoRow label="Koordinat"
                    value={`${feature.coords[0].toFixed(4)}, ${feature.coords[1].toFixed(4)}`}
                    mono />
            </div>
        </div>
    );
}

function InfoRow({ label, value, valueColor, mono }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
            <span style={{
                color: valueColor ?? 'var(--text-secondary)', fontWeight: 500, textAlign: 'right',
                fontFamily: mono ? 'monospace' : undefined,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
            }}>
                {value}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Popup detail — shown inside Leaflet popup on marker click
// ─────────────────────────────────────────────────────────────────
function PopupDetail({ feature }) {
    const p = feature.properties;
    const isEvent = feature.type === 'event';
    const sev = SEVERITY[p.severity] ?? SEVERITY.sedang;
    const sh = SHELTER_STATUS[p.status] ?? SHELTER_STATUS.aktif;
    const accentColor = isEvent ? sev.color : sh.color;
    const occupancyPct = p.capacity > 0 ? Math.min(100, Math.round(((p.occupancy ?? 0) / p.capacity) * 100)) : 0;

    return (
        <div style={{ minWidth: 200, maxWidth: 260, fontSize: 13, color: 'var(--text-main)' }}>
            {/* Header badge */}
            <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                color: accentColor, marginBottom: 4,
            }}>
                {isEvent ? 'Kejadian Bencana' : 'Posko Pengungsian'}
            </div>

            {/* Title */}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.3, wordBreak: 'break-word' }}>
                {p.title ?? p.name ?? '—'}
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {isEvent ? (
                    <>
                        <InfoRow label="Jenis" value={p.type ?? '—'} />
                        <InfoRow label="Status" value={p.status ?? '—'} />
                        <InfoRow label="Tingkat" value={sev.label} valueColor={sev.color} />
                        <InfoRow label="Lokasi" value={p.location_name ?? '—'} />
                        {p.meninggal !== undefined && <InfoRow label="Meninggal" value={`${p.meninggal} jiwa`} valueColor="#ef4444" />}
                        {p.luka !== undefined && <InfoRow label="Luka" value={`${p.luka} jiwa`} valueColor="#f59e0b" />}
                        {p.hilang !== undefined && <InfoRow label="Hilang" value={`${p.hilang} jiwa`} valueColor="#f97316" />}
                        {p.rumahRusak !== undefined && <InfoRow label="Rumah Rusak" value={`${p.rumahRusak} unit`} />}
                    </>
                ) : (
                    <>
                        <InfoRow label="Status" value={sh.label} valueColor={sh.color} />
                        <InfoRow label="Lokasi" value={p.location_name ?? '—'} />
                        <InfoRow label="PIC" value={p.pic_name ?? '—'} />
                        <InfoRow label="Pengungsi"
                            value={`${(p.occupancy ?? 0).toLocaleString('id-ID')} / ${(p.capacity ?? 0).toLocaleString('id-ID')} jiwa`} />
                        {p.capacity > 0 && (
                            <div style={{ marginTop: 4 }}>
                                <div style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                                    <div style={{
                                        height: '100%', width: `${occupancyPct}%`, borderRadius: 2,
                                        background: occupancyPct >= 100 ? '#ef4444' : occupancyPct >= 85 ? '#f59e0b' : 'var(--accent-primary)',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {occupancyPct}% terisi
                                </div>
                            </div>
                        )}
                    </>
                )}
                <InfoRow label="Koordinat"
                    value={`${feature.coords[0].toFixed(4)}, ${feature.coords[1].toFixed(4)}`}
                    mono />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────────
function Legend({ showShelter }) {
    return (
        <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 800,
            background: 'var(--map-overlay-bg)', backdropFilter: 'blur(8px)',
            border: '1px solid var(--map-border)', borderRadius: 10,
            padding: '10px 12px', minWidth: 140,
        }}>
            <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', color: 'var(--map-text-muted)', marginBottom: 6
            }}>
                Legenda
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {Object.entries(SEVERITY).reverse().map(([key, { color, label }]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--map-text-sec)' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                        Bencana — {label}
                    </div>
                ))}
                {showShelter && Object.entries(SHELTER_STATUS).map(([key, { color, label }]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--map-text-sec)' }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
                        Posko — {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function MapPage() {
    // State
    const [activeLayer, setActiveLayer] = useState('semua');   // semua | event | shelter
    const [activeSeverity, setActiveSeverity] = useState('semua'); // semua | kritis | berat | ...
    const [tileKey, setTileKey] = useState('satellite');
    const [showTileMenu, setShowTileMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);          // feature yang dipilih
    const [flyTo, setFlyTo] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef(null);

    const debouncedSearch = useDebounce(search, 300);

    // Data fetching
    const { data: geoJson, isLoading: geoLoading, refetch: refetchMap } = useQuery({
        queryKey: ['map-geojson'],
        queryFn: () => dashboardService.getMapGeoJson(),
        staleTime: 1000 * 60 * 3,
    });
    const { data: shelters = [] } = useShelters();

    // Normalize all features to a unified list
    const allFeatures = useMemo(() => {
        const result = [];
        const geoFeatures = geoJson?.features ?? [];

        geoFeatures.forEach((f, index) => {
            if (!f.geometry?.coordinates) return;
            const [lng, lat] = f.geometry.coordinates;
            result.push({
                id: `${f.properties.layerType}-${f.properties.id ?? f.id ?? index}`,
                type: f.properties.layerType,  // 'event' | 'shelter'
                coords: [lat, lng],
                properties: f.properties,
            });
        });

        // Merge shelters jika belum ada dari geoJson
        const existingShelterIds = new Set(
            result.filter(f => f.type === 'shelter').map(f => f.properties.id)
        );
        shelters.forEach(s => {
            if (!s.latitude || !s.longitude || existingShelterIds.has(s.id)) return;
            result.push({
                id: `shelter-${s.id}`,
                type: 'shelter',
                coords: [Number(s.latitude), Number(s.longitude)],
                properties: {
                    id: s.id, layerType: 'shelter',
                    name: s.name, status: s.status,
                    capacity: s.capacity, occupancy: s.current_occupancy,
                    location_name: s.location_name, pic_name: s.pic_name,
                },
            });
        });

        return result;
    }, [geoJson, shelters]);

    // Statistics
    const stats = useMemo(() => {
        const events = allFeatures.filter(f => f.type === 'event');
        const shelters = allFeatures.filter(f => f.type === 'shelter');
        const kritis = events.filter(f => f.properties.severity === 'kritis').length;
        const totalPengungsi = shelters.reduce((s, f) => s + (f.properties.occupancy ?? 0), 0);
        return { events: events.length, shelters: shelters.length, kritis, totalPengungsi };
    }, [allFeatures]);

    // Filtered list for sidebar + map
    const filtered = useMemo(() => {
        return allFeatures.filter(f => {
            if (activeLayer !== 'semua' && f.type !== activeLayer) return false;
            if (activeLayer !== 'shelter' && activeSeverity !== 'semua' && f.type === 'event') {
                if (f.properties.severity !== activeSeverity) return false;
            }
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase();
                const { title, name, type, location_name } = f.properties;
                if (!`${title ?? ''} ${name ?? ''} ${type ?? ''} ${location_name ?? ''}`.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [allFeatures, activeLayer, activeSeverity, debouncedSearch]);

    // Handlers
    const handleSelectFeature = useCallback((f) => {
        setSelected(f);
        setFlyTo({ lat: f.coords[0], lng: f.coords[1], _ts: Date.now() }); // trigger useEffect di MapFlyTo
    }, []);

    const handleMarkerClick = useCallback((f) => {
        setSelected(f);
    }, []);

    const SIDEBAR_W = 340;

    return (
        <div style={{ position: 'relative', height: 'calc(100vh - 84px)', overflow: 'hidden', margin: '0', background: 'var(--bg-primary)' }}>

            {/* ── MAP ─────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', inset: 0, right: sidebarOpen ? SIDEBAR_W : 0, transition: 'right 0.3s ease' }}>
                {geoLoading && (
                    <div style={{
                        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 900, background: 'var(--map-overlay-bg)', borderRadius: 8,
                        padding: '6px 14px', fontSize: 12, color: 'var(--map-text-sec)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        Memuat data peta...
                    </div>
                )}

                <MapContainer
                    center={[-1.5, 121]} zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                    ref={mapRef}
                >
                    <TileLayer key={tileKey} url={TILE_LAYERS[tileKey].url}
                        maxZoom={19} subdomains={tileKey === 'dark' ? 'abcd' : 'abc'} />

                    <MapFlyTo coords={flyTo} />
                    <MapAutoResize />

                    {filtered.map(f => {
                        const isSel = selected?.id === f.id;
                        const icon = f.type === 'event'
                            ? makeEventIcon(f.properties.severity, isSel)
                            : makeShelterIcon(f.properties.status, isSel);

                        return (
                            <Marker
                                key={f.id}
                                position={f.coords}
                                icon={icon}
                                eventHandlers={{ click: () => handleMarkerClick(f) }}
                                zIndexOffset={isSel ? 1000 : 0}
                            >
                                <Popup
                                    closeButton
                                    offset={[0, -4]}
                                    className="custom-popup"
                                    maxWidth={280}
                                >
                                    <PopupDetail feature={f} />
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* ── Legend ── */}
                <Legend showShelter={activeLayer !== 'event'} />

                {/* ── Map controls (top-left) ── */}
                <div style={{
                    position: 'absolute', top: 12, left: 16, zIndex: 800,
                    display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                    {/* Basemap picker */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setShowTileMenu(v => !v); setShowFilterMenu(false); }}
                            style={mapCtrlBtn}
                            title="Ganti basemap"
                        >
                            <Layers size={15} />
                        </button>
                        {showTileMenu && (
                            <div style={dropdownStyle}>
                                <div style={dropdownLabel}>Basemap</div>
                                {Object.entries(TILE_LAYERS).map(([k, { label }]) => (
                                    <button key={k}
                                        onClick={() => { setTileKey(k); setShowTileMenu(false); }}
                                        style={{
                                            ...dropdownItem,
                                            color: tileKey === k ? 'var(--accent-primary)' : 'var(--map-text-sec)',
                                            fontWeight: tileKey === k ? 700 : 400,
                                        }}>
                                        {tileKey === k && '✓ '}{label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter severity */}
                    {activeLayer !== 'shelter' && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => { setShowFilterMenu(v => !v); setShowTileMenu(false); }}
                                style={{ ...mapCtrlBtn, color: activeSeverity !== 'semua' ? SEVERITY[activeSeverity]?.color : 'var(--map-text-sec)' }}
                                title="Filter tingkat keparahan"
                            >
                                <Filter size={15} />
                            </button>
                            {showFilterMenu && (
                                <div style={dropdownStyle}>
                                    <div style={dropdownLabel}>Tingkat Keparahan</div>
                                    {['semua', ...Object.keys(SEVERITY)].map(k => (
                                        <button key={k}
                                            onClick={() => { setActiveSeverity(k); setShowFilterMenu(false); }}
                                            style={{
                                                ...dropdownItem,
                                                color: activeSeverity === k
                                                    ? (SEVERITY[k]?.color ?? 'var(--accent-primary)')
                                                    : 'var(--map-text-sec)',
                                                fontWeight: activeSeverity === k ? 700 : 400,
                                            }}>
                                            {activeSeverity === k && '✓ '}
                                            {k === 'semua' ? 'Semua Tingkat' : SEVERITY[k].label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Refresh */}
                    <button onClick={refetchMap} style={mapCtrlBtn} title="Refresh data">
                        <RefreshCw size={15} />
                    </button>
                </div>

                {/* ── Toggle sidebar button ── */}
                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 800,
                        ...mapCtrlBtn,
                        color: sidebarOpen ? 'var(--accent-primary)' : 'var(--map-text-sec)',
                    }}
                    title={sidebarOpen ? 'Sembunyikan panel' : 'Tampilkan panel'}
                >
                    <Maximize2 size={15} />
                </button>

                {/* ── Stats bar (bottom center) ── */}
                <div style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 800, display: 'flex', gap: 1,
                    background: 'var(--map-overlay-bg)', backdropFilter: 'blur(8px)',
                    border: '1px solid var(--map-border)', borderRadius: 10,
                    padding: '5px 3px', fontSize: 12,
                }}>
                    <StatChip icon={<AlertTriangle size={11} />} value={stats.events} label="Kejadian" color="#f59e0b" />
                    <div style={{ width: 1, background: 'var(--map-border)', margin: '0 1px' }} />
                    <StatChip icon={<Activity size={11} />} value={stats.kritis} label="Kritis" color="#ef4444" />
                    <div style={{ width: 1, background: 'var(--map-border)', margin: '0 1px' }} />
                    <StatChip icon={<Tent size={11} />} value={stats.shelters} label="Posko" color="var(--accent-primary)" />
                    <div style={{ width: 1, background: 'var(--map-border)', margin: '0 1px' }} />
                    <StatChip icon={<Users size={11} />} value={stats.totalPengungsi.toLocaleString('id-ID')} label="Pengungsi" color="#10b981" />
                </div>
            </div>

            {/* ── SIDEBAR ─────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: SIDEBAR_W,
                background: 'var(--map-sidebar-bg)',
                backdropFilter: 'blur(12px)',
                borderLeft: '1px solid var(--map-border)',
                display: 'flex', flexDirection: 'column',
                transform: sidebarOpen ? 'translateX(0)' : `translateX(${SIDEBAR_W}px)`,
                transition: 'transform 0.3s ease',
                zIndex: 700,
            }}>
                {/* Sidebar header */}
                <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--map-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <MapPin size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--map-text-main)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Peta Risiko & Dampak
                        </span>
                    </div>

                    {/* Layer tabs */}
                    <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                        {[
                            { key: 'semua', label: 'Semua', count: allFeatures.length },
                            { key: 'event', label: 'Bencana', count: allFeatures.filter(f => f.type === 'event').length },
                            { key: 'shelter', label: 'Posko', count: allFeatures.filter(f => f.type === 'shelter').length },
                        ].map(({ key, label, count }) => (
                            <button key={key}
                                onClick={() => { setActiveLayer(key); setActiveSeverity('semua'); setSelected(null); }}
                                style={{
                                    flex: 1, padding: '5px 3px', border: 'none', borderRadius: 6, cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                                    background: activeLayer === key ? 'var(--accent-primary)' : 'var(--map-btn-bg)',
                                    color: activeLayer === key ? '#fff' : 'var(--map-text-muted)',
                                }}>
                                {label}
                                <span style={{ marginLeft: 3, fontSize: 10, opacity: 0.8 }}>
                                    ({count})
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={12} style={{
                            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--map-text-muted)', pointerEvents: 'none',
                        }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari lokasi, jenis..."
                            style={{
                                width: '100%', padding: '6px 28px 6px 28px',
                                background: 'var(--map-btn-bg)',
                                border: '1px solid var(--map-border)',
                                borderRadius: 6, color: 'var(--map-text-main)', fontSize: 12,
                                outline: 'none', fontFamily: 'inherit',
                            }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                style={{
                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--map-text-muted)', cursor: 'pointer', padding: 0
                                }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--map-text-muted)' }}>
                        {filtered.length} dari {allFeatures.length} titik ditampilkan
                    </div>
                </div>

                {/* Sidebar list */}
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--map-text-muted)', fontSize: 13 }}>
                            <Info size={18} style={{ display: 'block', margin: '0 auto 6px', opacity: 0.5 }} />
                            Tidak ada data yang sesuai filter.
                        </div>
                    ) : (
                        filtered.map(f => (
                            <SidebarItem
                                key={f.id}
                                feature={f}
                                isSelected={selected?.id === f.id}
                                onClick={() => handleSelectFeature(f)}
                            />
                        ))
                    )}
                </div>


            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Style constants — px sizes for map UI (immune to body font-size scaling)
// ─────────────────────────────────────────────────────────────────
const mapCtrlBtn = {
    width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
    background: 'var(--map-overlay-bg)', backdropFilter: 'blur(8px)',
    border: '1px solid var(--map-border)', color: 'var(--map-text-sec)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', fontSize: 0,
};

const dropdownStyle = {
    position: 'absolute', left: 42, top: 0, zIndex: 900,
    background: 'var(--map-dropdown-bg)', backdropFilter: 'blur(12px)',
    border: '1px solid var(--map-border)', borderRadius: 8,
    padding: '4px 0', minWidth: 155,
    boxShadow: 'var(--shadow-lg)',
};

const dropdownLabel = {
    padding: '4px 10px 5px', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--map-text-muted)',
};

const dropdownItem = {
    display: 'block', width: '100%', textAlign: 'left', background: 'none',
    border: 'none', padding: '6px 10px', fontSize: 12, cursor: 'pointer',
    transition: 'background 0.12s', fontFamily: 'inherit',
};

function StatChip({ icon, value, label, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', color: 'var(--map-text-sec)' }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontWeight: 700, color: 'var(--map-text-main)', fontSize: 12 }}>{value}</span>
            <span style={{ fontSize: 10, color: 'var(--map-text-muted)' }}>{label}</span>
        </div>
    );
}
