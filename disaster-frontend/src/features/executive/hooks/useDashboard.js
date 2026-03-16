/**
 * features/executive/hooks/useDashboard.js
 * React Query hooks untuk data Executive Dashboard
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboard.service';
import { decisionsService } from '../../../services/operations.service';

// Query keys — terpusat agar mudah di-invalidate
export const dashboardKeys = {
    all: ['dashboard'],
    kpi: () => [...dashboardKeys.all, 'kpi'],
    priorities: () => [...dashboardKeys.all, 'priorities'],
    mapGeoJson: () => [...dashboardKeys.all, 'map-geojson'],
};

export function useDashboardKpi() {
    return useQuery({
        queryKey: dashboardKeys.kpi(),
        queryFn: dashboardService.getKpi,
        // KPI lebih cepat stale (1 menit) karena data kritis
        staleTime: 1000 * 60,
    });
}

export function useDashboardPriorities() {
    return useQuery({
        queryKey: dashboardKeys.priorities(),
        queryFn: dashboardService.getPriorities,
        staleTime: 1000 * 60,
    });
}

export function useMapGeoJson() {
    return useQuery({
        queryKey: dashboardKeys.mapGeoJson(),
        queryFn: dashboardService.getMapGeoJson,
        staleTime: 1000 * 60 * 5,
    });
}

export function useRecentDecisions(limit = 5) {
    return useQuery({
        queryKey: ['decisions', 'recent', limit],
        queryFn: () => decisionsService.getDecisions(),
        select: (data) => (Array.isArray(data) ? data.slice(0, limit) : []),
        staleTime: 1000 * 60 * 2,
    });
}
