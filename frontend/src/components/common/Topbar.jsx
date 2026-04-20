import { useEffect, useState } from 'react';
import './Topbar.css';

import { Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSetCurrentSystemStatus, useSystemStatusesPublic } from '../../features/app-settings/hooks/useAppSettings';
import useThemeStore from '../../store/useThemeStore';
import useAuthStore from '../../store/authStore';
import useLayoutStore from '../../store/useLayoutStore';
import SystemStatusBadge from './topbar/SystemStatusBadge';
import SystemStatusPickerModal from './topbar/SystemStatusPickerModal';

export default function Topbar() {
    const [time, setTime] = useState('');
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
    const { user } = useAuthStore();
    const { data: statusPayload } = useSystemStatusesPublic();
    const setCurrentStatusMutation = useSetCurrentSystemStatus();

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const str = now.toLocaleDateString('id-ID', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            }) + ' | ' + now.toLocaleTimeString('id-ID', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
            setTime(str);
        };
        updateTime();
        const id = setInterval(updateTime, 1000);
        return () => clearInterval(id);
    }, []);

    const isDark = theme === 'dark';
    const isPimpinan = user?.role === 'pimpinan';
    const statuses = statusPayload?.statuses || [];
    const currentStatus = statusPayload?.currentStatus || null;

    return (
        <>
        <header className="topbar">
            <div className="topbar-left">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="btn btn-outline"
                    title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    style={{ padding: '6px 10px' }}
                >
                    {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
                <SystemStatusBadge
                    status={currentStatus}
                    isPimpinan={isPimpinan}
                    onClick={() => setStatusModalOpen(true)}
                />
            </div>

            <div className="topbar-center">
                <div className="time-display">{time}</div>
            </div>

            <div className="topbar-actions">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn btn-outline"
                    style={{
                        padding: '6px 10px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                >
                    <span style={{
                        display: 'inline-flex',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        transform: isDark ? 'rotate(0deg)' : 'rotate(-90deg)',
                        opacity: isDark ? 1 : 0,
                        position: isDark ? 'relative' : 'absolute',
                    }}>
                        <Sun size={15} />
                    </span>
                    <span style={{
                        display: 'inline-flex',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        transform: isDark ? 'rotate(90deg)' : 'rotate(0deg)',
                        opacity: isDark ? 0 : 1,
                        position: isDark ? 'absolute' : 'relative',
                    }}>
                        <Moon size={15} />
                    </span>
                </button>
            </div>
        </header>
        <SystemStatusPickerModal
            key={`${statusModalOpen ? 'open' : 'closed'}-${currentStatus?.id ?? 'none'}`}
            open={statusModalOpen}
            statuses={statuses}
            currentStatus={currentStatus}
            isPending={setCurrentStatusMutation.isPending}
            onClose={() => setStatusModalOpen(false)}
            onSubmit={(statusId) => {
                setCurrentStatusMutation.mutate(statusId, {
                    onSuccess: () => setStatusModalOpen(false),
                });
            }}
        />
        </>
    );
}
