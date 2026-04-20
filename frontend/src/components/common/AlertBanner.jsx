import { useState } from 'react';
import { X } from 'lucide-react';

export default function AlertBanner({
    icon: Icon,
    title,
    children,
    color = '#a855f7',
    background = 'rgba(168, 85, 247, 0.08)',
    borderColor = 'rgba(168, 85, 247, 0.2)',
    dismissible = true,
    persistKey,
    onDismiss,
}) {
    const storageKey = persistKey ? `dismissed_banner:${persistKey}` : null;
    const [isVisible, setIsVisible] = useState(() => {
        if (!storageKey) return true;
        try {
            return localStorage.getItem(storageKey) !== '1';
        } catch {
            return true;
        }
    });

    if (!isVisible) return null;

    const handleDismiss = () => {
        if (storageKey) {
            try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
        }
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', background,
            borderRadius: 'var(--radius-md)', border: `1px solid ${borderColor}`,
            animation: 'fadeIn 0.3s ease'
        }}>
            {Icon && <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />}
            <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {title && <strong>{title}</strong>}
                {title && ' — '}
                {children}
            </div>
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    aria-label="Close"
                    title="Close"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

