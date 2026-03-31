import { useEffect, useState } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/useThemeStore';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
    const [time, setTime] = useState('');
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

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

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isDark = theme === 'dark';

    return (
        <header className="topbar">
            <h2>{title}</h2>
            <div className="topbar-actions">
                <div className="time-display">{time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {user?.name}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px' }}
                        title="Logout"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </header>
    );
}
