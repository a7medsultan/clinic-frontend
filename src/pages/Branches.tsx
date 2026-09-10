import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { translations } from "../services/translations";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Edit3,
  Power,
} from "lucide-react";

interface Branch {
  id: number;
  tenant_id: number;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean | number;
  created_at: string;
}

export default function Branches() {
  const { lang } = useApp();
  const { token, user } = useAuth();
  const t = translations[lang];

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role_name === "admin";

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError("");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/branches`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        setBranches(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load branches.");
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [token]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownRow(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleToggleActive = async (branch: Branch) => {
    const currentStatus = branch.is_active === true || branch.is_active === 1;
    const nextStatus = !currentStatus;

    setBranches((prev) =>
      prev.map((b) => (b.id === branch.id ? { ...b, is_active: nextStatus } : b))
    );
    setUpdatingStatusId(branch.id);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/branches/${branch.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error();
    } catch {
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, is_active: currentStatus } : b))
      );
      setError(t.branches.statusToggleError);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormAddress(branch.address || "");
    setFormPhone(branch.phone || "");
    setFormError("");
    setIsModalOpen(true);
    setActiveDropdownRow(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(t.branches.nameRequired);
      return;
    }

    setSubmitting(true);
    setFormError("");
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      const payload = {
        name: formName.trim(),
        address: formAddress.trim() || null,
        phone: formPhone.trim() || null,
      };

      const url = editingBranch
        ? `${baseUrl}/api/branches/${editingBranch.id}`
        : `${baseUrl}/api/branches`;

      const response = await fetch(url, {
        method: editingBranch ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed");
      }

      const data = await response.json();
      if (editingBranch) {
        setBranches((prev) =>
          prev.map((b) => (b.id === editingBranch.id ? { ...b, ...payload, is_active: b.is_active } : b))
        );
      } else {
        setBranches((prev) => [
          { id: data.data.id, tenant_id: user?.tenant_id || 1, name: payload.name, address: payload.address, phone: payload.phone, is_active: 1, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      {
        id: "name",
        header: t.branches.branchName,
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div className="text-slate-900 dark:text-slate-100 font-bold text-base">
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: t.branches.branchAddress,
        cell: ({ row }) => (
          <span className="text-slate-600 dark:text-stone-400 text-sm">
            {row.original.address || "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: t.branches.branchPhone,
        cell: ({ row }) => (
          <span className="text-slate-600 dark:text-stone-400 text-sm">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: t.branches.status,
        cell: ({ row }) => {
          const isActive = row.original.is_active === true || row.original.is_active === 1;
          const isToggling = updatingStatusId === row.original.id;
          return isAdmin ? (
            <button
              onClick={() => handleToggleActive(row.original)}
              disabled={isToggling}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
              }`}
            >
              {isToggling ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Power size={12} />
              )}
              {isActive ? t.branches.active : t.branches.inactive}
            </button>
          ) : (
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            }`}>
              {isActive ? t.branches.active : t.branches.inactive}
            </span>
          );
        },
      },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownRow(
                        activeDropdownRow === String(row.original.id) ? null : String(row.original.id)
                      );
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <MoreVertical size={16} className="text-slate-400 dark:text-stone-500" />
                  </button>
                  {activeDropdownRow === String(row.original.id) && (
                    <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl shadow-xl py-1">
                      <button
                        onClick={() => openEditModal(row.original)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <Edit3 size={14} />
                        {t.actions.edit}
                      </button>
                    </div>
                  )}
                </div>
              ),
            } as ColumnDef<Branch>,
          ]
        : []),
    ],
    [lang, activeDropdownRow, updatingStatusId]
  );

  const table = useReactTable({
    data: branches,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.branches.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-1">
            {t.branches.subtitle}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-bee-yellow text-dark-hive font-bold text-sm rounded-xl hover:bg-honey-gold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            {t.branches.newBranch}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-stone-500"
        />
        <input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={t.branches.searchPlaceholder}
          className="w-full sm:w-96 pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-stone-900/40 border border-slate-200 dark:border-stone-800/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-bee-yellow/50 focus:border-bee-yellow transition-all"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={20} className="animate-spin text-bee-yellow" />
            <span className="text-sm text-slate-500 dark:text-stone-400">
              {t.branches.loadingRecords}
            </span>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400 dark:text-stone-500">
            <p className="text-sm font-medium">{t.branches.noRecords}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-slate-100 dark:border-stone-800/50"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 dark:hover:text-stone-200 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <ArrowUp size={12} />, desc: <ArrowDown size={12} /> }[
                            header.column.getIsSorted() as string
                          ] ?? (
                            <ArrowUpDown size={12} className="opacity-30" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-50 dark:border-stone-800/30 hover:bg-slate-50/50 dark:hover:bg-stone-800/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {branches.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-stone-800/50">
            <p className="text-xs text-slate-500 dark:text-stone-400">
              {t.branches.activeRegistryCount.replace(
                "{{count}}",
                String(table.getFilteredRowModel().rows.length)
              )}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronsLeft size={16} className="text-slate-600 dark:text-stone-400" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-slate-600 dark:text-stone-400" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-stone-300 px-2">
                {t.branches.page} {table.getState().pagination.pageIndex + 1}{" "}
                {t.branches.of} {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} className="text-slate-600 dark:text-stone-400" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronsRight size={16} className="text-slate-600 dark:text-stone-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingBranch
                ? t.branches.editBranch.replace("{{name}}", editingBranch.name)
                : t.branches.modalTitleCreate}
            </h2>

            {formError && (
              <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  {t.branches.branchName} *
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-bee-yellow/50 focus:border-bee-yellow"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  {t.branches.branchAddress}
                </label>
                <input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-bee-yellow/50 focus:border-bee-yellow"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  {t.branches.branchPhone}
                </label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-bee-yellow/50 focus:border-bee-yellow"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  {t.form.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold bg-bee-yellow text-dark-hive rounded-lg hover:bg-honey-gold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t.form.saving : t.form.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
