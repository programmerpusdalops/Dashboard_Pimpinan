/**
 * lib/toast.js
 * Lightweight toast notification tanpa library eksternal.
 * Menggunakan DOM langsung agar tidak perlu Provider di root.
 *
 * Usage dari hooks/components:
 *   import { toast } from '../lib/toast';
 *   toast.success('Berhasil disimpan');
 *   toast.error('Terjadi kesalahan');
 *   toast.info('Sedang memproses...');
 */

const DURATION = 3500;

function createToast(message, type = 'info') {
    // Pastikan container ada
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const colors = {
        success: { bg: '#10b981', icon: '✓' },
        error: { bg: '#ef4444', icon: '✕' },
        warning: { bg: '#f59e0b', icon: '⚠' },
        info: { bg: '#3b82f6', icon: 'ℹ' },
    };
    const { bg, icon } = colors[type] || colors.info;

    const el = document.createElement('div');
    el.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        background: #1e293b;
        border-left: 4px solid ${bg};
        color: #f1f5f9;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        pointer-events: all;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.25s ease;
        max-width: 320px;
        min-width: 200px;
    `;
    el.innerHTML = `
        <span style="color:${bg};font-weight:700;font-size:1rem;flex-shrink:0">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateX(0)';
        });
    });

    // Auto remove
    const timer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => el.remove(), 300);
    }, DURATION);

    // Click to dismiss
    el.addEventListener('click', () => {
        clearTimeout(timer);
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    });
}

export const toast = {
    success: (msg) => createToast(msg, 'success'),
    error: (msg) => createToast(msg, 'error'),
    warning: (msg) => createToast(msg, 'warning'),
    info: (msg) => createToast(msg, 'info'),
};
