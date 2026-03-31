import { useState } from 'react';
import { MessageSquarePlus, Filter, History, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useInstructions } from '../../hooks/useInstructions';
import { InstructionCard } from '../../components/common/InstructionPanel';

const MODULE_OPTIONS = [
    { value: '', label: 'Semua Modul' },
    { value: 'dasbor', label: 'Dasbor Utama' },
    { value: 'peta', label: 'Peta Risiko & Dampak' },
    { value: 'operasi', label: 'Pusat Pengendalian' },
    { value: 'logistik', label: 'Gudang & Logistik' },
    { value: 'pengungsi', label: 'Data Pengungsi' },
    { value: 'anggaran', label: 'Anggaran & Pendanaan' },
];

const STATUS_TABS = [
    { value: '', label: 'Semua', icon: Filter, color: 'var(--text-main)' },
    { value: 'baru', label: 'Baru', icon: AlertTriangle, color: '#ef4444' },
    { value: 'dibaca', label: 'Dibaca', icon: Eye, color: '#3b82f6' },
    { value: 'dikerjakan', label: 'Dikerjakan', icon: Clock, color: '#f59e0b' },
    { value: 'selesai', label: 'Selesai', icon: CheckCircle2, color: '#22c55e' },
];

export default function InstructionLogPage() {
    const { isPimpinan, isOperator } = usePermission();
    const [filterModule, setFilterModule] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const params = {};
    if (filterModule) params.target_module = filterModule;
    if (filterStatus) params.status = filterStatus;

    const { data: instructions = [], isLoading } = useInstructions(params);

    // Statistik
    const stats = {
        total: instructions.length,
        baru: instructions.filter(i => i.status === 'baru').length,
        dikerjakan: instructions.filter(i => i.status === 'dikerjakan').length,
        selesai: instructions.filter(i => i.status === 'selesai').length,
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={22} /> Log Instruksi Pimpinan
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Riwayat lengkap semua instruksi yang diberikan oleh Pimpinan beserta status dan responnya.
                </p>
            </div>

            {/* Statistik Ringkas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total', value: stats.total, color: 'var(--accent-primary)', bg: 'var(--bg-secondary)' },
                    { label: 'Baru', value: stats.baru, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Dikerjakan', value: stats.dikerjakan, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Selesai', value: stats.selesai, color: '#22c55e', bg: '#f0fdf4' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '12px 16px', background: s.bg, borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${s.color}`,
                    }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="form-input" value={filterModule}
                    onChange={e => setFilterModule(e.target.value)}
                    style={{ maxWidth: 200, padding: '6px 10px', fontSize: '0.82rem' }}>
                    {MODULE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>

                <div style={{ display: 'flex', gap: 4 }}>
                    {STATUS_TABS.map(t => {
                        const Icon = t.icon;
                        const isActive = filterStatus === t.value;
                        return (
                            <button key={t.value}
                                className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
                                style={{ padding: '4px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => setFilterStatus(t.value)}>
                                <Icon size={12} /> {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Instruction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isLoading ? (
                    <>
                        <div className="skeleton" style={{ height: 100 }} />
                        <div className="skeleton" style={{ height: 100 }} />
                        <div className="skeleton" style={{ height: 100 }} />
                    </>
                ) : instructions.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)',
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    }}>
                        <MessageSquarePlus size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p style={{ fontSize: '0.92rem' }}>Tidak ada instruksi ditemukan.</p>
                        <p style={{ fontSize: '0.78rem' }}>Coba ubah filter atau tunggu instruksi baru dari Pimpinan.</p>
                    </div>
                ) : (
                    instructions.map(inst => (
                        <InstructionCard
                            key={inst.id}
                            inst={inst}
                            canRespond={isOperator && !isPimpinan}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
