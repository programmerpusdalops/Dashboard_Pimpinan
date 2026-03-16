import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Jangan refetch saat window focus (dashboard tidak perlu real-time via polling sini)
            refetchOnWindowFocus: false,
            // Retry sekali saja saat error (bukan 401/403 — sudah ditangani axios)
            retry: (failureCount, error) => {
                const status = error?.response?.status;
                // Jangan retry untuk client errors (4xx)
                if (status >= 400 && status < 500) return false;
                return failureCount < 1;
            },
            // Data dianggap "fresh" selama 3 menit
            staleTime: 1000 * 60 * 3,
            // Cache tetap ada 10 menit setelah komponen unmount
            gcTime: 1000 * 60 * 10,
        },
        mutations: {
            // Tidak retry mutation secara otomatis
            retry: false,
        },
    },
});

export default queryClient;
