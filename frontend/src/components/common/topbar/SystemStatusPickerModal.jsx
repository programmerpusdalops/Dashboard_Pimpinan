import { useMemo, useState } from 'react';
import Modal from '../Modal';
import { hexToRgbString } from '../../../lib/color';

export default function SystemStatusPickerModal({
    open,
    statuses,
    currentStatus,
    isPending,
    onClose,
    onSubmit,
}) {
    const [selectedId, setSelectedId] = useState(currentStatus?.id ?? null);

    const selectedIndex = useMemo(
        () => Math.max(statuses.findIndex((item) => item.id === selectedId), 0),
        [selectedId, statuses],
    );

    const selectedStatus = statuses.find((item) => item.id === selectedId) || statuses[0] || null;
    const canSubmit = selectedStatus && selectedStatus.id !== currentStatus?.id;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Ubah Status Sistem"
            maxWidth={760}
            footer={(
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Hanya akun pimpinan yang dapat menerapkan status operasional.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-outline" onClick={onClose}>
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!canSubmit || isPending}
                            onClick={() => selectedStatus && onSubmit(selectedStatus.id)}
                            style={{ opacity: !canSubmit || isPending ? 0.6 : 1 }}
                        >
                            {isPending ? 'Menyimpan...' : 'Terapkan'}
                        </button>
                    </div>
                </div>
            )}
        >
            {statuses.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Belum ada status yang bisa dipilih.</div>
            ) : (
                <div className="status-picker">
                    <div
                        className="status-picker-nav"
                        style={{
                            '--status-count': statuses.length,
                            '--status-active-index': selectedIndex,
                            '--status-active-color': selectedStatus?.color || '#f59e0b',
                            '--status-active-rgb': hexToRgbString(selectedStatus?.color),
                        }}
                        role="radiogroup"
                        aria-label="Pilihan status sistem"
                    >
                        <div className="status-picker-slider" />
                        {statuses.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="radio"
                                aria-checked={item.id === selectedId}
                                className={`status-picker-option${item.id === selectedId ? ' is-active' : ''}`}
                                style={{
                                    '--status-option-color': item.color,
                                    '--status-option-rgb': hexToRgbString(item.color),
                                }}
                                onClick={() => setSelectedId(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div
                        className="status-picker-description"
                        style={{
                            '--status-active-color': selectedStatus?.color || '#f59e0b',
                            '--status-active-rgb': hexToRgbString(selectedStatus?.color),
                        }}
                    >
                        <div className="status-picker-description-label">
                            Kapan status ini diterapkan
                        </div>
                        <div className="status-picker-description-text">
                            {selectedStatus?.description}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
