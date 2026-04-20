/**
 * store/useLayoutStore.js
 * Zustand store untuk layout UI (sidebar collapsed)
 */
import { create } from 'zustand';

const STORAGE_KEY = 'sidebar_collapsed';

function getInitialCollapsed() {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function applyCollapsedToDom(collapsed) {
    const root = document.documentElement;
    if (collapsed) root.setAttribute('data-sidebar', 'collapsed');
    else root.removeAttribute('data-sidebar');
}

const initial = getInitialCollapsed();
applyCollapsedToDom(initial);

const useLayoutStore = create((set, get) => ({
    sidebarCollapsed: initial,
    setSidebarCollapsed: (collapsed) => {
        applyCollapsedToDom(!!collapsed);
        try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
        set({ sidebarCollapsed: !!collapsed });
    },
    toggleSidebar: () => {
        const next = !get().sidebarCollapsed;
        get().setSidebarCollapsed(next);
    },
}));

export default useLayoutStore;

