"use client";

import { useEffect, useMemo, useState } from "react";
import type { SummaryCard, UserProfile, UserStatus } from "@/components/main/users-management-types";
async function fetchUsers(signal?: AbortSignal) {
  const response = await fetch("/api/users", { signal });
  if (!response.ok) {
    throw new Error("Failed to load users");
  }
  return (await response.json()) as { users: UserProfile[] };
}

async function updateUserAction(id: string, action: "block" | "unblock" | "resetPassword") {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  const data = (await response.json()) as { user: UserProfile };
  return data.user;
}

const pageSize = 5;

export function useUsersManagement(initialData: { users: UserProfile[]; summaryCards: SummaryCard[] }) {
  const [users, setUsers] = useState<UserProfile[]>(initialData.users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAllBookings, setShowAllBookings] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [currentPage, filteredUsers]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (currentPage <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (currentPage >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
    return items;
  }, [currentPage, totalPages]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const summaryCards = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
    const blockedUsers = users.filter((user) => user.status === "BLOCKED").length;
    return initialData.summaryCards.map((card) => {
      if (card.label === "TOTAL USERS") {
        return { ...card, value: totalUsers.toLocaleString() };
      }
      if (card.label === "ACTIVE USERS") {
        return { ...card, value: activeUsers.toLocaleString() };
      }
      if (card.label === "BLOCKED USERS") {
        return { ...card, value: blockedUsers.toLocaleString() };
      }
      return card;
    });
  }, [initialData.summaryCards, users]);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const data = await fetchUsers(controller.signal);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          return;
        }
      }
    };
    loadUsers();
    return () => controller.abort();
  }, []);

  const persistUserAction = async (id: string, action: "block" | "unblock" | "resetPassword") => {
    const applyLocalUpdate = (current: UserProfile) => {
      if (action === "block" || action === "unblock") {
        const nextStatus: UserStatus = action === "block" ? "BLOCKED" : "ACTIVE";
        const nextActions: UserProfile["actions"] = current.actions.map((actionItem) => {
          if (actionItem.label.toLowerCase().includes("block")) {
            const nextTone: UserProfile["actions"][number]["tone"] = nextStatus === "BLOCKED" ? "neutral" : "danger";
            return {
              ...actionItem,
              label: nextStatus === "BLOCKED" ? "Unblock Account" : "Block Account",
              tone: nextTone
            };
          }
          return actionItem;
        });
        return { ...current, status: nextStatus, actions: nextActions };
      }

      if (action === "resetPassword") {
        const nextActions: UserProfile["actions"] = current.actions.map((actionItem) => {
          if (actionItem.label.toLowerCase().includes("reset password")) {
            return { ...actionItem, label: "Password Reset Sent", tone: "neutral" as const };
          }
          return actionItem;
        });
        return { ...current, actions: nextActions };
      }

      return current;
    };

    setUsers((prev) => prev.map((user) => (user.id === id ? applyLocalUpdate(user) : user)));

    try {
      const updated = await updateUserAction(id, action);
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
    } catch {
      const controller = new AbortController();
      try {
        const data = await fetchUsers(controller.signal);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch {
        return;
      }
    }
  };

  const handleSetSelectedUserId = (value: string | null) => {
    setSelectedUserId(value);
    setShowAllBookings(false);
  };

  const handleSetQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleSetStatusFilter = (value: "ALL" | UserStatus) => {
    setStatusFilter(value);
    setPage(1);
  };

  return {
    users,
    filteredUsers,
    pagedUsers,
    summaryCards,
    selectedUser,
    query,
    statusFilter,
    filtersOpen,
    page: currentPage,
    totalPages,
    paginationItems,
    pageSize,
    showAllBookings,
    setSelectedUserId: handleSetSelectedUserId,
    setQuery: handleSetQuery,
    setStatusFilter: handleSetStatusFilter,
    setFiltersOpen,
    setPage,
    setShowAllBookings,
    persistUserAction
  };
}
