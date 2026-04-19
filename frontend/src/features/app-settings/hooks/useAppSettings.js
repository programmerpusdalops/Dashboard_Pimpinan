/**
 * features/app-settings/hooks/useAppSettings.js
 * React Query hooks untuk App Settings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appSettingsService } from '../../../services/appSettings.service';
import { toast } from '../../../lib/toast';

export const settingsKeys = {
    navAccess: ['app-settings', 'nav-access'],
    navAccessByRole: (role) => ['app-settings', 'nav-access', role],
    components: ['app-settings', 'components'],
    componentsByNav: (navKey) => ['app-settings', 'components', navKey],
    notifDots: ['app-settings', 'notif-dots'],
    notifDotsPublic: ['app-settings', 'notif-dots-public'],
};

// ── Nav Access ─────────────────────────────────────────────────

export function useNavAccess() {
    return useQuery({
        queryKey: settingsKeys.navAccess,
        queryFn: appSettingsService.getNavAccess,
    });
}

export function useNavAccessByRole(role) {
    return useQuery({
        queryKey: settingsKeys.navAccessByRole(role),
        queryFn: () => appSettingsService.getNavAccessByRole(role),
        enabled: !!role,
    });
}

export function useToggleNavAccess() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.toggleNavAccess,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'nav-access'] });
            toast.success('Nav visibility diubah');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah nav visibility'),
    });
}

// ── Component Visibility ───────────────────────────────────────

export function useComponents() {
    return useQuery({
        queryKey: settingsKeys.components,
        queryFn: appSettingsService.getComponents,
    });
}

export function useComponentsByNavKey(navKey) {
    return useQuery({
        queryKey: settingsKeys.componentsByNav(navKey),
        queryFn: () => appSettingsService.getComponentsByNavKey(navKey),
        enabled: !!navKey,
    });
}

export function useToggleComponent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.toggleComponent,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'components'] });
            toast.success('Component visibility diubah');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah component visibility'),
    });
}

// ── Notification Dots ──────────────────────────────────────────

export function useNotifDots() {
    return useQuery({
        queryKey: settingsKeys.notifDots,
        queryFn: appSettingsService.getNotifDots,
    });
}

export function useNotifDotsPublic() {
    return useQuery({
        queryKey: settingsKeys.notifDotsPublic,
        queryFn: appSettingsService.getNotifDotsPublic,
        staleTime: 30000,
    });
}

export function useToggleNotifDot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.toggleNotifDot,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'notif-dots'] });
            qc.invalidateQueries({ queryKey: ['app-settings', 'notif-dots-public'] });
            toast.success('Notification dot diubah');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah notification dot'),
    });
}

export function useSendSystemNotification() {
    return useMutation({
        mutationFn: appSettingsService.sendNotification,
        onSuccess: () => {
            toast.success('System notification sent.');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim pesan sistem.'),
    });
}
