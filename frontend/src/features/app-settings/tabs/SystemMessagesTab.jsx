import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useSendSystemNotification } from "../hooks/useAppSettings";

export default function SystemMessagesTab() {
  const { mutate: sendNotification, isPending } = useSendSystemNotification();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    sendNotification(
      { title, message, target_role: targetRole, type: "admin_update" },
      {
        onSuccess: () => {
          setTitle("");
          setMessage("");
          setTargetRole("all");
        },
      },
    );
  };

  return (
    <div className="card" style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="card-header">
        <div className="card-title text-blue">
          <MessageSquare size={16} /> BROADCAST SYSTEM MESSAGE
        </div>
      </div>
      <div className="card-body" style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 500,
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
              Tujuan / Target Role
            </label>
            <select
              className="form-input"
              style={{ width: "100%" }}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="all">Semua Pengguna</option>
              <option value="pimpinan">Pimpinan</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
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
              Judul Pesan
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: "100%" }}
              placeholder="Contoh: Pemeliharaan Sistem, Fitur Baru, Peringatan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              style={{ width: "100%", minHeight: 100, resize: "vertical" }}
              placeholder="Detail isi pesan yang ingin disampaikan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!title.trim() || !message.trim() || isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity:
                  !title.trim() || !message.trim() || isPending ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              {isPending ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
