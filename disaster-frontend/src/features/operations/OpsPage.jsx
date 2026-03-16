import { useState } from 'react';
import { ListTodo, Loader2, CheckCircle2, Plus, X, Trash2, ClipboardList, RefreshCw } from 'lucide-react';
import {
    useTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask,
    useDecisions, useCreateDecision,
} from './hooks/useTasks';
import { usePermission } from '../../hooks/usePermission';

// ── Constants ────────────────────────────────────────────────────
const COLUMNS = [
    { key: 'todo', label: 'To Do', Icon: ListTodo, color: 'var(--text-secondary)' },
    { key: 'in_progress', label: 'On Going', Icon: Loader2, color: 'var(--accent-primary)' },
    { key: 'done', label: 'Selesai', Icon: CheckCircle2, color: 'var(--status-green)' },
];

const PRIORITY_COLORS = {
    critical: { bg: 'var(--status-red-bg)', color: 'var(--status-red)', label: 'KRITIS' },
    high: { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow)', label: 'TINGGI' },
    kritis: { bg: 'var(--status-red-bg)', color: 'var(--status-red)', label: 'KRITIS' },
    tinggi: { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow)', label: 'TINGGI' },
    medium: { bg: 'var(--status-blue-bg)', color: 'var(--status-blue)', label: 'SEDANG' },
    low: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', label: 'RENDAH' },
};

const NEXT = { todo: 'in_progress', in_progress: 'done' };
const PREV = { in_progress: 'todo', done: 'in_progress' };

const EMPTY_TASK = { title: '', priority: 'medium', assigned_to_opd: '', event_id: '', description: '' };
const EMPTY_DEC = { decision_text: '', decided_by: '', decided_at: new Date().toISOString().slice(0, 16) };

// ── Kanban Card ──────────────────────────────────────────────────
function TaskCard({ task, colKey, canEdit }) {
    const advance = useUpdateTaskStatus();
    const remove = useDeleteTask();
    const prio = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.low;

    return (
        <div className="k-card" style={{ borderTop: `2px solid ${prio.color}` }}>
            <span className="k-tag" style={{ background: prio.bg, color: prio.color, marginBottom: 6 }}>
                {prio.label}
            </span>
            <div className="k-title"
                style={colKey === 'done' ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                {task.title}
            </div>
            {task.description && (
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: 1.5 }}>
                    {task.description.substring(0, 80)}{task.description.length > 80 ? '…' : ''}
                </p>
            )}
            <div className="k-footer">
                <span style={{ fontSize: '0.72rem' }}>{task.assigned_to_opd ?? '—'}</span>
                {canEdit && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        {PREV[colKey] && (
                            <button className="btn btn-outline"
                                style={{ padding: '2px 7px', fontSize: '0.65rem' }}
                                onClick={() => advance.mutate({ id: task.id, status: PREV[colKey] })}
                                title="Kembalikan">← </button>
                        )}
                        {NEXT[colKey] && (
                            <button className="btn btn-primary"
                                style={{ padding: '2px 7px', fontSize: '0.65rem' }}
                                onClick={() => advance.mutate({ id: task.id, status: NEXT[colKey] })}
                                disabled={advance.isPending}>
                                {colKey === 'todo' ? 'Mulai →' : 'Selesai ✓'}
                            </button>
                        )}
                        <button className="btn btn-outline"
                            style={{ padding: '2px 7px', fontSize: '0.65rem', color: 'var(--status-red)', borderColor: 'var(--status-red)' }}
                            onClick={() => { if (confirm('Hapus task ini?')) remove.mutate(task.id); }}>
                            <Trash2 size={11} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────
export default function OpsPage() {
    const [activeTab, setActiveTab] = useState('kanban');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showDecForm, setShowDecForm] = useState(false);
    const [taskForm, setTaskForm] = useState(EMPTY_TASK);
    const [decForm, setDecForm] = useState(EMPTY_DEC);

    const { isOperator, isAdmin } = usePermission();

    const { data: tasks = [], isLoading: tLoading, refetch: refetchTasks } = useTasks();
    const { data: decisions = [], isLoading: dLoading, refetch: refetchDecs } = useDecisions();
    const createTask = useCreateTask();
    const createDec = useCreateDecision();

    const handleCreateTask = async (e) => {
        e.preventDefault();
        await createTask.mutateAsync({ ...taskForm, event_id: taskForm.event_id || undefined });
        setTaskForm(EMPTY_TASK);
        setShowTaskForm(false);
    };

    const handleCreateDec = async (e) => {
        e.preventDefault();
        await createDec.mutateAsync(decForm);
        setDecForm(EMPTY_DEC);
        setShowDecForm(false);
    };

    // Group tasks by column
    const byStatus = COLUMNS.reduce((acc, col) => {
        acc[col.key] = tasks.filter(t => t.status === col.key);
        return acc;
    }, {});

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                    className={`btn ${activeTab === 'kanban' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('kanban')}>
                    <ListTodo size={14} /> Kanban Tasks
                </button>
                <button
                    className={`btn ${activeTab === 'decisions' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('decisions')}>
                    <ClipboardList size={14} /> Log Keputusan
                </button>
            </div>

            {/* ── Kanban Board ── */}
            {activeTab === 'kanban' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {COLUMNS.map(c => (
                                <span key={c.key}>
                                    <span style={{ color: c.color, fontWeight: 700 }}>{byStatus[c.key]?.length ?? 0}</span>
                                    {' '}{c.label}
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                onClick={refetchTasks}>
                                <RefreshCw size={12} />
                            </button>
                            {isOperator && (
                                <button
                                    className={`btn ${showTaskForm ? 'btn-outline' : 'btn-primary'}`}
                                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                    onClick={() => setShowTaskForm(v => !v)}>
                                    {showTaskForm ? <X size={13} /> : <Plus size={13} />}
                                    {showTaskForm ? ' Tutup' : ' Tambah Task'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Task Form */}
                    {showTaskForm && (
                        <div className="card mb-2" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                            <form onSubmit={handleCreateTask}
                                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Judul Task *</label>
                                    <input className="form-input" value={taskForm.title}
                                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Prioritas</label>
                                    <select className="form-input" value={taskForm.priority}
                                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                        <option value="critical">Kritis</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">PIC OPD</label>
                                    <input className="form-input" value={taskForm.assigned_to_opd}
                                        onChange={e => setTaskForm({ ...taskForm, assigned_to_opd: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Event ID</label>
                                    <input className="form-input" type="number" value={taskForm.event_id}
                                        onChange={e => setTaskForm({ ...taskForm, event_id: e.target.value })}
                                        placeholder="Opsional" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary"
                                        disabled={createTask.isPending}>
                                        {createTask.isPending ? '...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Kanban columns */}
                    {tLoading ? (
                        <div className="kanban-board">
                            {COLUMNS.map(c => <div key={c.key} className="skeleton" style={{ height: 300 }} />)}
                        </div>
                    ) : (
                        <div className="kanban-board">
                            {COLUMNS.map(col => (
                                <div key={col.key} className="kanban-column">
                                    <div className="kanban-header">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: col.color }}>
                                            <col.Icon size={15} /> {col.label}
                                        </span>
                                        <span className="count">{byStatus[col.key].length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {byStatus[col.key].length === 0 && (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                                                Tidak ada task
                                            </p>
                                        )}
                                        {byStatus[col.key].map(t => (
                                            <TaskCard key={t.id} task={t} colKey={col.key} canEdit={isOperator} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Decision Log ── */}
            {activeTab === 'decisions' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        {isAdmin && (
                            <button
                                className={`btn ${showDecForm ? 'btn-outline' : 'btn-primary'}`}
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => setShowDecForm(v => !v)}>
                                {showDecForm ? <X size={13} /> : <Plus size={13} />}
                                {showDecForm ? ' Tutup' : ' Catat Keputusan'}
                            </button>
                        )}
                    </div>

                    {showDecForm && (
                        <div className="card mb-2" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                            <form onSubmit={handleCreateDec}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Keputusan *</label>
                                        <input className="form-input" value={decForm.decision_text}
                                            onChange={e => setDecForm({ ...decForm, decision_text: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Diputuskan Oleh</label>
                                        <input className="form-input" value={decForm.decided_by}
                                            onChange={e => setDecForm({ ...decForm, decided_by: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Tanggal</label>
                                        <input className="form-input" type="datetime-local" value={decForm.decided_at}
                                            onChange={e => setDecForm({ ...decForm, decided_at: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary"
                                            disabled={createDec.isPending}>
                                            {createDec.isPending ? '...' : 'Simpan'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title"><ClipboardList size={15} /> LOG KEPUTUSAN OPERASIONAL</div>
                            <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                onClick={refetchDecs}><RefreshCw size={12} /></button>
                        </div>
                        {dLoading ? (
                            <div className="skeleton" style={{ height: 200 }} />
                        ) : decisions.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                                Belum ada keputusan yang dicatat.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {decisions.map(d => (
                                    <div key={d.id} style={{
                                        padding: '12px 14px', background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)',
                                    }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 4 }}>
                                            {d.decided_by ?? '—'} •{' '}
                                            {d.decided_at
                                                ? new Date(d.decided_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </div>
                                        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                            {d.decision_text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
