import { useEffect } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({
    open,
    title = 'Konfirmasi',
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="confirm-dialog-overlay" role="dialog" aria-modal="true" aria-label={title}>
            <div className="confirm-dialog-card">
                <div className="confirm-dialog-title">{title}</div>
                {message && <div className="confirm-dialog-message">{message}</div>}
                <div className="confirm-dialog-actions">
                    <button className="btn btn-outline" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <button className="confirm-dialog-backdrop" onClick={onCancel} aria-label="Close" />
        </div>
    );
}

