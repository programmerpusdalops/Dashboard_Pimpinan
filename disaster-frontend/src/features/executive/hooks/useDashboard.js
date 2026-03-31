/**
 * features/executive/hooks/useDashboard.js
 * React Query hooks untuk data Executive Dashboard
 * ─ Enhanced: auto-refresh 30s, funding data, event filter support
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboard.service';
import { decisionsService } from '../../../services/operations.service';
import { fundingService } from '../../../services/funding.service';
import { eventsService } from '../../../services/events.service';

// Query keys — terpusat agar mudah di-invalidate
export const dashboardKeys = {
    all: ['dashboard'],
    kpi: () => [...dashboardKeys.all, 'kpi'],
    priorities: () => [...dashboardKeys.all, 'priorities'],
    mapGeoJson: () => [...dashboardKeys.all, 'map-geojson'],
    funding: () => [...dashboardKeys.all, 'funding'],
    events: () => [...dashboardKeys.all, 'events-list'],
};

const REFETCH_INTERVAL = 30_000; // 30 detik auto-refresh

export function useDashboardKpi(eventId) {
    return useQuery({
        queryKey: [...dashboardKeys.kpi(), eventId],
        queryFn: () => dashboardService.getKpi(eventId),
        staleTime: 1000 * 60,
        refetchInterval: REFETCH_INTERVAL,
    });
}

export function useDashboardPriorities(eventId) {
    return useQuery({
        queryKey: [...dashboardKeys.priorities(), eventId],
        queryFn: () => dashboardService.getPriorities(eventId),
        staleTime: 1000 * 60,
        refetchInterval: REFETCH_INTERVAL,
    });
}

export function useMapGeoJson(eventId) {
    return useQuery({
        queryKey: [...dashboardKeys.mapGeoJson(), eventId],
        queryFn: () => dashboardService.getMapGeoJson(eventId),
        staleTime: 1000 * 60 * 5,
        refetchInterval: REFETCH_INTERVAL,
    });
}

export function useRecentDecisions(limit = 5, eventId) {
    return useQuery({
        queryKey: ['decisions', 'recent', limit, eventId],
        queryFn: () => decisionsService.getDecisions({ event_id: eventId }),
        select: (data) => (Array.isArray(data) ? data.slice(0, limit) : []),
        staleTime: 1000 * 60 * 2,
        refetchInterval: REFETCH_INTERVAL,
    });
}

export function useFundingSummary(eventId) {
    return useQuery({
        queryKey: [...dashboardKeys.funding(), eventId],
        queryFn: async () => {
            const [allocations, expenditures] = await Promise.all([
                fundingService.getAllocations(eventId),
                fundingService.getExpenditures(eventId),
            ]);
            const totalAllocated = (allocations ?? []).reduce((s, a) => s + Number(a.total_amount || 0), 0);
            
            // For expenditures, when filtering by event, we may need to only sum expenditures 
            // tied to allocations for that event. Since our backend might return all expenditures 
            // if we don't fix the /funding/expenditures to filter by event_id across joined tables, 
            // we will do the filtering safely here on the frontend if needed, but assuming 
            // the backend handles it or we approximate it. 
            // Wait, our backend /funding route already returns the perfectly aggregated data!
            // Let's use fundingService.getSummary(eventId) instead!
            return await fundingService.getSummary(eventId);
        },
        staleTime: 1000 * 60 * 2,
        refetchInterval: REFETCH_INTERVAL,
    });
}

export function useActiveEvents() {
    return useQuery({
        queryKey: dashboardKeys.events(),
        queryFn: () => eventsService.getAll({ limit: 100 }),
        select: (resp) => {
            const all = resp?.data ?? [];
            return all.filter(e => e.status === 'siaga' || e.status === 'tanggap_darurat');
        },
        staleTime: 1000 * 60 * 2,
        refetchInterval: REFETCH_INTERVAL,
    });
}
