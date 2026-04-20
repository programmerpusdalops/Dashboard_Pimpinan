import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus, X, Send, CheckCircle2, Clock, Eye, AlertTriangle, MessageCircle, History } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import {
    useInstructions, useCreateInstruction,
    useUpdateInstructionStatus, useRespondInstruction,
} from '../../hooks/useInstructions';

const MODULE_OPTIONS = [
    { value: 'dasbor', label: 'Dasbor Utama' },
    { value: 'peta', label: 'Peta Risiko & Dampak' },
    { value: 'operasi', label: 'Pusat Pengendalian' },
    { value: 'logistik', label: 'Gudang & Logistik' },
    { value: 'pengungsi', label: 'Data Pengungsi' },
    { value: 'anggaran', label: 'Anggaran & Pendanaan' },
];

const PRIORITY_STYLES = {
    segera: { bg: '#fecaca', color: '#dc2626', label: '🔴 SEGERA' },
    penting: { bg: '#fef3c7', color: '#d97706', label: '🟡 PENTING' },
    biasa: { bg: '#dbeafe', color: '#2563eb', label: '🔵 BIASA' },
};

const STATUS_STYLES = {
    baru: { icon: AlertTriangle, color: '#ef4444', label: 'Baru' },
    dibaca: { icon: Eye, color: '#3b82f6', label: 'Dibaca' },
    dikerjakan: { icon: Clock, color: '#f59e0b', label: 'Dikerjakan' },
    selesai: { icon: CheckCircle2, color: '#22c55e', label: 'Selesai' },
};

// ── Form Instruksi Baru (Pimpinan) ───────────────────────────────
function CreateInstructionForm({ onClose }) {
    const [form, setForm] = useState({ target_module: 'operasi', instruction_text: '', priority: 'biasa' });
    const create = useCreateInstruction();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await create.mutateAsync(form);
        setForm({ target_module: 'operasi', instruction_text: '', priority: 'biasa' });
        onClose?.();
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tujuan Modul *</label>
                <select className="form-input" value={form.target_module}
                    onChange={e => setForm({ ...form, target_module: e.target.value })}>
                    {MODULE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Instruksi *</label>
                <textarea className="form-input" rows={3} value={form.instruction_text}
                    onChange={e => setForm({ ...form, instruction_text: e.target.value })}
                    placeholder="Tulis instruksi untuk operator..."
                    required style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Prioritas</label>
                <select className="form-input" value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="biasa">Biasa</option>
                    <option value="penting">Penting</option>
                    <option value="segera">Segera</option>
                </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Send size={14} /> {create.isPending ? 'Mengirim...' : 'Kirim Instruksi'}
            </button>
        </form>
    );
}

// ── Card Instruksi ───────────────────────────────────────────────
export function InstructionCard({ inst, canRespond }) {
    const [showRespond, setShowRespond] = useState(false);
    const [responseText, setResponseText] = useState('');
    const updateStatus = useUpdateInstructionStatus();
    const respond = useRespondInstruction();

    const prio = PRIORITY_STYLES[inst.priority] || PRIORITY_STYLES.biasa;
    const stat = STATUS_STYLES[inst.status] || STATUS_STYLES.baru;
    const StatusIcon = stat.icon;
    const moduleName = MODULE_OPTIONS.find(m => m.value === inst.target_module)?.label || inst.target_module;

    const handleRespond = async () => {
        if (!responseText.trim()) return;
        await respond.mutateAsync({ id: inst.id, response_text: responseText, status: 'dikerjakan' });
        setResponseText('');
        setShowRespond(false);
    };

    return (
        <div style={{
            padding: '10px 12px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${stat.color}`,
            fontSize: '0.82rem',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                    <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                        background: prio.bg, color: prio.color, fontSize: '0.68rem', fontWeight: 700,
                    }}>{prio.label}</span>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                        → {moduleName}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.70rem', color: stat.color }}>
                    <StatusIcon size={12} /> {stat.label}
                </div>
            </div>

            {/* Pengirim */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Dari: <b>{inst.sender?.name || '—'}</b> •{' '}
                {new Date(inst.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Isi instruksi */}
            <div style={{ color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 6 }}>
                {inst.instruction_text}
            </div>

            {/* Respon yang sudah ada */}
            {inst.response_text && (
                <div style={{
                    padding: '6px 8px', background: 'var(--bg-card)', borderRadius: 4,
                    fontSize: '0.76rem', marginBottom: 6, borderLeft: '2px solid var(--status-green)',
                }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                        Respon oleh {inst.responder?.name || '—'} •{' '}
                        {inst.responded_at ? new Date(inst.responded_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                    {inst.response_text}
                </div>
            )}

            {/* Aksi untuk operator/admin */}
            {canRespond && inst.status !== 'selesai' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {inst.status === 'baru' && (
                        <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                            onClick={() => updateStatus.mutate({ id: inst.id, status: 'dibaca' })}>
                            <Eye size={10} /> Tandai Dibaca
                        </button>
                    )}
                    <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                        onClick={() => setShowRespond(!showRespond)}>
                        <MessageCircle size={10} /> Balas
                    </button>
                    {inst.status !== 'selesai' && (
                        <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                            onClick={() => updateStatus.mutate({ id: inst.id, status: 'selesai' })}>
                            <CheckCircle2 size={10} /> Selesai
                        </button>
                    )}
                </div>
            )}

            {/* Form respon */}
            {showRespond && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <input className="form-input" placeholder="Tulis respon..." value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.76rem' }} />
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                        onClick={handleRespond} disabled={respond.isPending}>
                        <Send size={10} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Panel Utama (Floating) ───────────────────────────────────────
// Hanya menampilkan instruksi AKTIF (baru, dibaca, dikerjakan) — max 10 terbaru.
// Instruksi yang selesai hanya bisa dilihat di halaman Log Instruksi.
export default function InstructionPanel() {
    const { isPimpinan, isOperator } = usePermission();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('list'); // 'list' | 'create'

    // Ambil SEMUA instruksi (tanpa filter status) — filtering dilakukan di client
    const { data: allInstructions = [], isLoading } = useInstructions({});

    // Pisahkan: aktif vs selesai
    const activeInstructions = allInstructions.filter(i => i.status !== 'selesai');
    const recentDone = allInstructions.filter(i => i.status === 'selesai').slice(0, 3);
    const activeCount = activeInstructions.length;

    // Panel menampilkan: instruksi aktif + 3 selesai terbaru
    const displayList = [...activeInstructions.slice(0, 10)];
    if (recentDone.length > 0) displayList.push(...recentDone);

    // Hanya tampil untuk pimpinan, admin, operator, superadmin
    if (!isPimpinan && !isOperator) return null;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 'var(--z-popover)',
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary, #f97316))',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Instruksi Pimpinan"
            >
                {open ? <X size={22} /> : <MessageSquarePlus size={22} />}
                {activeCount > 0 && !open && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#ef4444', color: '#fff',
                        borderRadius: '50%', width: 20, height: 20,
                        fontSize: '0.65rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{activeCount}</span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: 86, right: 24, zIndex: 'var(--z-popover)',
                    width: 380, maxHeight: 'calc(100vh - 140px)',
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg, 12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {/* Panel Header */}
                    <div style={{
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary, #f97316))',
                        color: '#fff',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                            📋 Instruksi Pimpinan
                        </div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                            {isPimpinan ? 'Beri instruksi ke setiap unit' : `${activeCount} instruksi aktif`}
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                        <button
                            style={{
                                flex: 1, padding: '8px', fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                                background: tab === 'list' ? 'var(--bg-secondary)' : 'transparent',
                                color: tab === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)',
                                fontWeight: tab === 'list' ? 700 : 400,
                                borderBottom: tab === 'list' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            }}
                            onClick={() => setTab('list')}
                        >
                            Aktif ({activeCount})
                        </button>
                        {isPimpinan && (
                            <button
                                style={{
                                    flex: 1, padding: '8px', fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                                    background: tab === 'create' ? 'var(--bg-secondary)' : 'transparent',
                                    color: tab === 'create' ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    fontWeight: tab === 'create' ? 700 : 400,
                                    borderBottom: tab === 'create' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                }}
                                onClick={() => setTab('create')}
                            >
                                + Buat Baru
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                        {tab === 'create' && isPimpinan ? (
                            <CreateInstructionForm onClose={() => setTab('list')} />
                        ) : (
                            <>
                                {isLoading ? (
                                    <div className="skeleton" style={{ height: 120 }} />
                                ) : displayList.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.82rem' }}>
                                        Belum ada instruksi aktif.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {/* Instruksi aktif */}
                                        {activeInstructions.slice(0, 10).map(inst => (
                                            <InstructionCard
                                                key={inst.id}
                                                inst={inst}
                                                canRespond={isOperator && !isPimpinan}
                                            />
                                        ))}
                                        {activeInstructions.length > 10 && (
                                            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                +{activeInstructions.length - 10} instruksi lainnya...
                                            </p>
                                        )}

                                        {/* Separator + selesai terbaru */}
                                        {recentDone.length > 0 && (
                                            <>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    margin: '4px 0', fontSize: '0.68rem', color: 'var(--text-muted)',
                                                }}>
                                                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                                                    ✅ Selesai Terakhir
                                                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                                                </div>
                                                {recentDone.map(inst => (
                                                    <InstructionCard
                                                        key={inst.id}
                                                        inst={inst}
                                                        canRespond={false}
                                                        compact
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer — Link ke halaman log lengkap */}
                    <div style={{
                        padding: '8px 12px', borderTop: '1px solid var(--border-color)',
                        textAlign: 'center',
                    }}>
                        <button
                            className="btn btn-outline"
                            style={{ width: '100%', padding: '6px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            onClick={() => { navigate('/instruksi'); setOpen(false); }}
                        >
                            <History size={14} /> Lihat Semua Riwayat Instruksi
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
