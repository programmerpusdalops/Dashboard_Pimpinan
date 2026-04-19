import { useState } from 'react';
import { Truck, ArrowRight, AlertTriangle, Package, Plus, X, RefreshCw, Warehouse, Wrench, Car } from 'lucide-react';
import { useWarehouses, useShipments, useCreateShipment, useUpdateShipmentStatus } from './hooks/useLogistics';
import { usePermission } from '../../hooks/usePermission';
import { useComponentsByNavKey } from '../../features/app-settings/hooks/useAppSettings';
import AlertBanner from '../../components/common/AlertBanner';
import { ShieldAlert } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────
const CATEGORY_STYLE = {
    logistik: { cls: 'pill-info', label: 'Logistik', icon: Package },
    peralatan: { cls: 'pill-warn', label: 'Peralatan', icon: Wrench },
    kendaraan: { cls: 'pill-safe', label: 'Kendaraan', icon: Car },
};

const coveragePill = (stock, daily) => {
    if (!daily || daily === 0) return 'pill-info';
    const d = stock / daily;
    if (d <= 2) return 'pill-critical';
    if (d <= 4) return 'pill-warn';
    return 'pill-safe';
};

const SHIPMENT_STATUS = {
    preparing: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', label: 'Persiapan' },
    in_transit: { bg: 'var(--status-blue-bg)', color: 'var(--status-blue)', label: 'Dalam Pengiriman' },
    arrived: { bg: 'var(--status-green-bg)', color: 'var(--status-green)', label: 'Tiba di Tujuan' },
    delayed: { bg: 'var(--status-red-bg)', color: 'var(--status-red)', label: 'Tertahan' },
};

const NEXT_STATUS = { preparing: 'in_transit', in_transit: 'arrived' };

const EMPTY_FORM = {
    cargo_description: '',
    from_warehouse_id: '',
    to_shelter_id: '',
    estimated_arrival: '',
};

// ── Sub-components ───────────────────────────────────────────────
function WarehouseCard({ wh }) {
    const items = wh.inventory ?? [];
    const used = items.reduce((s, i) => s + (Number(i.stock_quantity) || 0), 0);
    const capPct = wh.capacity > 0 ? Math.min(100, Math.round((used / wh.capacity) * 100)) : 0;

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title" style={{ gap: 6 }}>
                    <Warehouse size={14} />
                    {wh.name}
                </div>
                <span className={`pill ${capPct >= 90 ? 'pill-critical' : capPct >= 70 ? 'pill-warn' : 'pill-safe'}`}>
                    {capPct}% terisi
                </span>
            </div>

            {/* Capacity bar */}
            <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginBottom: 12 }}>
                <div style={{
                    height: '100%', borderRadius: 2, transition: 'width 0.6s ease',
                    width: `${capPct}%`,
                    background: capPct >= 90 ? 'var(--status-red)' : capPct >= 70 ? 'var(--status-yellow)' : 'var(--status-green)',
                }} />
            </div>

            {items.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Belum ada data inventaris.</p>
                : (
                    <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
                        <table className="data-table" style={{ minWidth: 480 }}>
                            <thead>
                                <tr>
                                    <th>Item</th><th>Kategori</th><th>Stok</th><th>Keb./Hr</th><th>Coverage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const days = item.daily_consumption > 0
                                        ? (Number(item.stock_quantity) / Number(item.daily_consumption)).toFixed(1)
                                        : '∞';
                                    const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.logistik;
                                    const CatIcon = cat.icon;
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 180 }}>
                                                    <CatIcon size={13} style={{ flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.item_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`pill ${cat.cls}`} style={{ fontSize: '0.7rem' }}>
                                                    {cat.label}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.stock_quantity?.toLocaleString('id-ID')} {item.unit}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.daily_consumption} {item.unit}</td>
                                            <td>
                                                <span className={`pill ${coveragePill(Number(item.stock_quantity), Number(item.daily_consumption))}`}>
                                                    {days} Hari
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
        </div>
    );
}

function ShipmentRow({ s, canAdvance }) {
    const st = SHIPMENT_STATUS[s.status] ?? SHIPMENT_STATUS.preparing;
    const advance = useUpdateShipmentStatus();
    const next = NEXT_STATUS[s.status];

    return (
        <div style={{
            padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${st.color}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.shipment_code ?? `SHIP-${s.id}`}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="pill" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {canAdvance && next && (
                        <button
                            className="btn btn-outline"
                            style={{ padding: '3px 10px', fontSize: '0.7rem' }}
                            onClick={() => advance.mutate({ id: s.id, status: next })}
                            disabled={advance.isPending}
                        >
                            {next === 'in_transit' ? 'Berangkat →' : 'Konfirmasi Tiba ✓'}
                        </button>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>{s.fromWarehouse?.name ?? '—'}</span>
                <ArrowRight size={14} />
                <span>{s.toWarehouse?.name ?? s.toShelter?.name ?? '—'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: s.status === 'delayed' ? 'var(--status-red)' : 'var(--text-muted)' }}>
                {s.status === 'delayed'
                    ? <><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />{s.delay_reason}</>
                    : s.cargo_description}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────
export default function LogisticsPage() {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const { isOperator } = usePermission();

    // ── Component Visibility Config ──────────────────────────────
    const { data: compConfigs = [] } = useComponentsByNavKey('logistics');
    
    const isVisible = (key) => {
        if (compConfigs.length === 0) return true; // Default tampil
        const comp = compConfigs.find(c => c.component_key === key);
        return comp ? comp.is_visible : true;
    };

    const { data: warehouses = [], isLoading: whLoading, isError: whError, refetch: refetchWh } = useWarehouses();
    const { data: shipments = [], isLoading: shipLoading } = useShipments();
    const createShipment = useCreateShipment();

    const handleCreate = async (e) => {
        e.preventDefault();
        await createShipment.mutateAsync(form);
        setForm(EMPTY_FORM);
        setShowForm(false);
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {compConfigs.some(c => !c.is_visible) && (
                <AlertBanner icon={ShieldAlert} title="Logistik Terbatas" color="#f59e0b" background="rgba(245, 158, 11, 0.08)" borderColor="rgba(245, 158, 11, 0.2)">
                    Beberapa manajemen stok dan inventaris mungkin telah dibatasi oleh administrator.
                </AlertBanner>
            )}
            {/* ── KPI Summary ── */}
            {isVisible('logistics_kpi') && (
            <div className="kpi-grid" style={{ marginBottom: 20 }}>
                <div className="kpi-card info">
                    <div className="kpi-title"><Warehouse size={13} /> Total Gudang</div>
                    <div className="kpi-value">{warehouses.length} <span className="kpi-unit">Gudang</span></div>
                </div>
                <div className="kpi-card warning">
                    <div className="kpi-title"><Truck size={13} /> Pengiriman Aktif</div>
                    <div className="kpi-value">
                        {shipments.filter(s => s.status === 'in_transit').length}
                        <span className="kpi-unit"> Rute</span>
                    </div>
                </div>
                <div className="kpi-card danger">
                    <div className="kpi-title"><AlertTriangle size={13} /> Pengiriman Tertahan</div>
                    <div className="kpi-value">
                        {shipments.filter(s => s.status === 'delayed').length}
                        <span className="kpi-unit"> Rute</span>
                    </div>
                </div>
            </div>
            )}

            {/* ── Warehouse Grid ── */}
            {isVisible('warehouse_cards') && (
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Inventaris Gudang
                    </h3>
                    <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={refetchWh}>
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>

                {whLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
                        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                    </div>
                ) : whError ? (
                    <div className="alert alert-error">Gagal memuat data gudang.</div>
                ) : warehouses.length === 0 ? (
                    <div className="alert alert-info">Belum ada gudang terdaftar.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
                        {warehouses.map(wh => <WarehouseCard key={wh.id} wh={wh} />)}
                    </div>
                )}
            </div>
            )}

            {/* ── Shipments ── */}
            {isVisible('shipment_list') && (
            <div className="card">
                <div className="card-header">
                    <div className="card-title"><Truck size={15} /> STATUS PENGIRIMAN LOGISTIK</div>
                    {isOperator && (
                        <button
                            className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={() => setShowForm(v => !v)}
                        >
                            {showForm ? <><X size={13} /> Tutup</> : <><Plus size={13} /> Buat Pengiriman</>}
                        </button>
                    )}
                </div>

                {/* Create form */}
                {showForm && (
                    <form onSubmit={handleCreate}
                        style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 16,
                            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'
                        }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kargo / Isi</label>
                            <input className="form-input" value={form.cargo_description}
                                onChange={e => setForm({ ...form, cargo_description: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Dari Gudang (ID)</label>
                            <input className="form-input" type="number" value={form.from_warehouse_id}
                                onChange={e => setForm({ ...form, from_warehouse_id: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Est. Tiba</label>
                            <input className="form-input" type="datetime-local" value={form.estimated_arrival}
                                onChange={e => setForm({ ...form, estimated_arrival: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary"
                                disabled={createShipment.isPending} style={{ whiteSpace: 'nowrap' }}>
                                {createShipment.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                )}

                {/* List */}
                {shipLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
                    </div>
                ) : shipments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
                        Tidak ada data pengiriman.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {shipments.map(s => <ShipmentRow key={s.id} s={s} canAdvance={isOperator} />)}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
