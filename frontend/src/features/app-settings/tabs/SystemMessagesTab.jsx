import { useMemo, useState } from "react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import useAppDateStore from "../../../store/useAppDateStore";
import {
  useBulkDeleteSystemNotifications,
  useDeleteSystemNotification,
  useSendSystemNotification,
  useSystemNotifications,
  useUpdateSystemNotification,
} from "../hooks/useAppSettings";
import BulkDeleteSystemMessagesModal from "../system-messages/BulkDeleteSystemMessagesModal";
import { ROLE_OPTIONS, TYPE_OPTIONS } from "../system-messages/constants";
import SystemMessageForm from "../system-messages/SystemMessageForm";
import SystemMessagesTable from "../system-messages/SystemMessagesTable";
import {
  filterAndSortNotifications,
  getBulkOptionsForDate,
} from "../system-messages/utils";

export default function SystemMessagesTab() {
  const { selectedDate, setSelectedDate } = useAppDateStore();
  const { mutate: sendNotification, isPending } = useSendSystemNotification();
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useSystemNotifications(80);
  const updateMutation = useUpdateSystemNotification();
  const deleteMutation = useDeleteSystemNotification();
  const bulkDeleteMutation = useBulkDeleteSystemNotifications();

  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTargetRoles, setBulkTargetRoles] = useState([]);
  const [bulkTypes, setBulkTypes] = useState([]);
  const [bulkTitles, setBulkTitles] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [type, setType] = useState("admin_update");
  const [sortDir, setSortDir] = useState("desc"); // desc=newest

  const list = useMemo(() => {
    return filterAndSortNotifications(notifications, search, sortDir);
  }, [notifications, search, sortDir]);

  const bulkOptions = useMemo(() => {
    return getBulkOptionsForDate(notifications, selectedDate);
  }, [notifications, selectedDate]);

  const toggleInList = (value, setter) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : prev.concat(value),
    );
  };

  const setAll = (items, setter, enabled) => {
    setter(enabled ? items.slice() : []);
  };

  const canBulkDelete =
    bulkTargetRoles.length || bulkTypes.length || bulkTitles.length;

  const openBulk = () => {
    setBulkTargetRoles([]);
    setBulkTypes([]);
    setBulkTitles([]);
    setBulkOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setMessage("");
    setTargetRole("all");
    setType("admin_update");
  };

  const startEdit = (n) => {
    setEditing(n);
    setTitle(n.title || "");
    setMessage(n.message || "");
    setTargetRole(n.target_role || "all");
    setType(n.type || "system");
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;

    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          payload: {
            title,
            message,
            target_role: targetRole,
            type,
          },
        },
        { onSuccess: resetForm },
      );
      return;
    }

    sendNotification(
      { title, message, target_role: targetRole, type },
      { onSuccess: resetForm },
    );
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <SystemMessageForm
          editing={editing}
          roleOptions={ROLE_OPTIONS}
          typeOptions={TYPE_OPTIONS}
          title={title}
          message={message}
          targetRole={targetRole}
          type={type}
          onChangeTitle={setTitle}
          onChangeMessage={setMessage}
          onChangeTargetRole={setTargetRole}
          onChangeType={setType}
          onSubmit={handleSend}
          onCancel={resetForm}
          isSending={isPending}
          isUpdating={updateMutation.isPending}
        />

        <SystemMessagesTable
          search={search}
          onChangeSearch={setSearch}
          sortDir={sortDir}
          onToggleSortDir={() =>
            setSortDir((v) => (v === "desc" ? "asc" : "desc"))
          }
          onRefetch={refetch}
          onOpenBulk={openBulk}
          isLoading={isLoading}
          notifications={list}
          onEdit={startEdit}
          onAskDelete={setConfirmDelete}
        />

        <ConfirmDialog
          open={!!confirmDelete}
          title="Hapus System Message"
          message="Yakin ingin menghapus pesan ini? Tindakan ini permanen."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          confirmVariant="danger"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (!confirmDelete) return;
            deleteMutation.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            });
          }}
        />

        <BulkDeleteSystemMessagesModal
          open={bulkOpen}
          selectedDate={selectedDate}
          onChangeDate={(value) => {
            setSelectedDate(value);
            setBulkTargetRoles([]);
            setBulkTypes([]);
            setBulkTitles([]);
          }}
          onClose={() => setBulkOpen(false)}
          options={bulkOptions}
          bulkTargetRoles={bulkTargetRoles}
          bulkTypes={bulkTypes}
          bulkTitles={bulkTitles}
          canBulkDelete={canBulkDelete}
          onToggleRole={(r) => toggleInList(r, setBulkTargetRoles)}
          onToggleType={(t) => toggleInList(t, setBulkTypes)}
          onToggleTitle={(tt) => toggleInList(tt, setBulkTitles)}
          onToggleAllRoles={(enabled) =>
            setAll(bulkOptions.roles, setBulkTargetRoles, enabled)
          }
          onToggleAllTypes={(enabled) =>
            setAll(bulkOptions.types, setBulkTypes, enabled)
          }
          onToggleAllTitles={(enabled) =>
            setAll(bulkOptions.titles, setBulkTitles, enabled)
          }
          onConfirmDelete={() => {
            if (!canBulkDelete) return;
            bulkDeleteMutation.mutate(
              {
                target_roles: bulkTargetRoles,
                types: bulkTypes,
                titles: bulkTitles,
              },
              { onSuccess: () => setBulkOpen(false) },
            );
          }}
          isDeleting={bulkDeleteMutation.isPending}
        />
      </div>
    </div>
  );
}
