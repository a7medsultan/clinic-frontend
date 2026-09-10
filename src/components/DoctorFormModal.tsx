import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { translations } from "../services/translations";
import { X, ShieldAlert, Loader2, Save, Stethoscope, Building2, Trash2 } from "lucide-react";
import type { Doctor, DoctorAvailabilityRow } from "../types/doctors";
import type { Branch } from "../types/branches";

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor?: Doctor | null;
  branches: Branch[];
}

export default function DoctorFormModal({
  isOpen,
  onClose,
  onSuccess,
  doctor,
  branches,
}: DoctorFormModalProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const isEditMode = !!doctor;

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    specialization: "",
    is_active: 1,
  });

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<DoctorAvailabilityRow[]>([]);
  const [scheduleEnabledBranches, setScheduleEnabledBranches] = useState<Record<number, boolean>>({});
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (doctor) {
        setFormData({
          first_name: doctor.first_name || "",
          last_name: doctor.last_name || "",
          phone: doctor.phone ? String(doctor.phone) : "",
          specialization: doctor.specialization || "",
          is_active:
            String(doctor.is_active) === "true" ||
            String(doctor.is_active) === "1"
              ? 1
              : 0,
        });
        setSelectedBranches(doctor.branch_ids || []);
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          specialization: "",
          is_active: 1,
        });
        setSelectedBranches([]);
      }
      // Schedule hydrates from the detail fetch below; reset until it lands
      setScheduleEnabledBranches({});
      setSchedule([]);
      setError("");
    }
  }, [isOpen, doctor]);

  // The list row only carries has_schedule, so in edit mode fetch the full
  // doctor record to hydrate the weekly schedule editor.
  useEffect(() => {
    if (!isOpen || !doctor) return;
    let cancelled = false;

    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const res = await fetch(`${baseUrl}/api/doctors/${doctor.id}`, { headers });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to load doctor details.");
        }
        const detail = Array.isArray(data) ? data[0] : data.data || data;
        if (cancelled) return;
        const rows: DoctorAvailabilityRow[] = Array.isArray(detail.schedule)
          ? detail.schedule
          : [];
        const enabledMap: Record<number, boolean> = {};
        for (const r of rows) enabledMap[r.branch_id] = true;
        setSchedule(rows);
        setScheduleEnabledBranches(enabledMap);
      } catch {
        if (!cancelled) {
          setSchedule([]);
          setScheduleEnabledBranches({});
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [isOpen, doctor, token]);

  if (!isOpen) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "is_active" ? Number(value) : value,
    });
  };

  const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

  const dayName = (dow: number) => {
    const map: Record<number, string> = {
      1: t.doctors.daySunday,
      2: t.doctors.dayMonday,
      3: t.doctors.dayTuesday,
      4: t.doctors.dayWednesday,
      5: t.doctors.dayThursday,
      6: t.doctors.dayFriday,
      7: t.doctors.daySaturday,
    };
    return map[dow] || String(dow);
  };

  const updateScheduleRow = (index: number, patch: Partial<DoctorAvailabilityRow>) => {
    setSchedule((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeScheduleRow = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleBranchSchedule = (branchId: number) => {
    const wasEnabled = !!scheduleEnabledBranches[branchId];
    if (wasEnabled) {
      setSchedule((prev) => prev.filter((r) => r.branch_id !== branchId));
    }
    setScheduleEnabledBranches((prev) => ({ ...prev, [branchId]: !wasEnabled }));
  };

  const addScheduleRow = (branchId: number) => {
    const used = new Set(
      schedule.filter((r) => r.branch_id === branchId).map((r) => r.day_of_week),
    );
    const nextDay = DAY_OPTIONS.find((d) => !used.has(d));
    if (nextDay === undefined) return;
    setSchedule((prev) => [
      ...prev,
      { branch_id: branchId, day_of_week: nextDay, start_time: "09:00", end_time: "17:00", slot_duration: 30 },
    ]);
  };

  const validateForm = (): boolean => {
    // 1. First name validation (required)
    if (!formData.first_name.trim()) {
      setError(t.doctors.firstNameRequired);
      return false;
    }

    // 2. Last name validation (required)
    if (!formData.last_name.trim()) {
      setError(t.doctors.lastNameRequired);
      return false;
    }

    // 3. Phone validation (required, must be >= 10 digits)
    const phoneStr = String(formData.phone).replace(/\s/g, "");
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phoneStr)) {
      setError(t.doctors.phoneInvalid);
      return false;
    }

    // 4. Specialization validation (required)
    if (!formData.specialization.trim()) {
      setError(t.doctors.specializationRequired);
      return false;
    }

    // 5. Branch validation (at least one active branch required)
    if (selectedBranches.length === 0) {
      setError(t.doctors.branchRequired);
      return false;
    }

    // 6. Weekly schedule validation per enabled branch
    const enabledBranchIds = selectedBranches.filter(
      (b) => scheduleEnabledBranches[b],
    );
    for (const branchId of enabledBranchIds) {
      const rows = schedule.filter((r) => r.branch_id === branchId);
      if (rows.length === 0) {
        setError(t.doctors.scheduleDayRequired);
        return false;
      }
      const days = new Set(rows.map((r) => r.day_of_week));
      if (days.size !== rows.length) {
        setError(t.doctors.scheduleDayRequired);
        return false;
      }
      for (const row of rows) {
        if (!row.start_time || !row.end_time || row.end_time <= row.start_time) {
          setError(t.doctors.scheduleTimeRange);
          return false;
        }
        if (![15, 30, 45, 60].includes(Number(row.slot_duration))) {
          setError(t.doctors.scheduleDurationInvalid);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEditMode
        ? `${baseUrl}/api/doctors/${doctor!.id}`
        : `${baseUrl}/api/doctors`;

      const method = isEditMode ? "PUT" : "POST";

      // Convert phone to number for API
      const payload: any = { 
        ...formData,
        phone: Number(formData.phone),
        branch_ids: selectedBranches,
        schedule: schedule.filter(
          (r) =>
            selectedBranches.includes(r.branch_id) &&
            scheduleEnabledBranches[r.branch_id],
        ),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Database execution transaction validation breakdown.",
        );
      }

      showToast(
        isEditMode ? t.doctors.doctorUpdated : t.doctors.doctorCreated,
        "success",
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.message || "System fault executing network registration packet.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getFullName = () => {
    if (doctor) {
      return `${doctor.first_name} ${doctor.last_name}`;
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-hive/40 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER BAR PANEL */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-stone-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-honey-gold rounded-lg">
              {isEditMode ? <Save size={18} /> : <Stethoscope size={18} />}
            </div>
            <h3 className="text-lg font-bold text-dark-hive dark:text-white tracking-tight">
              {isEditMode
                ? t.doctors.editParameters.replace('{{fullName}}', getFullName())
                : t.doctors.modalTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* DATA FILL WORKSPACE */}
        <form
          id="doctorModalForm"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.doctors.firstName} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
                placeholder={lang === "en" ? "Enter first name" : "أدخل الاسم الأول"}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.doctors.lastName} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all ltr:text-left rtl:text-right"
                placeholder={lang === "en" ? "Enter last name" : "أدخل اسم العائلة"}
              />
            </div>
          </div>

          {/* Phone and Specialization block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.doctors.phone} <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all ltr:text-left rtl:text-right"
                placeholder={lang === "en" ? "Enter phone number" : "أدخل رقم الهاتف"}
              />
              <p className="mt-1 text-[10px] text-slate-400 dark:text-stone-500">
                {lang === "en" 
                  ? "Must be at least 10 digits" 
                  : "يجب أن يتكون من 10 أرقام على الأقل"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.doctors.specialization}
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all ltr:text-left rtl:text-right"
                placeholder={lang === "en" ? "Enter specialization" : "أدخل التخصص"}
              />
            </div>
          </div>

          {/* Status select block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.doctors.status}
              </label>
              <select
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              >
                <option
                  value={1}
                  className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                >
                  {t.doctors.active}
                </option>
                <option
                  value={0}
                  className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                >
                  {t.doctors.inactive}
                </option>
              </select>
            </div>
          </div>
        {/* Branch Assignments block */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {t.doctors.branches} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg">
              {branches.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-stone-500 col-span-2">
                  {t.doctors.selectBranchesHint}
                </p>
              )}
              {branches.map((b) => {
                const checked = selectedBranches.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all border ${
                      checked
                        ? "bg-bee-yellow/10 border-bee-yellow/30 text-honey-gold"
                        : "border-transparent text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedBranches((prev) =>
                          checked
                            ? prev.filter((id) => id !== b.id)
                            : [...prev, b.id],
                        )
                      }
                      className="accent-honey-gold h-4 w-4 cursor-pointer"
                    />
                    <Building2 size={14} className="shrink-0" />
                    <span className="truncate">{b.name}</span>
                  </label>
                );
              })}
            </div>
            {branches.length > 0 && (
              <p className="mt-1 text-[10px] text-slate-400 dark:text-stone-500">
                {t.doctors.selectBranchesHint}
              </p>
            )}
          </div>

          {/* Weekly Working Schedule block (per branch) */}
          <div className="border-t border-slate-100 dark:border-stone-800 pt-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
                {t.doctors.schedule}
              </span>
            </div>

            {selectedBranches.length === 0 ? (
              <p className="mt-2 text-[11px] text-slate-400 dark:text-stone-500">
                {t.doctors.branchRequired}
              </p>
            ) : loadingDetail ? (
              <p className="mt-3 text-xs text-slate-400 dark:text-stone-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {t.doctors.loadingRecords}
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-[11px] text-slate-400 dark:text-stone-500 mb-3">
                  {t.doctors.schedulePerBranchHint}
                </p>
                <div className="space-y-4">
                  {selectedBranches.map((branchId) => {
                    const branch = branches.find((b) => b.id === branchId);
                    const branchEnabled = !!scheduleEnabledBranches[branchId];
                    const branchRows = schedule.filter(
                      (r) => r.branch_id === branchId,
                    );
                    return (
                      <div
                        key={branchId}
                        className="border border-slate-200 dark:border-stone-800 rounded-lg p-3"
                      >
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-stone-300">
                            <Building2 size={14} className="shrink-0 text-honey-gold" />
                            <span className="truncate">
                              {branch ? branch.name : `#${branchId}`}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 dark:text-stone-500">
                              {t.doctors.scheduleBranchToggle}
                            </span>
                            <input
                              type="checkbox"
                              checked={branchEnabled}
                              onChange={() => toggleBranchSchedule(branchId)}
                              className="accent-honey-gold h-4 w-4 cursor-pointer"
                            />
                          </span>
                        </label>

                        {branchEnabled ? (
                          <div className="mt-3 space-y-2">
                            {branchRows.map((row) => {
                              const globalIndex = schedule.indexOf(row);
                              const usedDays = new Set(
                                branchRows
                                  .filter((r) => r !== row)
                                  .map((r) => r.day_of_week),
                              );
                              return (
                                <div
                                  key={globalIndex}
                                  className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 p-3 bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg items-end"
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mb-1">
                                      {t.doctors.scheduleDay}
                                    </label>
                                    <select
                                      value={row.day_of_week}
                                      onChange={(e) =>
                                        updateScheduleRow(globalIndex, {
                                          day_of_week: Number(e.target.value),
                                        })
                                      }
                                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-hive/40 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
                                    >
                                      {DAY_OPTIONS.map((d) => (
                                        <option
                                          key={d}
                                          value={d}
                                          disabled={usedDays.has(d)}
                                          className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                                        >
                                          {dayName(d)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mb-1">
                                      {t.doctors.scheduleStart}
                                    </label>
                                    <input
                                      type="time"
                                      value={row.start_time}
                                      onChange={(e) =>
                                        updateScheduleRow(globalIndex, {
                                          start_time: e.target.value,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-hive/40 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mb-1">
                                      {t.doctors.scheduleEnd}
                                    </label>
                                    <input
                                      type="time"
                                      value={row.end_time}
                                      onChange={(e) =>
                                        updateScheduleRow(globalIndex, {
                                          end_time: e.target.value,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-hive/40 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all text-center"
                                    />
                                  </div>
                                  <div className="flex items-end gap-1.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mb-1">
                                        {t.doctors.scheduleDuration}
                                      </label>
                                      <select
                                        value={row.slot_duration}
                                        onChange={(e) =>
                                          updateScheduleRow(globalIndex, {
                                            slot_duration: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-hive/40 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
                                      >
                                        {[15, 30, 45, 60].map((m) => (
                                          <option
                                            key={m}
                                            value={m}
                                            className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                                          >
                                            {m} min
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeScheduleRow(globalIndex)}
                                      title={t.doctors.scheduleRemoveDay}
                                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {branchRows.length < 7 && (
                              <button
                                type="button"
                                onClick={() => addScheduleRow(branchId)}
                                className="w-full px-3 py-2 text-xs font-bold text-honey-gold border border-dashed border-honey-gold/40 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                              >
                                + {t.doctors.scheduleAddDay}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-400 dark:text-stone-500">
                            {t.doctors.scheduleHint}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* MODAL CONTROLS FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-stone-800/80 bg-slate-50/50 dark:bg-stone-900/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-all cursor-pointer"
          >
            {t.form.cancel}
          </button>

          <button
            type="submit"
            form="doctorModalForm"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-bee-yellow hover:bg-honey-gold disabled:bg-bee-yellow/50 text-dark-hive font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.form.saving}</span>
              </>
            ) : (
              <span>
                {isEditMode ? t.doctors.saveChanges : t.form.save}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}