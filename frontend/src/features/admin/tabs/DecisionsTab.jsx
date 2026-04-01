import { useState, useMemo } from 'react';
import {
    Plus, X, Trash2, Search, RefreshCw, Edit2,
    ScrollText,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decisionsService } from '../../../services/operations.service';
import { eventsService } from '../../../services/events.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../lib/toast';

const EMPTY = {
    decision_text: '', decided_by: '', decided_at: '', event_id: '',
};

function DecisionForm({ onClose, initial, events }) {
    const [form, setForm] = useState(initial ?? EMPTY);
    const qc = useQueryClient();
    const isEdit = !!initial?.id;

    const mutation = useMutation({
        mutationFn: isEdit
            ? (data) => decisionsService.updateDecision(initial.id, data)
            : decisionsService.createDecision,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-decisions'] });
            toast.success(isEdit ? 'Keputusan diperbarui' : 'Keputusan berhasil dicatat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--accent-primary)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {isEdit ? 'Edit Keputusan' : 'Catat Keputusan / Instruksi Pimpinan'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate({
                ...form,
                event_id: form.event_id || null,
            }); }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label">Isi Keputusan / Instruksi *</label>
                    <textarea className="form-input" rows={3} value={form.decision_text}
                        placeholder="Contoh: Kerahkan 2 alat berat ke Desa Toili untuk pembukaan akses jalan..."
                        onChange={e => setForm({ ...form, decision_text: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Diputuskan Oleh *</label>
                    <input className="form-input" value={form.decided_by}
                        placeholder="Gubernur / Kepala BPBD"
                        onChange={e => setForm({ ...form, decided_by: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kejadian Terkait</label>
                    <select className="form-input" value={form.event_id}
                        onChange={e => setForm({ ...form, event_id: e.target.value })}>
                        <option value="">— Umum —</option>
                        {(events ?? []).map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Waktu Keputusan</label>
                    <input className="form-input" type="datetime-local" value={form.decided_at ? form.decided_at.slice(0, 16) : ''}
                        onChange={e => setForm({ ...form, decided_at: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn btn-primary"
                        disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function DecisionsTab() {
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [search, setSearch] = useState('');
    const qc = useQueryClient();
    const debouncedSearch = useDebounce(search, 400);

    const { data: decisions = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-decisions'],
        queryFn: () => decisionsService.getDecisions(),
    });

    const { data: eventsResp } = useQuery({
        queryKey: ['events', { limit: 100 }],
        queryFn: () => eventsService.getAll({ limit: 100 }),
    });
    const events = eventsResp?.data ?? [];

    const deleteMut = useMutation({
        mutationFn: decisionsService.deleteDecision,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-decisions'] }); toast.success('Keputusan dihapus'); },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menghapus'),
    });

    const filtered = useMemo(() => {
        if (!debouncedSearch) return decisions;
        const q = debouncedSearch.toLowerCase();
        return decisions.filter(d =>
            d.decision_text?.toLowerCase().includes(q) ||
            d.decided_by?.toLowerCase().includes(q)
        );
    }, [decisions, debouncedSearch]);

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
        catch { return d; }
    };

    return (
        <div>
            {(showForm || editItem) && (
                <DecisionForm
                    initial={editItem}
                    events={events}
                    onClose={() => { setShowForm(false); setEditItem(null); }}
                />
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 32 }}
                        placeholder="Cari keputusan..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetch}>
                    <RefreshCw size={13} />
                </button>
                <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                    onClick={() => { setShowForm(true); setEditItem(null); }}>
                    <Plus size={14} /> Catat Keputusan
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><ScrollText size={14} /> LOG KEPUTUSAN PIMPINAN</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {filtered.length} keputusan
                    </span>
                </div>

                {isLoading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Belum ada log keputusan.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {filtered.map((d, i) => {
                            const eventTitle = events.find(e => e.id === d.event_id)?.title;
                            return (
                                <div key={d.id} style={{
                                    display: 'flex', gap: 14, padding: '14px 16px',
                                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-primary)' : 'none',
                                }}>
                                    {/* Timeline dot */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: 'var(--accent-primary)', flexShrink: 0,
                                            boxShadow: '0 0 8px var(--accent-primary)',
                                        }} />
                                        {i < filtered.length - 1 && (
                                            <div style={{ width: 2, flex: 1, background: 'var(--border-primary)', marginTop: 4 }} />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {d.decided_by}
                                                </span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                                    {formatDate(d.decided_at)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                <button className="btn btn-outline" style={{ padding: '3px 6px' }}
                                                    onClick={() => { setEditItem(d); setShowForm(false); }}>
                                                    <Edit2 size={11} />
                                                </button>
                                                <button className="btn btn-outline"
                                                    style={{ padding: '3px 6px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                    onClick={() => { if (confirm('Hapus keputusan ini?')) deleteMut.mutate(d.id); }}>
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                            {d.decision_text}
                                        </p>
                                        {eventTitle && (
                                            <span className="pill pill-info" style={{ marginTop: 6, display: 'inline-block', fontSize: '0.7rem' }}>
                                                {eventTitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
