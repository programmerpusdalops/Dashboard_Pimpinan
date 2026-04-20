import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { useBannersByPath } from '../../features/app-settings/hooks/useAppSettings';
import AlertBanner from './AlertBanner';

const TYPE_META = {
    alert: {
        icon: ShieldAlert,
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    warning: {
        icon: AlertTriangle,
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    info: {
        icon: Info,
        color: '#3b82f6',
        background: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.25)',
    },
};

export default function PageBanners() {
    const location = useLocation();
    const path = location.pathname || '/';
    const [dismissedNonce, setDismissedNonce] = useState(0);

    const { data: banners = [] } = useBannersByPath(path);

    const items = useMemo(() => {
        if (!Array.isArray(banners)) return [];
        return banners;
    }, [banners]);

    const visibleItems = useMemo(() => {
        // Force refresh calculation when a notification is dismissed
        const _ = dismissedNonce; 
        return items.filter((b) => {
            const persistKey = `${b.id}:${b.updatedAt || ''}`;
            const storageKey = `dismissed_banner:${persistKey}`;
            try {
                return localStorage.getItem(storageKey) !== '1';
            } catch {
                return true;
            }
        });
    }, [items, dismissedNonce]);

    if (!visibleItems.length) return null;

    return (
        <div style={{ padding: '16px 16px 0' }}>
            {visibleItems.map((b) => {
                const meta = TYPE_META[b.banner_type] || TYPE_META.info;
                const persistKey = `${b.id}:${b.updatedAt || ''}`;
                return (
                    <AlertBanner
                        key={b.id}
                        icon={meta.icon}
                        title={b.title}
                        color={meta.color}
                        background={meta.background}
                        borderColor={meta.borderColor}
                        dismissible={!!b.is_dismissible}
                        persistKey={persistKey}
                        onDismiss={() => setDismissedNonce(v => v + 1)}
                    >
                        {b.message}
                    </AlertBanner>
                );
            })}
        </div>
    );
}
