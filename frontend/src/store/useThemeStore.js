/**
 * store/useThemeStore.js
 * Zustand store untuk theme (dark / light)
 * Persist ke localStorage, sync ke document.documentElement.dataset.theme
 */
import { create } from 'zustand';

const STORAGE_KEY = 'app-theme';

// Baca dari localStorage, default = 'dark'
function getInitialTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return 'dark';
}

// Langsung apply saat load agar tidak ada flash
const initial = getInitialTheme();
document.documentElement.setAttribute('data-theme', initial);

const useThemeStore = create((set) => ({
    theme: initial,
    toggleTheme: () =>
        set((state) => {
            const next = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
            return { theme: next };
        }),
}));

export default useThemeStore;
