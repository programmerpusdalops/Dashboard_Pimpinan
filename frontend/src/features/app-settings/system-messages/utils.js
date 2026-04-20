const toYyyyMmDd = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const filterAndSortNotifications = (notifications, search, sortDir) => {
  if (!Array.isArray(notifications)) return [];

  const query = (search || "").trim().toLowerCase();
  const filtered = query
    ? notifications.filter((n) => {
        const hay = [n?.title, n?.message, n?.type, n?.target_role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
    : notifications.slice();

  filtered.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortDir === "asc" ? ta - tb : tb - ta;
  });

  return filtered;
};

export const getBulkOptionsForDate = (notifications, selectedDate) => {
  const pool = (Array.isArray(notifications) ? notifications : []).filter(
    (n) => {
      if (!n?.createdAt) return false;
      return toYyyyMmDd(n.createdAt) === selectedDate;
    },
  );

  const roles = new Set();
  const types = new Set();
  const titles = new Set();

  pool.forEach((n) => {
    if (n?.target_role) roles.add(n.target_role);
    if (n?.type) types.add(n.type);
    if (n?.title) titles.add(n.title);
  });

  const toSortedArray = (set) =>
    Array.from(set).sort((a, b) => a.localeCompare(b));

  return {
    roles: toSortedArray(roles),
    types: toSortedArray(types),
    titles: toSortedArray(titles),
  };
};

