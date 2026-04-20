/**
 * store/useAppDateStore.js
 * Selected date context (YYYY-MM-DD) persisted to localStorage.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'app-selected-date';

function todayISO() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function getInitialDate() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
    } catch { /* ignore */ }
    return todayISO();
}

const useAppDateStore = create((set) => ({
    selectedDate: getInitialDate(),
    setSelectedDate: (value) => {
        const next = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayISO();
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
        set({ selectedDate: next });
    },
}));

export default useAppDateStore;

