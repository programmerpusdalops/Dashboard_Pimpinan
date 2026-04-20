import { ArrowUpDown, MessageSquare, Pencil, RefreshCw, Trash, Trash2 } from "lucide-react";

export default function SystemMessagesTable({
  search,
  onChangeSearch,
  sortDir,
  onToggleSortDir,
  onRefetch,
  onOpenBulk,
  isLoading,
  notifications,
  onEdit,
  onAskDelete,
}) {
  return (
    <div className="card" style={{ margin: 0, animation: "fadeIn 0.3s ease" }}>
      <div
        className="card-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div className="card-title text-blue" style={{ whiteSpace: "nowrap" }}>
          <MessageSquare size={16} /> DAFTAR SYSTEM MESSAGES
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            overflowX: "auto",
          }}
        >
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search (title/type/role/message)..."
            style={{ width: 220, padding: "6px 10px", fontSize: "0.78rem" }}
          />
          <button
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            onClick={onToggleSortDir}
            title={sortDir === "desc" ? "Urutkan: Terbaru" : "Urutkan: Terlama"}
          >
            <ArrowUpDown size={13} />
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            onClick={onRefetch}
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <button
            className="btn btn-outline"
            style={{
              padding: "6px 12px",
              fontSize: "0.78rem",
              borderColor: "rgba(239,68,68,0.35)",
              color: "var(--status-red)",
            }}
            onClick={onOpenBulk}
            title="Bulk delete"
          >
            <Trash size={13} />
          </button>
        </div>
      </div>

      <div
        className="card-body"
        style={{
          padding: 12,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        }}
      >
        {isLoading ? (
          <div className="skeleton" style={{ height: 240 }} />
        ) : (
          <table className="data-table sticky-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Created</th>
                <th>Role</th>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th style={{ width: 120, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.78rem",
                    }}
                  >
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td>{n.target_role || "all"}</td>
                  <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>
                    {n.type}
                  </td>
                  <td style={{ fontWeight: 700 }}>{n.title}</td>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.82rem",
                      maxWidth: 380,
                      whiteSpace: "normal",
                      lineHeight: 1.35,
                    }}
                  >
                    {n.message}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <button
                        className="btn btn-outline"
                        title="Edit"
                        onClick={() => onEdit(n)}
                        style={{ padding: "4px 8px" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-outline"
                        title="Hapus"
                        onClick={() => onAskDelete(n)}
                        style={{
                          padding: "4px 8px",
                          borderColor: "rgba(239,68,68,0.35)",
                          color: "var(--status-red)",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {notifications.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 14,
                      color: "var(--text-muted)",
                    }}
                  >
                    Belum ada system message.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

