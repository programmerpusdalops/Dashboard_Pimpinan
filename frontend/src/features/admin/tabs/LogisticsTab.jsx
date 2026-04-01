import { useState, useMemo } from 'react';
import {
    Plus, X, Trash2, Search, RefreshCw, Edit2,
    Warehouse as WarehouseIcon, Truck, Package, Wrench, Car,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../../../services/logistics.service';
import { refugeesService } from '../../../services/refugees.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../lib/toast';

// ── Constants ────────────────────────────────────────────────────
const WH_LEVEL_LABEL = { provinsi: 'Provinsi', kabupaten: 'Kabupaten', kecamatan: 'Kecamatan' };
const SHIP_STATUS = {
    preparing: { cls: 'pill-info', label: 'Dikemas' },
    in_transit: { cls: 'pill-warn', label: 'Dikirim' },
    arrived: { cls: 'pill-safe', label: 'Diterima' },
    delayed: { cls: 'pill-critical', label: 'Tertunda' },
    cancelled: { cls: 'pill-critical', label: 'Dibatalkan' },
};

const EMPTY_WH = { name: '', level: 'kabupaten', location_name: '', latitude: '', longitude: '', status: 'aktif' };
const EMPTY_SHIP = {
    shipment_code: '', from_warehouse_id: '', to_shelter_id: '',
    cargo_description: '', driver_name: '', vehicle_plate: '',
    departure_time: '', eta: '',
};
const EMPTY_INV = { category: 'logistik', item_name: '', unit: '', stock_quantity: '', daily_consumption: '', min_threshold: '' };

const CATEGORY_STYLE = {
    logistik: { cls: 'pill-info', label: 'Logistik', icon: Package },
    peralatan: { cls: 'pill-warn', label: 'Peralatan', icon: Wrench },
    kendaraan: { cls: 'pill-safe', label: 'Kendaraan', icon: Car },
};

// ── Warehouse Form ───────────────────────────────────────────────
function WarehouseForm({ onClose, initial }) {
    const [form, setForm] = useState(initial ?? EMPTY_WH);
    const qc = useQueryClient();
    const isEdit = !!initial?.id;

    const mutation = useMutation({
        mutationFn: isEdit
            ? (data) => logisticsService.updateWarehouse(initial.id, data)
            : logisticsService.createWarehouse,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
            toast.success(isEdit ? 'Gudang diperbarui' : 'Gudang berhasil dibuat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--status-blue)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {isEdit ? 'Edit Gudang' : 'Tambah Gudang Baru'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Gudang *</label>
                    <input className="form-input" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Level</label>
                    <select className="form-input" value={form.level}
                        onChange={e => setForm({ ...form, level: e.target.value })}>
                        {Object.entries(WH_LEVEL_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="aktif">Aktif</option>
                        <option value="tidak_aktif">Tidak Aktif</option>
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Lokasi</label>
                    <input className="form-input" value={form.location_name}
                        onChange={e => setForm({ ...form, location_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="number" step="any" value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="number" step="any" value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                        disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Shipment Form ────────────────────────────────────────────────
function ShipmentForm({ onClose, warehouses, shelters }) {
    const [form, setForm] = useState(EMPTY_SHIP);
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: logisticsService.createShipment,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-shipments'] });
            toast.success('Pengiriman berhasil dibuat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--status-yellow)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Buat Pengiriman Baru</span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate({
                ...form,
                from_warehouse_id: form.from_warehouse_id || null,
                to_shelter_id: form.to_shelter_id || null,
            }); }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kode Pengiriman *</label>
                    <input className="form-input" value={form.shipment_code}
                        onChange={e => setForm({ ...form, shipment_code: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Dari Gudang</label>
                    <select className="form-input" value={form.from_warehouse_id}
                        onChange={e => setForm({ ...form, from_warehouse_id: e.target.value })}>
                        <option value="">— Pilih —</option>
                        {(warehouses ?? []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ke Posko</label>
                    <select className="form-input" value={form.to_shelter_id}
                        onChange={e => setForm({ ...form, to_shelter_id: e.target.value })}>
                        <option value="">— Pilih —</option>
                        {(shelters ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label">Deskripsi Muatan</label>
                    <textarea className="form-input" rows={2} value={form.cargo_description}
                        onChange={e => setForm({ ...form, cargo_description: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Supir</label>
                    <input className="form-input" value={form.driver_name}
                        onChange={e => setForm({ ...form, driver_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Plat Kendaraan</label>
                    <input className="form-input" value={form.vehicle_plate}
                        onChange={e => setForm({ ...form, vehicle_plate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                        disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Inventory Sub-Tab ────────────────────────────────────────────
function InventorySubTab({ warehouses }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_INV);
    const [filterWH, setFilterWH] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [search, setSearch] = useState('');
    const qc = useQueryClient();
    const debouncedSearch = useDebounce(search, 400);

    // Gather all inventory items from warehouses (which include inventory via GET /warehouses)
    const allItems = useMemo(() => {
        const items = [];
        (warehouses ?? []).forEach(wh => {
            (wh.inventory ?? []).forEach(item => {
                items.push({ ...item, warehouseName: wh.name, warehouseId: wh.id });
            });
        });
        return items;
    }, [warehouses]);

    const filtered = useMemo(() => {
        let list = allItems;
        if (filterWH) list = list.filter(i => String(i.warehouse_id) === filterWH);
        if (filterCat) list = list.filter(i => i.category === filterCat);
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(i => i.item_name?.toLowerCase().includes(q) || i.unit?.toLowerCase().includes(q));
        }
        return list;
    }, [allItems, filterWH, filterCat, debouncedSearch]);

    const createMut = useMutation({
        mutationFn: (data) => logisticsService.addInventoryItem(data.warehouse_id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
            toast.success('Item inventaris berhasil ditambahkan');
            setForm(EMPTY_INV);
            setShowForm(false);
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menambah item'),
    });

    const deleteMut = useMutation({
        mutationFn: logisticsService.deleteInventoryItem,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
            toast.success('Item berhasil dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menghapus item'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.warehouse_id) return toast.error('Pilih gudang terlebih dahulu');
        createMut.mutate({
            ...form,
            stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
            daily_consumption: form.daily_consumption ? Number(form.daily_consumption) : 0,
            min_threshold: form.min_threshold ? Number(form.min_threshold) : 0,
        });
    };

    // Category counts
    const catCounts = useMemo(() => {
        const counts = { logistik: 0, peralatan: 0, kendaraan: 0 };
        allItems.forEach(i => { if (counts[i.category] !== undefined) counts[i.category]++; else counts.logistik++; });
        return counts;
    }, [allItems]);

    return (
        <div>
            {/* Category Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {Object.entries(CATEGORY_STYLE).map(([key, style]) => {
                    const Icon = style.icon;
                    return (
                        <div key={key} style={{
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            cursor: 'pointer', transition: 'all 0.2s',
                            borderLeft: filterCat === key ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        }} onClick={() => setFilterCat(filterCat === key ? '' : key)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {style.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {catCounts[key]} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>item</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Form */}
            {showForm && (
                <div style={{
                    padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    marginBottom: 16, borderLeft: '3px solid var(--accent-primary)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tambah Item Inventaris</span>
                        <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowForm(false)}>
                            <X size={13} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Gudang *</label>
                            <select className="form-input" value={form.warehouse_id ?? ''}
                                onChange={e => setForm({ ...form, warehouse_id: e.target.value })} required>
                                <option value="">— Pilih Gudang —</option>
                                {(warehouses ?? []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kategori</label>
                            <select className="form-input" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}>
                                {Object.entries(CATEGORY_STYLE).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nama Item *</label>
                            <input className="form-input" value={form.item_name}
                                placeholder="Mis: Beras, Tangki Air, Genset..."
                                onChange={e => setForm({ ...form, item_name: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Satuan *</label>
                            <input className="form-input" value={form.unit} placeholder="Kg, Ltr, Unit..."
                                onChange={e => setForm({ ...form, unit: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Jumlah Stok</label>
                            <input className="form-input" type="number" step="any" value={form.stock_quantity}
                                onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Konsumsi/Hari</label>
                            <input className="form-input" type="number" step="any" value={form.daily_consumption}
                                onChange={e => setForm({ ...form, daily_consumption: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Min. Threshold</label>
                            <input className="form-input" type="number" step="any" value={form.min_threshold}
                                onChange={e => setForm({ ...form, min_threshold: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                                disabled={createMut.isPending}>
                                {createMut.isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 32 }}
                        placeholder="Cari item, satuan..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ width: 180 }}
                    value={filterWH} onChange={e => setFilterWH(e.target.value)}>
                    <option value="">Semua Gudang</option>
                    {(warehouses ?? []).map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
                </select>
                <select className="form-input" style={{ width: 160 }}
                    value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                    <option value="">Semua Kategori</option>
                    {Object.entries(CATEGORY_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className="btn btn-outline" style={{ padding: '9px 12px' }}
                    onClick={() => qc.invalidateQueries({ queryKey: ['admin-warehouses'] })}>
                    <RefreshCw size={13} />
                </button>
                <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                    onClick={() => setShowForm(true)}>
                    <Plus size={14} /> Tambah Item
                </button>
            </div>

            {/* Item Table */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title"><Package size={14} /> INVENTARIS GUDANG & PERALATAN</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filtered.length} item</span>
                </div>
                {filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Belum ada item inventaris. Klik "Tambah Item" untuk menambahkan.
                    </p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Item</th><th>Gudang</th><th>Kategori</th>
                                <th>Stok</th><th>Satuan</th><th>Keb./Hr</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.logistik;
                                const CatIcon = cat.icon;
                                const isLow = item.min_threshold > 0 && Number(item.stock_quantity) <= Number(item.min_threshold);
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{item.warehouseName}</td>
                                        <td>
                                            <span className={`pill ${cat.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <CatIcon size={11} /> {cat.label}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: isLow ? 'var(--status-red)' : 'var(--text-main)' }}>
                                            {Number(item.stock_quantity ?? 0).toLocaleString('id-ID')}
                                            {isLow && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>⚠️</span>}
                                        </td>
                                        <td>{item.unit}</td>
                                        <td>{Number(item.daily_consumption ?? 0).toLocaleString('id-ID')}</td>
                                        <td>
                                            <button className="btn btn-outline"
                                                style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                onClick={() => { if (confirm(`Hapus item "${item.item_name}"?`)) deleteMut.mutate(item.id); }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
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

// ── Main Tab ─────────────────────────────────────────────────────
export default function LogisticsTab() {
    const [subTab, setSubTab] = useState('warehouses'); // warehouses | shipments
    const [showForm, setShowForm] = useState(false);
    const [editWH, setEditWH] = useState(null);
    const [search, setSearch] = useState('');
    const qc = useQueryClient();
    const debouncedSearch = useDebounce(search, 400);

    // Queries
    const { data: warehouses = [], isLoading: whLoading, refetch: refetchWH } = useQuery({
        queryKey: ['admin-warehouses'],
        queryFn: logisticsService.getWarehouses,
    });

    const { data: shipments = [], isLoading: shipLoading, refetch: refetchShip } = useQuery({
        queryKey: ['admin-shipments'],
        queryFn: () => logisticsService.getShipments(),
    });

    const { data: shelters = [] } = useQuery({
        queryKey: ['admin-shelters-for-logistics'],
        queryFn: () => refugeesService.getShelters(),
    });

    const updateShipStatus = useMutation({
        mutationFn: ({ id, status }) => logisticsService.updateShipmentStatus(id, status),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shipments'] }); toast.success('Status diperbarui'); },
    });

    // Filtered
    const filteredWH = useMemo(() => {
        if (!debouncedSearch) return warehouses;
        const q = debouncedSearch.toLowerCase();
        return warehouses.filter(w => w.name?.toLowerCase().includes(q) || w.location_name?.toLowerCase().includes(q));
    }, [warehouses, debouncedSearch]);

    const filteredShip = useMemo(() => {
        if (!debouncedSearch) return shipments;
        const q = debouncedSearch.toLowerCase();
        return shipments.filter(s =>
            s.shipment_code?.toLowerCase().includes(q) ||
            s.driver_name?.toLowerCase().includes(q) ||
            s.cargo_description?.toLowerCase().includes(q)
        );
    }, [shipments, debouncedSearch]);

    return (
        <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button className={`btn ${subTab === 'warehouses' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => { setSubTab('warehouses'); setShowForm(false); setEditWH(null); setSearch(''); }}>
                    <WarehouseIcon size={14} /> Gudang
                </button>
                <button className={`btn ${subTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => { setSubTab('inventory'); setShowForm(false); setEditWH(null); setSearch(''); }}>
                    <Package size={14} /> Inventaris & Peralatan
                </button>
                <button className={`btn ${subTab === 'shipments' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => { setSubTab('shipments'); setShowForm(false); setEditWH(null); setSearch(''); }}>
                    <Truck size={14} /> Pengiriman
                </button>
            </div>

            {/* ─── Warehouses ───────────────────────────────────────── */}
            {subTab === 'warehouses' && (
                <div>
                    {(showForm || editWH) && (
                        <WarehouseForm initial={editWH} onClose={() => { setShowForm(false); setEditWH(null); }} />
                    )}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 32 }}
                                placeholder="Cari gudang..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetchWH}>
                            <RefreshCw size={13} />
                        </button>
                        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                            onClick={() => { setShowForm(true); setEditWH(null); }}>
                            <Plus size={14} /> Tambah Gudang
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><WarehouseIcon size={14} /> DAFTAR GUDANG</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredWH.length} gudang</span>
                        </div>
                        {whLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : filteredWH.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada gudang.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nama</th><th>Level</th><th>Lokasi</th>
                                        <th>Kapasitas</th><th>Status</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWH.map(w => (
                                        <tr key={w.id}>
                                            <td style={{ fontWeight: 600 }}>{w.name}</td>
                                            <td>{WH_LEVEL_LABEL[w.level] ?? w.level}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{w.location_name ?? '—'}</td>
                                            <td>{Number(w.capacity_pct ?? 0).toFixed(0)}%</td>
                                            <td>
                                                <span className={`pill ${w.status === 'aktif' ? 'pill-safe' : 'pill-critical'}`}>
                                                    {w.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                    onClick={() => { setEditWH(w); setShowForm(false); }}>
                                                    <Edit2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Inventory ───────────────────────────────────────── */}
            {subTab === 'inventory' && <InventorySubTab warehouses={warehouses} />}

            {/* ─── Shipments ───────────────────────────────────────── */}
            {subTab === 'shipments' && (
                <div>
                    {showForm && (
                        <ShipmentForm
                            warehouses={warehouses}
                            shelters={shelters}
                            onClose={() => setShowForm(false)}
                        />
                    )}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 32 }}
                                placeholder="Cari pengiriman..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetchShip}>
                            <RefreshCw size={13} />
                        </button>
                        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                            onClick={() => setShowForm(true)}>
                            <Plus size={14} /> Buat Pengiriman
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><Truck size={14} /> DAFTAR PENGIRIMAN</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredShip.length} pengiriman</span>
                        </div>
                        {shipLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : filteredShip.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada pengiriman.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Kode</th><th>Dari</th><th>Tujuan</th>
                                        <th>Supir</th><th>Muatan</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredShip.map(s => {
                                        const ss = SHIP_STATUS[s.status] ?? SHIP_STATUS.preparing;
                                        const fromName = warehouses.find(w => w.id === s.from_warehouse_id)?.name ?? '—';
                                        const toName = shelters.find(sh => sh.id === s.to_shelter_id)?.name ?? '—';
                                        return (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>{s.shipment_code}</td>
                                                <td>{fromName}</td>
                                                <td>{toName}</td>
                                                <td>{s.driver_name ?? '—'}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.cargo_description ?? '—'}
                                                </td>
                                                <td>
                                                    <select className="form-input"
                                                        style={{ padding: '3px 8px', fontSize: '0.78rem', height: 'auto', width: 'auto' }}
                                                        value={s.status}
                                                        onChange={e => updateShipStatus.mutate({ id: s.id, status: e.target.value })}>
                                                        {Object.entries(SHIP_STATUS).map(([k, v]) => (
                                                            <option key={k} value={k}>{v.label}</option>
                                                        ))}
                                                    </select>
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
