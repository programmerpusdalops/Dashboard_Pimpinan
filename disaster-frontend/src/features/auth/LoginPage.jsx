import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = res.data.data;
            setAuth(user, accessToken, refreshToken);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <ShieldAlert size={40} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h1>Command Center</h1>
                <p className="subtitle">Disaster Management Dashboard</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-input"
                            placeholder="admin@bpbd.go.id"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="form-input"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary btn-login"
                        disabled={loading}
                    >
                        {loading ? 'Memproses...' : <><LogIn size={16} /> Masuk</>}
                    </button>
                </form>

                <p style={{ marginTop: 20, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Demo: admin@bpbd.go.id / admin123
                </p>
            </div>
        </div>
    );
}
