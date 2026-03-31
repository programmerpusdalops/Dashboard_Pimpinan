import { useState, useMemo } from 'react';
import {
    Plus, X, Trash2, Search, RefreshCw,
    ChevronLeft, ChevronRight, ClipboardList, Edit2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsService } from '../../../services/operations.service';
import { eventsService } from '../../../services/events.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../lib/toast';

const PRIORITY_STYLE = {
    critical: { cls: 'pill-critical', label: 'Kritis' },
    high: { cls: 'pill-warn', label: 'Tinggi' },
    medium: { cls: 'pill-info', label: 'Sedang' },
    low: { cls: 'pill-safe', label: 'Rendah' },
};

const STATUS_STYLE = {
    todo: { cls: 'pill-info', label: 'To Do' },
    in_progress: { cls: 'pill-warn', label: 'Berjalan' },
    done: { cls: 'pill-safe', label: 'Selesai' },
    cancelled: { cls: 'pill-critical', label: 'Dibatalkan' },
};

const EMPTY = {
    title: '', description: '', priority: 'medium', status: 'todo',
    assigned_to_opd: '', estimated_hours: '', event_id: '',
};

function TaskForm({ onClose, initial, events }) {
    const [form, setForm] = useState(initial ?? EMPTY);
    const qc = useQueryClient();
    const isEdit = !!initial?.id;

    const mutation = useMutation({
        mutationFn: isEdit
            ? (data) => operationsService.updateTask(initial.id, data)
            : operationsService.createTask,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-tasks'] });
            toast.success(isEdit ? 'Tugas diperbarui' : 'Tugas berhasil dibuat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            event_id: form.event_id || null,
            estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        };
        mutation.mutate(payload);
    };

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--accent-primary)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {isEdit ? 'Edit Tugas Operasi' : 'Tambah Tugas Baru'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={handleSubmit}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Judul Tugas *</label>
                    <input className="form-input" value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kejadian Terkait</label>
                    <select className="form-input" value={form.event_id}
                        onChange={e => setForm({ ...form, event_id: e.target.value })}>
                        <option value="">— Tidak terkait —</option>
                        {(events ?? []).map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Prioritas</label>
                    <select className="form-input" value={form.priority}
                        onChange={e => setForm({ ...form, priority: e.target.value })}>
                        {Object.entries(PRIORITY_STYLE).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label">Deskripsi</label>
                    <textarea className="form-input" rows={2} value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">OPD / Tim Pelaksana</label>
                    <input className="form-input" value={form.assigned_to_opd}
                        onChange={e => setForm({ ...form, assigned_to_opd: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Estimasi Jam</label>
                    <input className="form-input" type="number" step="0.5" value={form.estimated_hours}
                        onChange={e => setForm({ ...form, estimated_hours: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                        disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function OperationsTab() {
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const qc = useQueryClient();
    const debouncedSearch = useDebounce(search, 400);

    const { data: tasks = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-tasks'],
        queryFn: () => operationsService.getTasks(),
    });

    const { data: eventsResp } = useQuery({
        queryKey: ['events', { limit: 100 }],
        queryFn: () => eventsService.getAll({ limit: 100 }),
    });
    const events = eventsResp?.data ?? [];

    const deleteMut = useMutation({
        mutationFn: operationsService.deleteTask,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tasks'] }); toast.success('Tugas dihapus'); },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menghapus'),
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }) => operationsService.updateTaskStatus(id, status),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tasks'] }); toast.success('Status diperbarui'); },
    });

    const filtered = useMemo(() => {
        let list = tasks;
        if (filterStatus) list = list.filter(t => t.status === filterStatus);
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(t =>
                t.title?.toLowerCase().includes(q) ||
                t.assigned_to_opd?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [tasks, filterStatus, debouncedSearch]);

    return (
        <div>
            {(showForm || editItem) && (
                <TaskForm
                    initial={editItem}
                    events={events}
                    onClose={() => { setShowForm(false); setEditItem(null); }}
                />
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 32 }}
                        placeholder="Cari tugas, OPD..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ width: 150 }}
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    {Object.entries(STATUS_STYLE).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetch}>
                    <RefreshCw size={13} />
                </button>
                <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                    onClick={() => { setShowForm(true); setEditItem(null); }}>
                    <Plus size={14} /> Tambah Tugas
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><ClipboardList size={14} /> MANAJEMEN TUGAS OPERASI</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {filtered.length} tugas
                    </span>
                </div>

                {isLoading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Belum ada tugas operasi.
                    </p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Judul</th><th>Kejadian</th><th>OPD</th>
                                <th>Prioritas</th><th>Status</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => {
                                const ps = PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.medium;
                                const eventTitle = events.find(e => e.id === t.event_id)?.title ?? '—';
                                return (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{eventTitle}</td>
                                        <td>{t.assigned_to_opd ?? '—'}</td>
                                        <td><span className={`pill ${ps.cls}`}>{ps.label}</span></td>
                                        <td>
                                            <select className="form-input"
                                                style={{ padding: '3px 8px', fontSize: '0.78rem', height: 'auto', width: 'auto' }}
                                                value={t.status}
                                                onChange={e => updateStatus.mutate({ id: t.id, status: e.target.value })}>
                                                {Object.entries(STATUS_STYLE).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                    onClick={() => { setEditItem(t); setShowForm(false); }}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button className="btn btn-outline"
                                                    style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                    onClick={() => { if (confirm(`Hapus tugas "${t.title}"?`)) deleteMut.mutate(t.id); }}>
                                                    <Trash2 size={13} />
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
