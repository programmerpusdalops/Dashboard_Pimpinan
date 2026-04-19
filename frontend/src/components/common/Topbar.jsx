import { useEffect, useState } from 'react';
import './Topbar.css';

import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

export default function Topbar({ title }) {
    const [time, setTime] = useState('');
    const { theme, toggleTheme } = useThemeStore();

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

    return (
        <header className="topbar">
            <h2>{title}</h2>
            <div className="topbar-actions">
                <div className="time-display">{time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="topbar-status">
                        <span className="status-dot" />
                        <span>STATUS: SIAGA</span>
                    </div>
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
            </div>
        </header>
    );
}
