import { useState, useMemo } from 'react';
import {
    Plus, X, Search, RefreshCw, Edit2, Trash2,
    DollarSign, Receipt, TrendingDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundingService } from '../../../services/funding.service';
import { eventsService } from '../../../services/events.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../lib/toast';

const SOURCES = ['BTT', 'BNPB', 'Kemensos', 'Donasi', 'Lainnya'];
const SOURCE_STYLE = {
    BTT: 'pill-warn', BNPB: 'pill-info', Kemensos: 'pill-safe', Donasi: 'pill-info', Lainnya: 'pill-critical',
};

const EMPTY_ALLOC = { event_id: '', source: 'BTT', total_amount: '', sector: '', allocated_at: '' };
const EMPTY_EXP = { allocation_id: '', expenditure_date: '', amount: '', description: '' };

const rupiah = (v) => Number(v || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

// ── Allocation Form (Create + Edit) ─────────────────────────────
function AllocationForm({ onClose, events, initial }) {
    const isEdit = !!initial;
    const [form, setForm] = useState(initial ?? EMPTY_ALLOC);
    const qc = useQueryClient();

    const createMut = useMutation({
        mutationFn: fundingService.createAllocation,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-allocations'] });
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Alokasi anggaran berhasil dibuat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, ...data }) => fundingService.updateAllocation(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-allocations'] });
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Alokasi berhasil diperbarui');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal memperbarui'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            event_id: form.event_id || null,
            total_amount: Number(form.total_amount) || 0,
        };
        if (isEdit) updateMut.mutate({ id: initial.id, ...payload });
        else createMut.mutate(payload);
    };

    const isPending = createMut.isPending || updateMut.isPending;

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: `3px solid ${isEdit ? 'var(--status-yellow)' : 'var(--accent-primary)'}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {isEdit ? `Edit Alokasi — ${initial.sector}` : 'Tambah Alokasi Anggaran'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={handleSubmit}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kejadian Terkait</label>
                    <select className="form-input" value={form.event_id}
                        onChange={e => setForm({ ...form, event_id: e.target.value })}>
                        <option value="">— Umum —</option>
                        {(events ?? []).map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sumber Dana</label>
                    <select className="form-input" value={form.source}
                        onChange={e => setForm({ ...form, source: e.target.value })}>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sektor *</label>
                    <input className="form-input" value={form.sector} placeholder="Logistik, Evakuasi..."
                        onChange={e => setForm({ ...form, sector: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Jumlah (Rp) *</label>
                    <input className="form-input" type="number" value={form.total_amount}
                        onChange={e => setForm({ ...form, total_amount: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tanggal Alokasi</label>
                    <input className="form-input" type="date" value={form.allocated_at || ''}
                        onChange={e => setForm({ ...form, allocated_at: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? '...' : isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Expenditure Form ─────────────────────────────────────────────
function ExpenditureForm({ onClose, allocations }) {
    const [form, setForm] = useState(EMPTY_EXP);
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: fundingService.createExpenditure,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-expenditures'] });
            qc.invalidateQueries({ queryKey: ['admin-allocations'] });
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Pengeluaran berhasil dicatat');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan'),
    });

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--status-red)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Catat Pengeluaran Harian</span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate({
                ...form,
                amount: Number(form.amount) || 0,
            }); }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Alokasi *</label>
                    <select className="form-input" value={form.allocation_id}
                        onChange={e => setForm({ ...form, allocation_id: e.target.value })} required>
                        <option value="">— Pilih —</option>
                        {(allocations ?? []).map(a => (
                            <option key={a.id} value={a.id}>{a.source} — {a.sector}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tanggal *</label>
                    <input className="form-input" type="date" value={form.expenditure_date}
                        onChange={e => setForm({ ...form, expenditure_date: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Jumlah (Rp) *</label>
                    <input className="form-input" type="number" value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Deskripsi</label>
                    <input className="form-input" value={form.description} placeholder="BBM, Konsumsi Relawan..."
                        onChange={e => setForm({ ...form, description: e.target.value })} />
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
export default function FundingTab() {
    const qc = useQueryClient();
    const [subTab, setSubTab] = useState('allocations');
    const [showAllocForm, setShowAllocForm] = useState(false);
    const [editAlloc, setEditAlloc] = useState(null);
    const [showExpForm, setShowExpForm] = useState(false);
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const allocParams = {};
    if (filterSource) allocParams.source = filterSource;

    const { data: allocations = [], isLoading: allocLoading, refetch: refetchAlloc } = useQuery({
        queryKey: ['admin-allocations', allocParams],
        queryFn: () => fundingService.getAllocations(allocParams),
    });

    const { data: expenditures = [], isLoading: expLoading, refetch: refetchExp } = useQuery({
        queryKey: ['admin-expenditures'],
        queryFn: () => fundingService.getExpenditures(),
    });

    const { data: eventsResp } = useQuery({
        queryKey: ['events', { limit: 100 }],
        queryFn: () => eventsService.getAll({ limit: 100 }),
    });
    const events = eventsResp?.data ?? [];

    const deleteMut = useMutation({
        mutationFn: fundingService.deleteAllocation,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-allocations'] });
            qc.invalidateQueries({ queryKey: ['admin-expenditures'] });
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Alokasi berhasil dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menghapus'),
    });

    const deleteExpMut = useMutation({
        mutationFn: fundingService.deleteExpenditure,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-expenditures'] });
            qc.invalidateQueries({ queryKey: ['admin-allocations'] });
            qc.invalidateQueries({ queryKey: ['funding'] });
            toast.success('Pengeluaran berhasil dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message ?? 'Gagal menghapus'),
    });

    // Totals
    const totalAllocated = allocations.reduce((s, a) => s + Number(a.total_amount || 0), 0);
    const totalSpent = expenditures.reduce((s, e) => s + Number(e.amount || 0), 0);

    // Per-source totals
    const sourceStats = useMemo(() => {
        const map = {};
        allocations.forEach(a => {
            map[a.source] = (map[a.source] || 0) + Number(a.total_amount || 0);
        });
        return map;
    }, [allocations]);

    const filteredAlloc = useMemo(() => {
        if (!debouncedSearch) return allocations;
        const q = debouncedSearch.toLowerCase();
        return allocations.filter(a => a.sector?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q));
    }, [allocations, debouncedSearch]);

    const filteredExp = useMemo(() => {
        if (!debouncedSearch) return expenditures;
        const q = debouncedSearch.toLowerCase();
        return expenditures.filter(e => e.description?.toLowerCase().includes(q));
    }, [expenditures, debouncedSearch]);

    const handleEditClick = (alloc) => {
        setEditAlloc({
            id: alloc.id,
            event_id: alloc.event_id || '',
            source: alloc.source,
            total_amount: alloc.total_amount,
            sector: alloc.sector,
            allocated_at: alloc.allocated_at || '',
        });
        setShowAllocForm(false);
    };

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>
                        Total Alokasi
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-blue)' }}>
                        {rupiah(totalAllocated)}
                    </div>
                </div>
                <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>
                        Total Pengeluaran
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-red)' }}>
                        {rupiah(totalSpent)}
                    </div>
                </div>
                <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>
                        Sisa Dana
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: totalAllocated - totalSpent > 0 ? 'var(--status-green)' : 'var(--status-red)' }}>
                        {rupiah(totalAllocated - totalSpent)}
                    </div>
                </div>
            </div>

            {/* Per-Source Stats */}
            {Object.keys(sourceStats).length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {Object.entries(sourceStats).map(([src, amt]) => (
                        <div key={src} className="card" style={{ padding: '8px 14px', flex: '1 1 auto', minWidth: 120 }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>{src}</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{rupiah(amt)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button className={`btn ${subTab === 'allocations' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => { setSubTab('allocations'); setShowAllocForm(false); setShowExpForm(false); setEditAlloc(null); setSearch(''); }}>
                    <DollarSign size={14} /> Alokasi Anggaran
                </button>
                <button className={`btn ${subTab === 'expenditures' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => { setSubTab('expenditures'); setShowAllocForm(false); setShowExpForm(false); setEditAlloc(null); setSearch(''); }}>
                    <TrendingDown size={14} /> Pengeluaran Harian
                </button>
            </div>

            {/* ─── Allocations ────────────────────────────────────── */}
            {subTab === 'allocations' && (
                <div>
                    {showAllocForm && !editAlloc && <AllocationForm events={events} onClose={() => setShowAllocForm(false)} />}
                    {editAlloc && <AllocationForm events={events} initial={editAlloc} onClose={() => setEditAlloc(null)} />}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 32 }}
                                placeholder="Cari sektor, sumber..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-input" style={{ width: 140 }} value={filterSource}
                            onChange={e => setFilterSource(e.target.value)}>
                            <option value="">Semua Sumber</option>
                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetchAlloc}>
                            <RefreshCw size={13} />
                        </button>
                        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                            onClick={() => { setShowAllocForm(true); setEditAlloc(null); }}>
                            <Plus size={14} /> Tambah Alokasi
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><DollarSign size={14} /> ALOKASI ANGGARAN</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredAlloc.length} alokasi</span>
                        </div>
                        {allocLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : filteredAlloc.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada alokasi.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Sumber</th><th>Sektor</th><th>Kejadian</th>
                                        <th style={{ textAlign: 'right' }}>Alokasi</th>
                                        <th style={{ textAlign: 'right' }}>Realisasi</th>
                                        <th>Tanggal</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAlloc.map(a => {
                                        const eventTitle = a.DisasterEvent?.title || events.find(e => e.id === a.event_id)?.title || '—';
                                        const realized = a.realized ?? 0;
                                        return (
                                            <tr key={a.id}>
                                                <td><span className={`pill ${SOURCE_STYLE[a.source] ?? 'pill-info'}`}>{a.source}</span></td>
                                                <td style={{ fontWeight: 600 }}>{a.sector}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{eventTitle}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {rupiah(a.total_amount)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: realized > 0 ? 'var(--status-yellow)' : 'var(--text-muted)' }}>
                                                    {rupiah(realized)}
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                                    {a.allocated_at ?? '—'}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                            title="Edit" onClick={() => handleEditClick(a)}>
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button className="btn btn-outline"
                                                            style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                            onClick={() => { if (confirm(`Hapus alokasi "${a.sector}"? Semua pengeluaran terkait juga akan dihapus.`)) deleteMut.mutate(a.id); }}>
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
            )}

            {/* ─── Expenditures ───────────────────────────────────── */}
            {subTab === 'expenditures' && (
                <div>
                    {showExpForm && <ExpenditureForm allocations={allocations} onClose={() => setShowExpForm(false)} />}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 32 }}
                                placeholder="Cari pengeluaran..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetchExp}>
                            <RefreshCw size={13} />
                        </button>
                        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                            onClick={() => setShowExpForm(true)}>
                            <Plus size={14} /> Catat Pengeluaran
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><Receipt size={14} /> LOG PENGELUARAN HARIAN</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredExp.length} catatan</span>
                        </div>
                        {expLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : filteredExp.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada pengeluaran.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th><th>Alokasi</th><th>Deskripsi</th>
                                        <th style={{ textAlign: 'right' }}>Jumlah</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExp.map(e => {
                                        const alloc = allocations.find(a => a.id === e.allocation_id);
                                        return (
                                            <tr key={e.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                    {e.expenditure_date}
                                                </td>
                                                <td style={{ fontSize: '0.82rem' }}>
                                                    {alloc ? `${alloc.source} — ${alloc.sector}` : '—'}
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{e.description ?? '—'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--status-red)' }}>
                                                    -{rupiah(e.amount)}
                                                </td>
                                                <td>
                                                    <button className="btn btn-outline"
                                                        style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                        onClick={() => { if (confirm('Hapus pengeluaran ini?')) deleteExpMut.mutate(e.id); }}>
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
            )}
        </div>
    );
}
