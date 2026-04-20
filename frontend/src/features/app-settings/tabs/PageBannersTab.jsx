import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Power, RefreshCw, ShieldAlert } from 'lucide-react';
import {
    useBanners,
    useNavPages,
    useCreateBanner,
    useUpdateBanner,
    useToggleBanner,
    useDeleteBanner,
} from '../hooks/useAppSettings';

const ROLE_OPTIONS = [
    { value: 'all', label: 'Semua Pengguna' },
    { value: 'pimpinan', label: 'Pimpinan' },
    { value: 'admin', label: 'Admin' },
    { value: 'operator', label: 'Operator' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'superadmin', label: 'Super Admin' },
];

const TYPE_OPTIONS = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'alert', label: 'Alert' },
];

export default function PageBannersTab() {
    const { data: banners = [], isLoading, refetch } = useBanners();
    const { data: navPages = [] } = useNavPages();
    const createMutation = useCreateBanner();
    const updateMutation = useUpdateBanner();
    const toggleMutation = useToggleBanner();
    const deleteMutation = useDeleteBanner();

    const [editing, setEditing] = useState(null);
    const [useCustomPath, setUseCustomPath] = useState(false);
    const [form, setForm] = useState({
        page_path: '/admin',
        banner_type: 'info',
        target_role: 'all',
        title: 'Panel Admin',
        message: 'Kelola seluruh data Command Center dari sini. Perubahan bersifat permanen.',
        sort_order: 0,
        is_active: true,
        is_dismissible: true,
    });

    const list = useMemo(() => {
        if (!Array.isArray(banners)) return [];
        return banners;
    }, [banners]);

    const pageOptions = useMemo(() => {
        const items = Array.isArray(navPages) ? navPages : [];
        const uniq = new Map();
        items.forEach((p) => {
            if (p?.path && !uniq.has(p.path)) {
                uniq.set(p.path, { value: p.path, label: p.nav_label ? `${p.nav_label} (${p.path})` : p.path });
            }
        });
        return Array.from(uniq.values());
    }, [navPages]);

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setEditing(null);
        setUseCustomPath(false);
        setForm({
            page_path: '/admin',
            banner_type: 'info',
            target_role: 'all',
            title: 'Panel Admin',
            message: 'Kelola seluruh data Command Center dari sini. Perubahan bersifat permanen.',
            sort_order: 0,
            is_active: true,
            is_dismissible: true,
        });
    };

    const startEdit = (b) => {
        setEditing(b);
        const knownPaths = new Set((pageOptions || []).map(o => o.value).concat(['*']));
        setUseCustomPath(!knownPaths.has(b.page_path));
        setForm({
            page_path: b.page_path,
            banner_type: b.banner_type,
            target_role: b.target_role,
            title: b.title,
            message: b.message,
            sort_order: b.sort_order || 0,
            is_active: !!b.is_active,
            is_dismissible: !!b.is_dismissible,
        });
    };

    const canSubmit = form.page_path?.trim() && form.title?.trim() && form.message?.trim();

    const handleSubmit = () => {
        if (!canSubmit) return;
        const payload = {
            page_path: form.page_path.trim(),
            banner_type: form.banner_type,
            target_role: form.target_role,
            title: form.title.trim(),
            message: form.message.trim(),
            sort_order: Number(form.sort_order) || 0,
            is_active: !!form.is_active,
            is_dismissible: !!form.is_dismissible,
        };

        if (editing) {
            updateMutation.mutate({ id: editing.id, payload }, { onSuccess: resetForm });
        } else {
            createMutation.mutate(payload, { onSuccess: resetForm });
        }
    };

    if (isLoading) {
        return <div className="skeleton" style={{ height: 260 }} />;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
            <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                    <div className="card-title text-blue" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={16} /> {editing ? 'EDIT PAGE BANNER' : 'CREATE PAGE BANNER'}
                    </div>
                </div>
                <div className="card-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Target Halaman (path)
                        </label>
                        <select
                            className="form-input"
                            value={useCustomPath ? '__custom__' : (form.page_path || '')}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '__custom__') {
                                    setUseCustomPath(true);
                                    setField('page_path', '');
                                } else {
                                    setUseCustomPath(false);
                                    setField('page_path', v);
                                }
                            }}
                        >
                            <option value="*">Global (semua halaman) (*)</option>
                            {pageOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                            <option value="__custom__">Custom path...</option>
                        </select>
                        {useCustomPath && (
                            <input
                                className="form-input"
                                style={{ marginTop: 8 }}
                                value={form.page_path}
                                onChange={(e) => setField('page_path', e.target.value)}
                                placeholder="Ketik path manual. Contoh: /admin atau /ops"
                            />
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                Jenis
                            </label>
                            <select className="form-input" value={form.banner_type} onChange={(e) => setField('banner_type', e.target.value)}>
                                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                Target Role
                            </label>
                            <select className="form-input" value={form.target_role} onChange={(e) => setField('target_role', e.target.value)}>
                                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Judul
                        </label>
                        <input className="form-input" value={form.title} onChange={(e) => setField('title', e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Teks
                        </label>
                        <textarea
                            className="form-input"
                            style={{ width: '100%', minHeight: 120, resize: 'vertical' }}
                            value={form.message}
                            onChange={(e) => setField('message', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                Urutan (sort)
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.sort_order}
                                onChange={(e) => setField('sort_order', e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                                <input type="checkbox" checked={!!form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                                Aktif
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                                <input type="checkbox" checked={!!form.is_dismissible} onChange={(e) => setField('is_dismissible', e.target.checked)} />
                                Bisa ditutup (exit)
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: (!canSubmit || createMutation.isPending || updateMutation.isPending) ? 0.6 : 1 }}
                        >
                            {editing ? <Pencil size={14} /> : <Plus size={14} />}
                            {editing ? 'Simpan' : 'Tambah'}
                        </button>
                        {editing && (
                            <button className="btn btn-outline" onClick={resetForm}>
                                Batal
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ margin: 0 }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="card-title text-blue" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={16} /> DAFTAR BANNERS
                    </div>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={refetch}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
                <div className="card-body" style={{ padding: 12 }}>
                    <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                            <tr>
                                <th>Path</th>
                                <th>Type</th>
                                <th>Role</th>
                                <th>Title</th>
                                <th style={{ width: 90, textAlign: 'center' }}>Aktif</th>
                                <th style={{ width: 140, textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((b) => (
                                <tr key={b.id} style={{ opacity: b.is_active ? 1 : 0.5 }}>
                                    <td><code style={{ fontSize: '0.78rem' }}>{b.page_path}</code></td>
                                    <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{b.banner_type}</td>
                                    <td>{b.target_role}</td>
                                    <td style={{ fontWeight: 600 }}>{b.title}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`pill ${b.is_active ? 'pill-safe' : 'pill-critical'}`} style={{ fontSize: '0.72rem' }}>
                                            {b.is_active ? 'ON' : 'OFF'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                            <button
                                                className="btn btn-outline"
                                                title="Edit"
                                                onClick={() => startEdit(b)}
                                                style={{ padding: '4px 8px' }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                title="Toggle aktif"
                                                onClick={() => toggleMutation.mutate(b.id)}
                                                disabled={toggleMutation.isPending}
                                                style={{ padding: '4px 8px' }}
                                            >
                                                <Power size={14} />
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                title="Hapus"
                                                onClick={() => deleteMutation.mutate(b.id)}
                                                disabled={deleteMutation.isPending}
                                                style={{ padding: '4px 8px', borderColor: 'rgba(239,68,68,0.35)', color: 'var(--status-red)' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {list.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 14, color: 'var(--text-muted)' }}>
                                        Belum ada banner.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
