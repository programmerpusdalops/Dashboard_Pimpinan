import Modal from "../../../components/common/Modal";

function CheckboxListCard({
  title,
  items,
  selectedItems,
  onToggleItem,
  onToggleAll,
  maxHeight = 260,
}) {
  const canToggleAll = items.length > 1;
  const allChecked = items.length > 0 && selectedItems.length === items.length;

  return (
    <div className="card" style={{ margin: 0 }}>
      <div
        className="card-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="card-title" style={{ fontSize: "0.85rem" }}>
          {title}
        </div>
        {canToggleAll && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => onToggleAll(e.target.checked)}
            />
            all
          </label>
        )}
      </div>

      <div
        className="card-body"
        style={{ padding: 12, maxHeight, overflowY: "auto" }}
      >
        {items.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            Kosong
          </div>
        ) : (
          items.map((item) => (
            <label
              key={item}
              style={{
                display: "flex",
                alignItems: title === "Title" ? "flex-start" : "center",
                gap: 8,
                padding: "6px 0",
              }}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => onToggleItem(item)}
                style={title === "Title" ? { marginTop: 2 } : undefined}
              />
              <span
                style={
                  title === "Title"
                    ? { fontSize: "0.82rem", lineHeight: 1.2 }
                    : { fontSize: "0.82rem" }
                }
              >
                {item}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default function BulkDeleteSystemMessagesModal({
  open,
  selectedDate,
  onChangeDate,
  onClose,
  options,
  bulkTargetRoles,
  bulkTypes,
  bulkTitles,
  canBulkDelete,
  onToggleRole,
  onToggleType,
  onToggleTitle,
  onToggleAllRoles,
  onToggleAllTypes,
  onToggleAllTitles,
  onConfirmDelete,
  isDeleting,
}) {
  return (
    <Modal
      open={open}
      title="Bulk Delete System Messages"
      onClose={onClose}
      showCloseButton={false}
      headerRight={
        <input
          type="date"
          className="form-input"
          value={selectedDate}
          onChange={(e) => onChangeDate(e.target.value)}
          title="Tanggal"
          style={{ width: 150, padding: "6px 10px", fontSize: "0.78rem" }}
        />
      }
      maxWidth={860}
      footer={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            {canBulkDelete
              ? "Siap untuk menghapus sesuai filter."
              : "Pilih minimal 1 kategori untuk menghapus."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              disabled={!canBulkDelete || isDeleting}
              onClick={onConfirmDelete}
              style={{ opacity: !canBulkDelete || isDeleting ? 0.6 : 1 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      }
    >
      <div className="bulk-delete-modal">
        <div
          style={{
            marginBottom: 10,
            color: "var(--text-muted)",
            fontSize: "0.78rem",
          }}
        >
          Menampilkan opsi berdasarkan data pada tanggal:{" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            {selectedDate}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <CheckboxListCard
            title="Target Role"
            items={options.roles}
            selectedItems={bulkTargetRoles}
            onToggleItem={onToggleRole}
            onToggleAll={onToggleAllRoles}
          />
          <CheckboxListCard
            title="Type"
            items={options.types}
            selectedItems={bulkTypes}
            onToggleItem={onToggleType}
            onToggleAll={onToggleAllTypes}
          />
          <CheckboxListCard
            title="Title"
            items={options.titles}
            selectedItems={bulkTitles}
            onToggleItem={onToggleTitle}
            onToggleAll={onToggleAllTitles}
          />
        </div>
      </div>
    </Modal>
  );
}

