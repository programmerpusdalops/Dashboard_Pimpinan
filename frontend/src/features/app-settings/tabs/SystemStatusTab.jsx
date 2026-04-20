import { useMemo, useState } from 'react';
import { Activity, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import {
    useCreateSystemStatus,
    useDeleteSystemStatus,
    useSystemStatuses,
    useUpdateSystemStatus,
} from '../hooks/useAppSettings';

const INITIAL_FORM = {
    label: '',
    value: '',
    description: '',
    color: '#f59e0b',
    sort_order: 0,
    is_enabled: true,
};

export default function SystemStatusTab() {
    const { data: statuses = [], isLoading, refetch } = useSystemStatuses();
    const createMutation = useCreateSystemStatus();
    const updateMutation = useUpdateSystemStatus();
    const deleteMutation = useDeleteSystemStatus();

    const [form, setForm] = useState(INITIAL_FORM);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const list = useMemo(
        () => (Array.isArray(statuses) ? statuses.slice().sort((a, b) => a.sort_order - b.sort_order) : []),
        [statuses],
    );

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const canSubmit = form.label.trim() && form.description.trim();

    const resetForm = () => {
        setEditing(null);
        setForm(INITIAL_FORM);
    };

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const startEdit = (item) => {
        setEditing(item);
        setForm({
            label: item.label || '',
            value: item.value || '',
            description: item.description || '',
            color: item.color || '#f59e0b',
            sort_order: item.sort_order || 0,
            is_enabled: !!item.is_enabled,
        });
    };

    const handleSubmit = () => {
        if (!canSubmit) return;

        const payload = {
            label: form.label.trim(),
            value: form.value.trim(),
            description: form.description.trim(),
            color: form.color,
            sort_order: Number(form.sort_order) || 0,
            is_enabled: !!form.is_enabled,
        };

        if (editing) {
            updateMutation.mutate({ id: editing.id, payload }, { onSuccess: resetForm });
            return;
        }

        createMutation.mutate(payload, { onSuccess: resetForm });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14 }}>
            <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                    <div className="card-title text-blue" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={16} /> {editing ? 'EDIT SYSTEM STATUS' : 'CREATE SYSTEM STATUS'}
                    </div>
                </div>
                <div className="card-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Label
                        </label>
                        <input
                            className="form-input"
                            value={form.label}
                            onChange={(e) => setField('label', e.target.value)}
                            placeholder="Contoh: Siaga"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Value
                        </label>
                        <input
                            className="form-input"
                            value={form.value}
                            onChange={(e) => setField('value', e.target.value)}
                            placeholder="Contoh: siaga"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                            Keterangan
                        </label>
                        <textarea
                            className="form-input"
                            value={form.description}
                            onChange={(e) => setField('description', e.target.value)}
                            rows={5}
                            style={{ resize: 'vertical' }}
                            placeholder="Jelaskan kapan status ini digunakan."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                Warna
                            </label>
                            <input
                                type="color"
                                className="form-input"
                                value={form.color}
                                onChange={(e) => setField('color', e.target.value)}
                                style={{ height: 42, padding: 6 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                Sort Order
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.sort_order}
                                onChange={(e) => setField('sort_order', e.target.value)}
                            />
                        </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                        <input
                            type="checkbox"
                            checked={form.is_enabled}
                            onChange={(e) => setField('is_enabled', e.target.checked)}
                        />
                        Status ini aktif dan bisa dipilih pimpinan
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSaving}
                            style={{ opacity: !canSubmit || isSaving ? 0.6 : 1 }}
                        >
                            {isSaving ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah Status'}
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
                        <Activity size={16} /> DAFTAR SYSTEM STATUS
                    </div>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={refetch}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
                <div className="card-body" style={{ padding: 12 }}>
                    {isLoading ? (
                        <div className="skeleton" style={{ height: 240 }} />
                    ) : (
                        <table className="data-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Value</th>
                                    <th>Keterangan</th>
                                    <th style={{ width: 110 }}>State</th>
                                    <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((item) => (
                                    <tr key={item.id} style={{ opacity: item.is_enabled ? 1 : 0.55 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span
                                                    style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        background: item.color,
                                                        boxShadow: `0 0 0 4px ${item.color}22`,
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{item.label}</div>
                                                    {item.is_current && (
                                                        <span className="pill pill-info" style={{ marginTop: 4, display: 'inline-block', fontSize: '0.68rem' }}>
                                                            Aktif saat ini
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <code>{item.value}</code>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.35 }}>
                                            {item.description}
                                        </td>
                                        <td>
                                            <span className={`pill ${item.is_enabled ? 'pill-safe' : 'pill-critical'}`}>
                                                {item.is_enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                                <button
                                                    className="btn btn-outline"
                                                    onClick={() => startEdit(item)}
                                                    title="Edit"
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    onClick={() => setConfirmDelete(item)}
                                                    title="Hapus"
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
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--text-muted)' }}>
                                            Belum ada status sistem.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                title="Hapus Status Sistem"
                message="Status yang dihapus tidak bisa dikembalikan. Pastikan bukan status terakhir."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                confirmVariant="danger"
                onCancel={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (!confirmDelete) return;
                    deleteMutation.mutate(confirmDelete.id, {
                        onSuccess: () => setConfirmDelete(null),
                    });
                }}
            />
        </div>
    );
}
