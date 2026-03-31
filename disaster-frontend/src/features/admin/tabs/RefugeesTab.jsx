import { useState, useMemo } from 'react';
import {
    Plus, X, Trash2, Search, RefreshCw, Edit2,
    Tent, HeartPulse, Users,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refugeesService } from '../../../services/refugees.service';
import { eventsService } from '../../../services/events.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../lib/toast';

const STATUS_STYLE = {
    aktif: { cls: 'pill-safe', label: 'Aktif' },
    penuh: { cls: 'pill-warn', label: 'Penuh' },
    tutup: { cls: 'pill-critical', label: 'Tutup' },
};

const EMPTY_SHELTER = {
    name: '', event_id: '', location_name: '', capacity: '',
    current_occupancy: '', status: 'aktif', pic_name: '',
    latitude: '', longitude: '',
};

const EMPTY_HEALTH = {
    sakit_ringan: 0, sakit_berat: 0, butuh_evakuasi_medis: 0, notes: '',
};

// ── Shelter Form ─────────────────────────────────────────────────
function ShelterForm({ onClose, initial, events }) {
    const [form, setForm] = useState(initial ?? EMPTY_SHELTER);
    const qc = useQueryClient();
    const isEdit = !!initial?.id;

    const mutation = useMutation({
        mutationFn: isEdit
            ? (data) => refugeesService.updateShelter(initial.id, data)
            : refugeesService.createShelter,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-shelters'] });
            toast.success(isEdit ? 'Posko diperbarui' : 'Posko berhasil dibuat');
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
                    {isEdit ? 'Edit Posko' : 'Tambah Posko Baru'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate({
                ...form,
                event_id: form.event_id || null,
                capacity: Number(form.capacity) || 0,
                current_occupancy: Number(form.current_occupancy) || 0,
                latitude: form.latitude || null,
                longitude: form.longitude || null,
            }); }}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Posko *</label>
                    <input className="form-input" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kejadian Terkait *</label>
                    <select className="form-input" value={form.event_id}
                        onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                        <option value="">— Pilih —</option>
                        {(events ?? []).map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">PIC / Penanggung Jawab</label>
                    <input className="form-input" value={form.pic_name}
                        onChange={e => setForm({ ...form, pic_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Lokasi</label>
                    <input className="form-input" value={form.location_name}
                        onChange={e => setForm({ ...form, location_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kapasitas (jiwa)</label>
                    <input className="form-input" type="number" value={form.capacity}
                        onChange={e => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pengungsi Saat Ini</label>
                    <input className="form-input" type="number" value={form.current_occupancy}
                        onChange={e => setForm({ ...form, current_occupancy: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}>
                        {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
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

// ── Health Report Form ───────────────────────────────────────────
function HealthForm({ shelter, onClose }) {
    const [form, setForm] = useState(EMPTY_HEALTH);
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload) => refugeesService.addHealthReport(shelter.id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-health', shelter.id] });
            toast.success('Laporan kesehatan ditambahkan');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--status-green)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    Laporan Kesehatan — {shelter.name}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sakit Ringan</label>
                    <input className="form-input" type="number" value={form.sakit_ringan}
                        onChange={e => setForm({ ...form, sakit_ringan: +e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sakit Berat</label>
                    <input className="form-input" type="number" value={form.sakit_berat}
                        onChange={e => setForm({ ...form, sakit_berat: +e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Perlu Evakuasi Medis</label>
                    <input className="form-input" type="number" value={form.butuh_evakuasi_medis}
                        onChange={e => setForm({ ...form, butuh_evakuasi_medis: +e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Catatan</label>
                    <input className="form-input" value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary"
                        disabled={mutation.isPending}>
                        {mutation.isPending ? '...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Main Tab ─────────────────────────────────────────────────────
export default function RefugeesTab() {
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [healthShelter, setHealthShelter] = useState(null); // shelter object for health report
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const qc = useQueryClient();
    const debouncedSearch = useDebounce(search, 400);

    const { data: shelters = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-shelters'],
        queryFn: () => refugeesService.getShelters(),
    });

    const { data: eventsResp } = useQuery({
        queryKey: ['events', { limit: 100 }],
        queryFn: () => eventsService.getAll({ limit: 100 }),
    });
    const events = eventsResp?.data ?? [];

    const filtered = useMemo(() => {
        let list = shelters;
        if (filterStatus) list = list.filter(s => s.status === filterStatus);
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.location_name?.toLowerCase().includes(q) ||
                s.pic_name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [shelters, filterStatus, debouncedSearch]);

    return (
        <div>
            {(showForm || editItem) && (
                <ShelterForm
                    initial={editItem}
                    events={events}
                    onClose={() => { setShowForm(false); setEditItem(null); }}
                />
            )}

            {healthShelter && (
                <HealthForm
                    shelter={healthShelter}
                    onClose={() => setHealthShelter(null)}
                />
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 32 }}
                        placeholder="Cari posko, PIC..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ width: 140 }}
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetch}>
                    <RefreshCw size={13} />
                </button>
                <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                    onClick={() => { setShowForm(true); setEditItem(null); }}>
                    <Plus size={14} /> Tambah Posko
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><Tent size={14} /> MANAJEMEN POSKO PENGUNGSIAN</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {filtered.length} posko
                    </span>
                </div>

                {isLoading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Belum ada posko pengungsian.
                    </p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Posko</th><th>Kejadian</th><th>Lokasi</th>
                                <th>Kapasitas</th><th>Status</th><th>PIC</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const ss = STATUS_STYLE[s.status] ?? STATUS_STYLE.aktif;
                                const pct = s.capacity > 0 ? Math.round((s.current_occupancy / s.capacity) * 100) : 0;
                                const eventTitle = events.find(e => e.id === s.event_id)?.title ?? '—';
                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{eventTitle}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.location_name ?? '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span>{s.current_occupancy ?? 0}/{s.capacity ?? 0}</span>
                                                <div style={{ width: 40, height: 5, background: 'var(--border-primary)', borderRadius: 2 }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 2,
                                                        width: `${Math.min(100, pct)}%`,
                                                        background: pct >= 100 ? 'var(--status-red)' : pct >= 85 ? 'var(--status-yellow)' : 'var(--status-blue)',
                                                    }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`pill ${ss.cls}`}>{ss.label}</span></td>
                                        <td>{s.pic_name ?? '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                    title="Edit Posko"
                                                    onClick={() => { setEditItem(s); setShowForm(false); }}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                    title="Tambah Lap. Kesehatan"
                                                    onClick={() => setHealthShelter(s)}>
                                                    <HeartPulse size={13} style={{ color: 'var(--status-green)' }} />
                                                </button>
                                            </div>
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
