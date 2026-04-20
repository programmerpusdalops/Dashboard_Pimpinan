import { useEffect, useState, createElement } from 'react';
import {
    Users as UsersIcon, Plus, X, Trash2, ToggleLeft, ToggleRight,
    AlertCircle, Search, ShieldCheck, UserPlus, RefreshCw,
    ChevronLeft, ChevronRight as ChevRight,
    ClipboardList, Truck, Tent, DollarSign, ScrollText, Edit2,
} from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useToggleUserActive, useDeleteUser } from './hooks/useAdmin';
import { eventsService } from '../../services/events.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { useComponentsByNavKey } from '../app-settings/hooks/useAppSettings';
import { toast } from '../../lib/toast';

// ── Tab Imports ──────────────────────────────────────────────────
import OperationsTab from './tabs/OperationsTab';
import LogisticsTab from './tabs/LogisticsTab';
import RefugeesTab from './tabs/RefugeesTab';
import FundingTab from './tabs/FundingTab';
import DecisionsTab from './tabs/DecisionsTab';

// ── Constants ────────────────────────────────────────────────────
const ALL_ROLES = ['viewer', 'operator', 'admin', 'superadmin', 'pimpinan'];
const DEFAULT_ADMIN_CREATABLE_ROLES = ['viewer', 'operator', 'admin'];
const ROLE_STYLE = {
    admin: { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow)', label: 'Admin' },
    operator: { bg: 'var(--status-blue-bg)', color: 'var(--status-blue)', label: 'Operator' },
    viewer: { bg: 'var(--status-green-bg)', color: 'var(--status-green)', label: 'Viewer' },
    superadmin: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Superadmin' },
    pimpinan: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Pimpinan' },
};

const EVENT_TYPE_LABEL = {
    banjir: 'Banjir', longsor: 'Longsor', gempa: 'Gempa',
    karhutla: 'Karhutla', angin_kencang: 'Angin Kencang', lainnya: 'Lainnya',
};
const EVENT_SEV_STYLE = {
    kritis: 'pill-critical', berat: 'pill-warn', sedang: 'pill-info', ringan: 'pill-safe',
};

const EMPTY_USER = { name: '', email: '', password: '', role: 'operator', opd: '' };
const EMPTY_EVENT = { title: '', type: 'banjir', status: 'siaga', severity: 'ringan', location_name: '', start_date: '', posko_leader: '', posko_leader_position: '' };

// ── Tab definitions ──────────────────────────────────────────────
const TABS = [
    { key: 'users', label: 'User', icon: UsersIcon },
    { key: 'events', label: 'Kejadian', icon: AlertCircle },
    { key: 'operations', label: 'Operasi', icon: ClipboardList },
    { key: 'logistics', label: 'Logistik & Peralatan', icon: Truck },
    { key: 'refugees', label: 'Pengungsi', icon: Tent },
    { key: 'funding', label: 'Pendanaan', icon: DollarSign },
    { key: 'decisions', label: 'Keputusan', icon: ScrollText },
];

// ── User Form Modal ──────────────────────────────────────────────
function UserForm({ onClose, initial, roleOptions, defaultRole }) {
    const [form, setForm] = useState(() => {
        if (initial) return initial;
        return { ...EMPTY_USER, role: defaultRole || EMPTY_USER.role };
    });
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const isEdit = !!initial;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEdit) {
            const { password, ...rest } = form;
            await updateUser.mutateAsync({ id: initial.id, ...(password ? form : rest) });
        } else {
            await createUser.mutateAsync(form);
        }
        onClose();
    };

    const isPending = createUser.isPending || updateUser.isPending;

    return (
        <div style={{
            padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            marginBottom: 16, borderLeft: '3px solid var(--accent-primary)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {isEdit ? 'Edit User' : 'Tambah User Baru'}
                </span>
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
                    <X size={13} />
                </button>
            </div>
            <form onSubmit={handleSubmit}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Lengkap *</label>
                    <input className="form-input" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} required={!isEdit} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{isEdit ? 'Password Baru (opsional)' : 'Password *'}</label>
                    <input className="form-input" type="password" value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })} required={!isEdit} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Role</label>
                    <select className="form-input" value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}>
                        {(roleOptions || DEFAULT_ADMIN_CREATABLE_ROLES).map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">OPD / Instansi</label>
                    <input className="form-input" value={form.opd}
                        onChange={e => setForm({ ...form, opd: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                        disabled={isPending}>
                        {isPending ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Buat User'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Users Tab ────────────────────────────────────────────────────
function UsersTab({ roleOptions, defaultRole, filterRoles, canSeeSuperadmin, userCaps }) {
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebounce(search, 400);
    const { isSuperAdmin } = usePermission();

    const { data, isLoading, isError, refetch } = useUsers({
        page,
        limit: 15,
        role: filterRole || undefined,
        include_superadmin: canSeeSuperadmin ? true : undefined,
    });

    const users = (data?.data ?? []).filter(u => (canSeeSuperadmin ? true : u.role !== 'superadmin'));
    const pagination = data?.pagination;

    const toggleActive = useToggleUserActive();
    const deleteUser = useDeleteUser();

    const canRead = canSeeSuperadmin ? true : (userCaps?.read !== false);
    const canCreate = canSeeSuperadmin ? true : (userCaps?.create !== false);
    const canUpdate = canSeeSuperadmin ? true : (userCaps?.update !== false);
    const canToggleActive = canSeeSuperadmin ? true : (userCaps?.toggle_active !== false);
    const hasAnyRowAction = !!(canUpdate || canToggleActive || canSeeSuperadmin);

    // If read is revoked while this page is open, close edit/create UI and reload to reflect restriction
    useEffect(() => {
        if (canRead) return;
        setShowForm(false);
        setEditUser(null);
        setPage(1);
        // Force refetch once so UI transitions to "restricted" state even if cache had old data
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canRead]);

    const filtered = debouncedSearch
        ? users.filter(u =>
            u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.opd?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
        : users;

    return (
        <div>
            {!canRead && (
                <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                    Akses melihat daftar user dinonaktifkan oleh superadmin.
                </div>
            )}

            {showForm && !editUser && (
                <UserForm
                    onClose={() => setShowForm(false)}
                    roleOptions={roleOptions}
                    defaultRole={defaultRole}
                />
            )}
            {editUser && (
                <UserForm
                    initial={editUser}
                    onClose={() => setEditUser(null)}
                    roleOptions={roleOptions}
                    defaultRole={defaultRole}
                />
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap', opacity: canRead ? 1 : 0.65, pointerEvents: canRead ? 'auto' : 'none' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 32 }}
                        placeholder="Cari nama, email, OPD..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ width: 140 }}
                    value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
                    <option value="">Semua Role</option>
                    {(filterRoles || DEFAULT_ADMIN_CREATABLE_ROLES).map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <button className="btn btn-outline" style={{ padding: '9px 12px' }} onClick={refetch}>
                    <RefreshCw size={13} />
                </button>
                {canCreate && (
                    <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                        onClick={() => { setShowForm(true); setEditUser(null); }}>
                        <UserPlus size={14} /> Tambah User
                    </button>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><UsersIcon size={14} /> DAFTAR USER SISTEM</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {pagination?.total ?? users.length} user
                    </span>
                </div>

                {isLoading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : isError ? (
                    <div className="alert alert-error">Gagal memuat data user.</div>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Tidak ada user yang ditemukan.
                    </p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nama</th><th>Email</th><th>Role</th>
                                    <th>OPD</th><th>Status</th>{hasAnyRowAction ? <th>Aksi</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => {
                                    const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.viewer;
                                    return (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{u.email}</td>
                                            <td>
                                                <span className="pill" style={{ background: rs.bg, color: rs.color }}>
                                                    {rs.label}
                                                </span>
                                            </td>
                                            <td>{u.opd ?? '—'}</td>
                                            <td>
                                                <span className={`pill ${u.is_active ? 'pill-safe' : 'pill-critical'}`}>
                                                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            {hasAnyRowAction ? (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {canUpdate && (
                                                            <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                                onClick={() => { setEditUser(u); setShowForm(false); }}
                                                                title="Edit">✎</button>
                                                        )}
                                                        {canToggleActive && (
                                                            <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                                onClick={() => toggleActive.mutate(u.id)}
                                                                title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                                {u.is_active ? <ToggleRight size={14} style={{ color: 'var(--status-green)' }} /> : <ToggleLeft size={14} />}
                                                            </button>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <button className="btn btn-outline"
                                                                style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                                onClick={() => { if (confirm(`Hapus user ${u.name}?`)) deleteUser.mutate(u.id); }}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {pagination && pagination.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
                                <button className="btn btn-outline" style={{ padding: '5px 10px' }}
                                    disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft size={14} />
                                </button>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    Halaman {pagination.page} dari {pagination.totalPages}
                                </span>
                                <button className="btn btn-outline" style={{ padding: '5px 10px' }}
                                    disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                                    <ChevRight size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Events Tab ───────────────────────────────────────────────────
function EventsTab() {
    const [showForm, setShowForm] = useState(false);
    const [editEvent, setEditEvent] = useState(null);
    const [form, setForm] = useState(EMPTY_EVENT);
    const [page, setPage] = useState(1);
    const qc = useQueryClient();

    const { data: eventsResp, isLoading, refetch } = useQuery({
        queryKey: ['events', { page, limit: 15 }],
        queryFn: () => eventsService.getAll({ page, limit: 15 }),
    });

    const events = eventsResp?.data ?? [];
    const pagination = eventsResp?.pagination;

    const createEvent = useMutation({
        mutationFn: eventsService.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events'] });
            toast.success('Kejadian berhasil dibuat');
            setShowForm(false);
            setForm(EMPTY_EVENT);
        },
        onError: err => toast.error(err.response?.data?.message ?? 'Gagal membuat kejadian'),
    });

    const updateEvent = useMutation({
        mutationFn: ({ id, ...data }) => eventsService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events'] });
            toast.success('Kejadian berhasil diperbarui');
            setEditEvent(null);
            setForm(EMPTY_EVENT);
        },
        onError: err => toast.error(err.response?.data?.message ?? 'Gagal memperbarui kejadian'),
    });

    const deleteEvent = useMutation({
        mutationFn: eventsService.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events'] });
            toast.success('Kejadian berhasil dihapus');
        },
        onError: err => toast.error(err.response?.data?.message ?? 'Gagal menghapus kejadian'),
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }) => eventsService.updateStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events'] });
            toast.success('Status kejadian diperbarui');
        },
    });

    const handleEdit = (ev) => {
        setEditEvent(ev);
        setForm({
            title: ev.title, type: ev.type, status: ev.status,
            severity: ev.severity, location_name: ev.location_name,
            start_date: ev.start_date ?? '',
            description: ev.description ?? '',
            latitude: ev.latitude ?? '',
            longitude: ev.longitude ?? '',
            posko_leader: ev.posko_leader ?? '',
            posko_leader_position: ev.posko_leader_position ?? '',
        });
        setShowForm(false);
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        updateEvent.mutate({ id: editEvent.id, ...form });
    };

    return (
        <div>
            {/* Create form */}
            {showForm && !editEvent && (
                <div style={{
                    padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    marginBottom: 16, borderLeft: '3px solid var(--status-red)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Buat Kejadian Baru</span>
                        <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                            onClick={() => setShowForm(false)}><X size={13} /></button>
                    </div>
                    <form onSubmit={e => { e.preventDefault(); createEvent.mutate(form); }}
                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Judul Kejadian *</label>
                            <input className="form-input" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Jenis</label>
                            <select className="form-input" value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}>
                                {Object.entries(EVENT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Lokasi *</label>
                            <input className="form-input" value={form.location_name}
                                onChange={e => setForm({ ...form, location_name: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Severity</label>
                            <select className="form-input" value={form.severity}
                                onChange={e => setForm({ ...form, severity: e.target.value })}>
                                {['ringan', 'sedang', 'berat', 'kritis'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tanggal Mulai</label>
                            <input className="form-input" type="date" value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Ketua Posko</label>
                            <input className="form-input" value={form.posko_leader} placeholder="Nama lengkap..."
                                onChange={e => setForm({ ...form, posko_leader: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Jabatan (Opsional)</label>
                            <input className="form-input" value={form.posko_leader_position} placeholder="Mis: Kalak BPBD"
                                onChange={e => setForm({ ...form, posko_leader_position: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                            <button type="submit" className="btn btn-primary"
                                disabled={createEvent.isPending}>
                                {createEvent.isPending ? '...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit form */}
            {editEvent && (
                <div style={{
                    padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    marginBottom: 16, borderLeft: '3px solid var(--status-yellow)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Edit Kejadian — {editEvent.title}</span>
                        <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                            onClick={() => setEditEvent(null)}><X size={13} /></button>
                    </div>
                    <form onSubmit={handleSubmitEdit}
                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Judul *</label>
                            <input className="form-input" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Jenis</label>
                            <select className="form-input" value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}>
                                {Object.entries(EVENT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Lokasi *</label>
                            <input className="form-input" value={form.location_name}
                                onChange={e => setForm({ ...form, location_name: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Severity</label>
                            <select className="form-input" value={form.severity}
                                onChange={e => setForm({ ...form, severity: e.target.value })}>
                                {['ringan', 'sedang', 'berat', 'kritis'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tanggal Mulai</label>
                            <input className="form-input" type="date" value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Ketua Posko</label>
                            <input className="form-input" value={form.posko_leader} placeholder="Nama lengkap..."
                                onChange={e => setForm({ ...form, posko_leader: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Jabatan (Opsional)</label>
                            <input className="form-input" value={form.posko_leader_position} placeholder="Mis: Kalak BPBD"
                                onChange={e => setForm({ ...form, posko_leader_position: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                            <button type="submit" className="btn btn-primary"
                                disabled={updateEvent.isPending}>
                                {updateEvent.isPending ? '...' : 'Perbarui'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div className="card-title"><AlertCircle size={14} /> MANAJEMEN KEJADIAN BENCANA</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline" style={{ padding: '5px 10px' }} onClick={refetch}>
                            <RefreshCw size={13} />
                        </button>
                        <button className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={() => { setShowForm(v => !v); setEditEvent(null); setForm(EMPTY_EVENT); }}>
                            {showForm ? <X size={13} /> : <Plus size={13} />}
                            {showForm ? ' Tutup' : ' Tambah'}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : events.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Belum ada kejadian terdaftar.
                    </p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Judul</th><th>Jenis</th><th>Lokasi</th>
                                    <th>Severity</th><th>Status</th><th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(ev => (
                                    <tr key={ev.id}>
                                        <td style={{ fontWeight: 600 }}>{ev.title}</td>
                                        <td>{EVENT_TYPE_LABEL[ev.type] ?? ev.type}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{ev.location_name}</td>
                                        <td>
                                            <span className={`pill ${EVENT_SEV_STYLE[ev.severity] ?? 'pill-info'}`}>
                                                {ev.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                className="form-input"
                                                style={{ padding: '3px 8px', fontSize: '0.78rem', height: 'auto', width: 'auto' }}
                                                value={ev.status}
                                                onChange={e => updateStatus.mutate({ id: ev.id, status: e.target.value })}>
                                                {['siaga', 'tanggap_darurat', 'pemulihan', 'selesai'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                                                    title="Edit" onClick={() => handleEdit(ev)}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button className="btn btn-outline"
                                                    style={{ padding: '4px 8px', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                                                    onClick={() => { if (confirm(`Hapus "${ev.title}"?`)) deleteEvent.mutate(ev.id); }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {pagination && pagination.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
                                <button className="btn btn-outline" style={{ padding: '5px 10px' }}
                                    disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft size={14} />
                                </button>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button className="btn btn-outline" style={{ padding: '5px 10px' }}
                                    disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                                    <ChevRight size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminPage() {
    const [tab, setTab] = useState('users');
    const { isSuperAdmin } = usePermission();

    // Admin page component visibility configs (from App Settings)
    const { data: adminCompConfigs = [] } = useComponentsByNavKey('admin');
    const compMap = adminCompConfigs.reduce((acc, c) => {
        acc[c.component_key] = !!c.is_visible;
        return acc;
    }, {});

    const visibleTabs = isSuperAdmin
        ? TABS
        : TABS.filter(t => compMap[`tab_${t.key}`] !== false);

    const configuredRoleOptions = ALL_ROLES.filter(r => compMap[`users_allowed_role:${r}`]);
    const roleOptions = isSuperAdmin
        ? ALL_ROLES
        : (configuredRoleOptions.length > 0 ? configuredRoleOptions : DEFAULT_ADMIN_CREATABLE_ROLES);

    const defaultRole = roleOptions.includes('operator')
        ? 'operator'
        : (roleOptions[0] || 'operator');

    const filterRoles = isSuperAdmin ? ALL_ROLES : DEFAULT_ADMIN_CREATABLE_ROLES;

    const userCaps = {
        read: isSuperAdmin ? true : (compMap['users_crud:read'] !== false),
        create: isSuperAdmin ? true : (compMap['users_crud:create'] !== false),
        update: isSuperAdmin ? true : (compMap['users_crud:update'] !== false),
        toggle_active: isSuperAdmin ? true : (compMap['users_crud:toggle_active'] !== false),
    };

    // Keep selected tab valid if superadmin toggles visibility for admin
    useEffect(() => {
        const isTabVisible = visibleTabs.some(t => t.key === tab);
        if (!isTabVisible) setTab(visibleTabs[0]?.key || 'users');
    }, [tab, visibleTabs]);

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap',
                padding: '4px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            }}>
                {visibleTabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        className={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                            padding: '8px 14px', fontSize: '0.78rem',
                            border: tab === key ? undefined : 'none',
                            background: tab === key ? undefined : 'transparent',
                        }}
                        onClick={() => setTab(key)}
                    >
                        {createElement(Icon, { size: 14 })} {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'users' && (
                <UsersTab
                    roleOptions={roleOptions}
                    defaultRole={defaultRole}
                    filterRoles={filterRoles}
                    canSeeSuperadmin={isSuperAdmin}
                    userCaps={userCaps}
                />
            )}
            {tab === 'events' && <EventsTab />}
            {tab === 'operations' && <OperationsTab />}
            {tab === 'logistics' && <LogisticsTab />}
            {tab === 'refugees' && <RefugeesTab />}
            {tab === 'funding' && <FundingTab />}
            {tab === 'decisions' && <DecisionsTab />}
        </div>
    );
}
