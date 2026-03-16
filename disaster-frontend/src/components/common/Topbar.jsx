import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
    const [time, setTime] = useState('');
    const { user, logout } = useAuthStore();
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

    return (
        <header className="topbar">
            <h2>{title}</h2>
            <div className="topbar-actions">
                <div className="time-display">{time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
