import { Send, MessageSquare } from "lucide-react";

export default function SystemMessageForm({
  editing,
  roleOptions,
  typeOptions,
  title,
  message,
  targetRole,
  type,
  onChangeTitle,
  onChangeMessage,
  onChangeTargetRole,
  onChangeType,
  onSubmit,
  onCancel,
  isSending,
  isUpdating,
}) {
  const canSubmit = !!title.trim() && !!message.trim();
  const busy = isSending || isUpdating;

  return (
    <div
      className="card"
      style={{
        margin: 0,
        animation: "fadeIn 0.3s ease",
        position: "sticky",
        top: 12,
        alignSelf: "start",
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto",
      }}
    >
      <div className="card-header">
        <div className="card-title text-blue">
          <MessageSquare size={16} />{" "}
          {editing ? "EDIT SYSTEM MESSAGE" : "BROADCAST SYSTEM MESSAGE"}
        </div>
      </div>
      <div className="card-body" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Target Role
              </label>
              <select
                className="form-input"
                value={targetRole}
                onChange={(e) => onChangeTargetRole(e.target.value)}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Type
              </label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => onChangeType(e.target.value)}
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Judul
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Pemeliharaan Sistem, Fitur Baru, Peringatan..."
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Isi Pesan
            </label>
            <textarea
              className="form-input"
              style={{ width: "100%", minHeight: 120, resize: "vertical" }}
              placeholder="Detail isi pesan yang ingin disampaikan..."
              value={message}
              onChange={(e) => onChangeMessage(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={!canSubmit || busy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: !canSubmit || busy ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              {editing
                ? isUpdating
                  ? "Menyimpan..."
                  : "Simpan"
                : isSending
                  ? "Mengirim..."
                  : "Kirim Pesan"}
            </button>

            {editing && (
              <button className="btn btn-outline" onClick={onCancel}>
                Batal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
