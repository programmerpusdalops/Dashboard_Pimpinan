import { useEffect } from 'react';
import './Modal.css';

export default function Modal({
    open,
    title,
    headerExtra,
    headerRight,
    showCloseButton = true,
    children,
    footer,
    onClose,
    maxWidth = 720,
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => { 
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-label={title || 'Modal'}>
            <button className="app-modal-backdrop" onClick={onClose} aria-label="Close" />
            <div className="app-modal-card" style={{ maxWidth }}>
                {(title || onClose) && (
                    <div className="app-modal-header">
                        <div className="app-modal-header-left">
                            <div className="app-modal-title">{title}</div>
                            {headerExtra}
                        </div>
                        <div className="app-modal-header-right">
                            {headerRight}
                        </div>
                        {onClose && showCloseButton && (
                            <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={onClose}>
                                Tutup
                            </button>
                        )}
                    </div>
                )}
                <div className="app-modal-body">{children}</div>
                {footer && <div className="app-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
