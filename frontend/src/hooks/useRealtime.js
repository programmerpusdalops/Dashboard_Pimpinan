import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data.data || [];
        },
        staleTime: 60 * 1000,
    });
};

export const useRealtimeAppEvents = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const streamUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3010/api/v1') + '/app-settings/stream';
        
        let eventSource;
        try {
            eventSource = new EventSource(streamUrl, { withCredentials: true });

            eventSource.addEventListener('settings_changed', () => {
                queryClient.invalidateQueries({ queryKey: ['app-settings'] });
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            });
            
            eventSource.addEventListener('error', () => {
                // Ignore silent reconnect errors
            });
        } catch (e) {
            console.error('SSE Error', e);
        }

        return () => {
            if (eventSource) eventSource.close();
        };
    }, [queryClient]);
};
