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
    systemStatuses: ['app-settings', 'system-statuses'],
    systemStatusesPublic: ['app-settings', 'system-statuses-public'],
    banners: ['app-settings', 'banners'],
    bannersByPath: (path) => ['app-settings', 'banners', 'page', path],
    navPages: ['app-settings', 'nav-pages'],
    systemNotifications: (limit) => ['app-settings', 'system-notifications', limit || 50],
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

export function useSystemStatusesPublic() {
    return useQuery({
        queryKey: settingsKeys.systemStatusesPublic,
        queryFn: appSettingsService.getSystemStatusesPublic,
        staleTime: 30000,
    });
}

export function useSystemStatuses() {
    return useQuery({
        queryKey: settingsKeys.systemStatuses,
        queryFn: appSettingsService.getSystemStatuses,
    });
}

export function useSetCurrentSystemStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.setCurrentSystemStatus,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses'] });
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses-public'] });
            toast.success('Status sistem diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah status sistem'),
    });
}

export function useCreateSystemStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.createSystemStatus,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses'] });
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses-public'] });
            toast.success('Status sistem dibuat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat status sistem'),
    });
}

export function useUpdateSystemStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.updateSystemStatus,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses'] });
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses-public'] });
            toast.success('Status sistem diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui status sistem'),
    });
}

export function useDeleteSystemStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.deleteSystemStatus,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses'] });
            qc.invalidateQueries({ queryKey: ['app-settings', 'system-statuses-public'] });
            toast.success('Status sistem dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus status sistem'),
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

export function useSystemNotifications(limit = 50) {
    return useQuery({
        queryKey: settingsKeys.systemNotifications(limit),
        queryFn: () => appSettingsService.getSystemNotifications(limit),
    });
}

export function useUpdateSystemNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.updateSystemNotification,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('System message diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui system message'),
    });
}

export function useDeleteSystemNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.deleteSystemNotification,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('System message dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus system message'),
    });
}

export function useBulkDeleteSystemNotifications() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.bulkDeleteSystemNotifications,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ['app-settings'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(`Bulk delete berhasil (${res?.deletedCount ?? 0})`);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal bulk delete system message'),
    });
}

// â”€â”€ Page Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useBanners() {
    return useQuery({
        queryKey: settingsKeys.banners,
        queryFn: appSettingsService.getBanners,
    });
}

export function useBannersByPath(path) {
    return useQuery({
        queryKey: settingsKeys.bannersByPath(path || '/'),
        queryFn: () => appSettingsService.getBannersByPath(path || '/'),
        enabled: !!path,
        staleTime: 30000,
    });
}

export function useCreateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.createBanner,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'banners'] });
            toast.success('Banner dibuat');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat banner'),
    });
}

export function useUpdateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.updateBanner,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'banners'] });
            toast.success('Banner diperbarui');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui banner'),
    });
}

export function useToggleBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.toggleBanner,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'banners'] });
            toast.success('Banner ditoggle');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal toggle banner'),
    });
}

export function useDeleteBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: appSettingsService.deleteBanner,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['app-settings', 'banners'] });
            toast.success('Banner dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal hapus banner'),
    });
}

export function useNavPages() {
    return useQuery({
        queryKey: settingsKeys.navPages,
        queryFn: appSettingsService.getNavPages,
    });
}
