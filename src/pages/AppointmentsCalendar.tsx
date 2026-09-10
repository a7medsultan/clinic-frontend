import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAccessibleBranches } from "../hooks/useAccessibleBranches";
import { translations } from "../services/translations";
import {
  Calendar,
  Clock,
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
} from "lucide-react";
import DeleteModal from "../components/DeleteModal";
import AppointmentFormModal from "../components/AppointmentFormModal";
import AppointmentProfile from "./UserProfile";

interface Appointment {
  id: number;
  uuid: string;
  queue_number: number;
  appointment_time: string;
  status: "scheduled" | "completed" | "cancelled" | string;
  notes: string | null;
  patient_number: string;
  p_first: string;
  p_last: string;
  phone: string;
  d_first: string;
  d_last: string;
  specialization: string;
  branch_id: number | null;
  branch_name: string | null;
}

export default function AppointmentsCalendar() {
  const { lang } = useApp();
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { branches } = useAccessibleBranches();
  const t = translations[lang];

  // 1. DATE STATE MANAGEMENT FOR THE CALENDAR LOOKUP
  const [branchFilter, setBranchFilter] = useState<number | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingAppointment, setDeletingAppointment] =
    useState<Appointment | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [activeDropdownRow, setActiveDropdownRow] = useState<number | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const isFutureDate = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate > today;
  }, [selectedDate]);

  // Helper for status badge dynamic key mapping
  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case "scheduled":
        return t.appointments.statusScheduled;
      case "completed":
        return t.appointments.statusCompleted;
      case "cancelled":
        return t.appointments.statusCancelled;
      default:
        return status;
    }
  };

  // 2. LIVE APPOINTMENT PIPELINE EXTRACTOR
  useEffect(() => {
    const fetchLiveQueue = async () => {
      try {
        setLoading(true);
        setError("");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(
          `${baseUrl}/api/appointments/live-queue?date=${selectedDate}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.message ||
              errData.details ||
              errData.error ||
              `Server responded with ${response.status}`,
          );
        }

        const data = await response.json();
        setAppointments(data.data);
      } catch (err: any) {
        setError(err.message || t.appointments.errSyncGateway);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveQueue();
  }, [token, selectedDate, refreshTrigger, lang]);

  // Global click listener to close open context menus
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownRow(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const triggerDataReset = () => setRefreshTrigger((prev) => prev + 1);

  // Quick Date Cycler Controls
  const adjustDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  // 3. QUICK STATUS TOGGLE HANDLER
  const handleQuickStatusChange = async (id: number, newStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.appointments.errUpdateStatus);
      }

      const statusText = getTranslatedStatus(newStatus);
      showToast(
        t.appointments.statusChanged.replace("{{status}}", statusText),
        "success",
      );

      triggerDataReset();
    } catch (err: any) {
      showToast(err.message || t.appointments.errUpdateStatus, "error");
    } finally {
      setUpdatingStatusId(null);
      setActiveDropdownRow(null);
    }
  };

  // 4. INLINE TEXT FILTER MATCHES
  const filteredAppointments = useMemo(() => {
    const byBranch =
      branchFilter === "all"
        ? appointments
        : appointments.filter((apt) => apt.branch_id === branchFilter);

    if (!globalFilter.trim()) return byBranch;
    const cleanFilter = globalFilter.toLowerCase();
    return byBranch.filter(
      (apt) =>
        `${apt.p_first} ${apt.p_last}`.toLowerCase().includes(cleanFilter) ||
        `${apt.d_first} ${apt.d_last}`.toLowerCase().includes(cleanFilter) ||
        apt.patient_number.toLowerCase().includes(cleanFilter) ||
        (apt.phone && apt.phone.includes(cleanFilter)),
    );
  }, [appointments, globalFilter, branchFilter]);

  if (selectedAppointmentId !== null) {
    return (
      <AppointmentProfile
        userId={selectedAppointmentId}
        onBack={() => setSelectedAppointmentId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-honey-gold" size={24} />
            <span>{t.appointments.title}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-0.5">
            {loading
              ? t.appointments.updatingGrid
              : t.appointments.totalBookings.replace(
                  "{{count}}",
                  String(appointments.length),
                )}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAppointment(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-bee-yellow hover:bg-honey-gold text-dark-hive font-bold rounded-xl shadow-sm transition-all cursor-pointer text-sm"
        >
          <Plus size={16} />
          <span>{t.appointments.bookAppointment}</span>
        </button>
      </div>

      {/* CALENDAR CONTROLLER BAR & FILTERING SEARCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Date Cycler Card */}
        <div className="lg:col-span-1 flex items-center justify-between p-2.5 bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-xl shadow-sm">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 text-slate-600 dark:text-stone-400 hover:bg-slate-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={t.appointments.prevDay}
          >
            <ChevronLeft size={18} className="rtl:rotate-180" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 text-center cursor-pointer"
          />

          <button
            onClick={() => adjustDate(1)}
            className="p-2 text-slate-600 dark:text-stone-400 hover:bg-slate-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={t.appointments.nextDay}
          >
            <ChevronRight size={18} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Live Search Engine Input */}
        <div className="lg:col-span-2 relative flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 rtl:right-3.5 rtl:left-auto text-slate-400"
            />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={t.appointments.searchPlaceholder}
              className="w-full pl-11 pr-4 rtl:pr-11 rtl:pl-4 py-3 bg-white dark:bg-stone-900 text-sm border border-slate-200 dark:border-stone-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all shadow-sm"
            />
          </div>

          {user?.branch_scope === "all" && branches.length > 0 && (
            <div className="relative shrink-0">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto text-slate-400"
              />
              <select
                value={branchFilter}
                onChange={(e) =>
                  setBranchFilter(
                    e.target.value === "all"
                      ? "all"
                      : Number(e.target.value),
                  )
                }
                title={t.common.switchBranch}
                className="w-48 pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-3 text-sm bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all shadow-sm font-semibold cursor-pointer"
              >
                <option value="all" className="text-dark-hive dark:text-white bg-white dark:bg-stone-900">
                  {t.common.allBranches}
                </option>
                {branches.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* CHRONOLOGICAL CALENDAR TIMEBLOCKS GRID */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 dark:text-stone-500">
            <Loader2 size={36} className="animate-spin text-honey-gold" />
            <span className="font-semibold text-sm">
              {t.appointments.loadingSchedule}
            </span>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => {
              const isDropdownOpen = activeDropdownRow === apt.id;
              const isUpdatingThis = updatingStatusId === apt.id;

              return (
                <div
                  key={apt.id}
                  className="relative p-5 bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Card Upper Action Block */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Queue Token Badge & Time Anchor */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-slate-900 dark:bg-stone-800 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                          #{apt.queue_number}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-stone-400 flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" />
                          {apt.appointment_time.slice(0, 5)}
                        </span>
                      </div>

                      {/* Contextual Options Dropdown */}
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setActiveDropdownRow(isDropdownOpen ? null : apt.id)
                          }
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 rounded-lg hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-1 z-30 w-48 bg-white dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl shadow-xl py-1 animate-fade-in">
                            {/* <button
                              onClick={() => {
                                setSelectedAppointmentId(apt.id);
                                setActiveDropdownRow(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left rtl:text-right"
                            >
                              <Eye size={14} className="text-slate-400" />
                              <span>{t.actions.viewProfile}</span>
                            </button> */}

                            {apt.status !== "completed" && apt.status !== "cancelled" && (
                              <button
                                onClick={() => {
                                  setEditingAppointment(apt);
                                  setIsModalOpen(true);
                                  setActiveDropdownRow(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left rtl:text-right"
                              >
                                <Edit3 size={14} className="text-slate-400" />
                                <span>{t.appointments.reschedule}</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-slate-100 dark:border-stone-800" />

                            {/* Quick Status Modifiers */}
                            {apt.status !== "completed" && apt.status !== "cancelled" && !isFutureDate && (
                              <button
                                onClick={() =>
                                  handleQuickStatusChange(apt.id, "completed")
                                }
                                className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 text-left rtl:text-right"
                              >
                                <CheckCircle2 size={14} />
                                <span>{t.appointments.markCompleted}</span>
                              </button>
                            )}

                            {apt.status !== "cancelled" && apt.status !== "completed" && (
                              <button
                                onClick={() =>
                                  handleQuickStatusChange(apt.id, "cancelled")
                                }
                                className="w-full px-3.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-left rtl:text-right"
                              >
                                <XCircle size={14} />
                                <span>{t.appointments.markCancelled}</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-slate-100 dark:border-stone-800" />

                            <button
                              onClick={() => {
                                setDeletingAppointment(apt);
                                setIsDeleteModalOpen(true);
                                setActiveDropdownRow(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-left rtl:text-right"
                            >
                              <Trash2 size={14} />
                              <span>{t.appointments.deleteRecord}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient Core Visual Stack */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-honey-gold shrink-0" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                          {apt.p_first} {apt.p_last}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-slate-400 dark:text-stone-500 pl-5 rtl:pr-5 rtl:pl-0">
                        {t.patients.thMRN}: {apt.patient_number}{" "}
                        {apt.phone ? `• ${apt.phone}` : ""}
                      </p>
                      {apt.branch_name && (
                        <p className="text-xs font-medium text-slate-400 dark:text-stone-500 pl-5 rtl:pr-5 rtl:pl-0 flex items-center gap-1">
                          <Building2 size={13} className="text-honey-gold" />
                          {apt.branch_name}
                        </p>
                      )}
                    </div>

                    {/* Staff Assigned Sub-Plate */}
                    <div className="p-2.5 bg-slate-50 dark:bg-stone-900/60 rounded-xl border border-slate-100/60 dark:border-stone-800/40 flex items-start gap-2 text-xs">
                      <Stethoscope
                        size={15}
                        className="text-emerald-500 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-700 dark:text-stone-300">
                          {t.appointments.drPrefix} {apt.d_first} {apt.d_last}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-stone-500">
                          {apt.specialization}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Status Flag Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-stone-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isUpdatingThis ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-slate-400"
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            apt.status === "completed"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : apt.status === "cancelled"
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}
                        >
                          {getTranslatedStatus(apt.status)}
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <span className="text-[11px] italic text-slate-400 dark:text-stone-500 truncate max-w-[150px]">
                        "{apt.notes}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 border border-dashed border-slate-200 dark:border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <UsersIcon
              size={40}
              className="text-slate-300 dark:text-stone-700 mb-3"
            />
            <p className="text-sm font-bold text-slate-700 dark:text-stone-300">
              {t.appointments.noSessionsTitle}
            </p>
            <p className="text-xs text-slate-400 dark:text-stone-500 max-w-xs mt-1">
              {t.appointments.noSessionsDesc.replace(
                "{{date}}",
                selectedDate,
              )}
            </p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={triggerDataReset}
        appointment={editingAppointment}
        selectedDate={selectedDate}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAppointment(null);
        }}
        onSuccess={triggerDataReset}
        id={deletingAppointment?.id}
        endpoint="appointments"
        displayName={
          deletingAppointment
            ? `${deletingAppointment.p_first} ${deletingAppointment.p_last}`
            : ""
        }
        displaySubtitle={
          deletingAppointment
            ? `${t.appointments.queuePrefix} #${deletingAppointment.queue_number} • ${t.appointments.drPrefix} ${deletingAppointment.d_first} ${deletingAppointment.d_last}`
            : ""
        }
        successMessageEn={t.appointments.deleteSuccessEn}
        successMessageAr={t.appointments.deleteSuccessAr}
      />
    </div>
  );
}