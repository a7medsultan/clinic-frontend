import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { translations } from "../services/translations";
import IntakeModal from "../components/IntakeModal";
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
  UserPlus,
  Phone,
  ClipboardList,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";
import type { Patient } from "../types/patients";
import PatientProfile from "./PatientProfile";
import DeleteModal from '../components/DeleteModal';

export default function Patients() {
  const { lang } = useApp();
  const { token } = useAuth();
  const t = translations[lang];

  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  // 1. TANSTACK TABLE HOOK STATE MANAGERS
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(
    null,
  );

  // 2. LIVE ASYNC API HYDRATION PIPELINE
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError("");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/patients`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok)
          throw new Error(`Server dropped connection: ${response.status}`);
        const data = await response.json();
        setPatients(data);
      } catch (err: any) {
        setError(err.message || "Failed to sync with clinical server gateway.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [token, refreshTrigger]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownRow(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const triggerDataReset = () => setRefreshTrigger((prev) => prev + 1);

  const computeAge = (dobString: string) => {
    const birthday = new Date(dobString);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // 3. DECLARE TANSTACK COLUMNS MAPPING (MATCHING BACKEND DATA SCHEMAS)
  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "patient_number",
        header: t.patients.thMRN,
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-slate-400 dark:text-stone-500 group-hover:text-honey-gold transition-colors">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        id: "fullName",
        header: t.patients.thName,
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        cell: ({ row }) => (
          <div>
            <div className="text-slate-900 dark:text-slate-100 font-bold text-base">
              {row.original.first_name} {row.original.last_name}
            </div>
            <div className="text-xs text-slate-400 dark:text-stone-500 font-semibold mt-0.5 uppercase">
              {lang === "en"
                ? row.original.gender
                : row.original.gender === "male"
                  ? "ذكر"
                  : "أنثى"}{" "}
              • Age {computeAge(row.original.dob)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: t.patients.thContact,
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-stone-300">
              <Phone size={13} className="text-slate-400" />
              <span>{row.original.phone}</span>
            </div>
            <div className="text-xs text-slate-400 dark:text-stone-500 mt-0.5 truncate max-w-[180px]">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "national_id",
        header: t.patients.thEmiratesId,
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-stone-400 font-semibold">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>{info.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "allergies",
        header: t.patients.thClinicalAlerts,
        cell: (info) => {
          const value = info.getValue<string | null>();
          const hasAllergies =
            value &&
            value.trim() !== "" &&
            value.toLowerCase() !== "no known allergies";
          return hasAllergies ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wide">
              ⚠️ {value}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-stone-800 text-slate-400 dark:text-stone-500">
              {t.patients.clearAlert}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const isDropdownOpen = activeDropdownRow === row.id;

          return (
            <div
              className="relative flex justify-end px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  setActiveDropdownRow(isDropdownOpen ? null : row.id)
                }
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 rounded-lg transition-all cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-30 w-48 bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-xl shadow-xl py-1.5 animate-fade-in font-sans ${
                    lang === "ar"
                      ? "left-0 origin-top-left"
                      : "right-0 origin-top-right"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedPatientId(row.original.id);
                      setActiveDropdownRow(null);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/60 transition-colors flex items-center gap-2 text-left rtl:text-right cursor-pointer"
                  >
                    <Eye size={14} className="text-slate-400" />
                    <span>{translations[lang].actions.viewProfile}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingPatient(row.original);
                      setIsModalOpen(true);
                      setActiveDropdownRow(null);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/60 transition-colors flex items-center gap-2 text-left rtl:text-right cursor-pointer"
                  >
                    <Edit3 size={14} className="text-slate-400" />
                    <span>{translations[lang].actions.editDetails}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-stone-800/60" />

                  <button
                    onClick={() => {
                      setDeletingPatient(row.original);
                      setIsDeleteModalOpen(true);
                      setActiveDropdownRow(null);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2 text-left rtl:text-right cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{translations[lang].actions.deactivate}</span>
                  </button>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [lang, t, activeDropdownRow],
  );

  const table = useReactTable({
    data: patients,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  if (selectedPatientId !== null) {
    return (
      <PatientProfile
        patientId={selectedPatientId}
        onBack={() => setSelectedPatientId(null)}
      />
    );
  } else {
    return (
      <div className="space-y-6">
        {/* COMPONENT HEADER CORE ACTION BLOCK */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-dark-hive dark:text-white tracking-tight">
              {t.patients.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-stone-400 mt-0.5">
              {loading
                ? t.patients.refreshingCache
                : t.patients.activeRegistryCount.replace('{{count}}', patients.length.toString())}
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPatient(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bee-yellow hover:bg-honey-gold text-dark-hive font-bold rounded-xl shadow-sm transition-all cursor-pointer text-sm font-sans"
          >
            <UserPlus size={16} />
            <span>{t.patients.intakeNewPatient}</span>
          </button>
        </div>

        {/* CONTROL FILTER DECK */}
        <div className="p-4 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-xl shadow-sm">
          <div className="relative flex items-center">
            <Search
              size={18}
              className="absolute left-3 rtl:right-3 rtl:left-auto text-slate-400"
            />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={t.patients.searchPlaceholder}
              className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-slate-50 dark:bg-dark-hive/40 text-sm border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-semibold">
            {error}
          </div>
        )}

        {/* DATA TABLE WRAPPER ELEMENT */}
        <div className="w-full bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-xl shadow-sm overflow-visible min-h-[280px]">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="bg-slate-50/70 dark:bg-stone-900/80 border-b border-slate-100 dark:border-stone-800/80"
                  >
                    {headerGroup.headers.map((header) => {
                      const isSortable = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          className={`py-3.5 px-6 text-xs font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider ${isSortable ? "cursor-pointer select-none hover:text-dark-hive dark:hover:text-white" : ""}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1.5">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {isSortable && (
                              <span className="text-slate-400 dark:text-stone-600">
                                {sortDirection === "asc" ? (
                                  <ArrowUp
                                    size={13}
                                    className="text-honey-gold"
                                  />
                                ) : sortDirection === "desc" ? (
                                  <ArrowDown
                                    size={13}
                                    className="text-honey-gold"
                                  />
                                ) : (
                                  <ArrowUpDown
                                    size={13}
                                    className="opacity-40 group-hover:opacity-100"
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-stone-800/40 text-sm font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-stone-500">
                        <Loader2
                          size={32}
                          className="animate-spin text-honey-gold"
                        />
                        <span className="font-semibold text-sm">
                          {t.patients.loadingRecords}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-stone-900/20 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-4 px-6 text-slate-700 dark:text-stone-300"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-sm text-slate-400 dark:text-stone-500 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ClipboardList
                          size={32}
                          className="text-slate-300 dark:text-stone-700"
                        />
                        <span>{t.patients.noRecords}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && table.getPageCount() > 0 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-stone-900/30 border-t border-slate-100 dark:border-stone-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-bold text-slate-500 dark:text-stone-400 font-sans">
              <div className="flex items-center gap-2">
                <span>{t.patients.page}</span>
                <span className="text-dark-hive dark:text-white font-black">
                  {table.getState().pagination.pageIndex + 1}
                </span>
                <span>{t.patients.of}</span>
                <span className="text-dark-hive dark:text-white font-black">
                  {table.getPageCount()}
                </span>
                <span className="ml-1 text-slate-400">
                  ({table.getFilteredRowModel().rows.length} {t.patients.recordsTotal})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-slate-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-slate-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-lg border border-slate-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-lg border border-slate-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <IntakeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPatient(null);
          }}
          onSuccess={triggerDataReset}
          patient={editingPatient}
        />

        {/* DYNAMIC REUSABLE DELETE MODAL */}
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingPatient(null);
          }}
          onSuccess={triggerDataReset}
          id={deletingPatient?.id}
          endpoint="patients"
          displayName={deletingPatient ? `${deletingPatient.first_name} ${deletingPatient.last_name}` : ""}
          displaySubtitle={deletingPatient ? `MRN: ${deletingPatient.patient_number}` : undefined}
          successMessageEn={deletingPatient ? `Patient profile for "${deletingPatient.first_name} ${deletingPatient.last_name}" has been successfully archived.` : undefined}
          successMessageAr={deletingPatient ? `تم أرشفة ملف المريض "${deletingPatient.first_name} ${deletingPatient.last_name}" بنجاح.` : undefined}
        />
      </div>
    );
  }
}