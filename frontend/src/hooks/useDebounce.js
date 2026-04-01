/**
 * hooks/useDebounce.js
 * Debounce value untuk search input agar tidak spam API call
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchText, 400);
 *   // gunakan debouncedSearch di useQuery params
 */
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 400) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
