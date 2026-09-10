import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { translations } from "../services/translations";
import { X, CalendarPlus, ShieldAlert, Loader2, Save, Building2 } from "lucide-react";
import BranchSelect from "./BranchSelect";
import type { Branch } from "../types/branches";

// Interfaces matching API response schemas
interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: number;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization?: string | null;
  phone?: string;
  is_active: number;
}

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: any | null;
  selectedDate?: string;
}

export default function AppointmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  selectedDate,
}: AppointmentFormModalProps) {
  const { lang } = useApp();
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const isEditMode = !!appointment;

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    status: "scheduled",
    branch_id: "",
  });

  // Dynamic dropdown state options
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  // Doctor availability (weekly slot grid) for the selected doctor + date
  const [availability, setAvailability] = useState<{
    configured: boolean;
    slots: string[] | null;
    booked: string[];
  } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
  const [availabilityError, setAvailabilityError] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Helper to format date strings for HTML <input type="date" />
  const formatDateForInput = (dateStr?: string, fallbackDate?: string) => {
    const target = dateStr || fallbackDate;
    if (!target) return new Date().toISOString().split("T")[0];
    return target.includes("T") ? target.split("T")[0] : target;
  };

  // Normalize "HH:MM:SS" from the API to "HH:MM" for slot matching.
  const normalizeTimeOut = (v?: string) => (v ? String(v).slice(0, 5) : "");

  // Fetch Patients & Doctors when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdownData = async () => {
      setLoadingOptions(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const [patientsRes, doctorsRes, branchesRes] = await Promise.all([
          fetch(`${baseUrl}/api/patients`, { headers }),
          fetch(`${baseUrl}/api/doctors`, { headers }),
          fetch(`${baseUrl}/api/branches/access`, { headers }),
        ]);

        if (!patientsRes.ok || !doctorsRes.ok || !branchesRes.ok) {
          throw new Error(t.appointments.errLoadDropdowns);
        }

        const patientsData = await patientsRes.json();
        const doctorsData = await doctorsRes.json();
        const branchesData = await branchesRes.json();

        setPatients(
          Array.isArray(patientsData) ? patientsData : patientsData.data || [],
        );
        setDoctors(
          Array.isArray(doctorsData) ? doctorsData : doctorsData.data || [],
        );
        setBranches(
          Array.isArray(branchesData) ? branchesData : branchesData.data || [],
        );
      } catch (err: any) {
        setError(err.message || t.appointments.errLoadDropdownsGeneric);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchDropdownData();
  }, [isOpen, token, lang]);

  // Fetch the selected doctor's availability for the picked date
  useEffect(() => {
    if (!isOpen) return;

    if (!formData.doctor_id || !formData.appointment_date || !formData.branch_id) {
      setAvailability(null);
      setAvailabilityLoading(false);
      setAvailabilityError("");
      return;
    }

    let cancelled = false;
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const res = await fetch(
          `${baseUrl}/api/doctors/${formData.doctor_id}/availability?date=${formData.appointment_date}&branch_id=${formData.branch_id}`,
          { headers },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.message || data.error || t.appointments.availabilityError,
          );
        }
        if (cancelled) return;
        setAvailability(data.data || data);
      } catch (err: any) {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(
            err.message || t.appointments.availabilityError,
          );
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.doctor_id, formData.appointment_date, formData.branch_id, token, lang]);

  // Hydrate form state parameters dynamically upon visibility changes
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // 1. Resolve Patient ID from any common key standard
        const resolvedPatientId =
          appointment.patient_id ??
          appointment.p_id ??
          appointment.patient_id_fk ??
          "";

        // 2. Resolve Doctor ID from any common key standard
        const resolvedDoctorId =
          appointment.doctor_id ??
          appointment.d_id ??
          appointment.doctor_id_fk ??
          "";

        setFormData({
          patient_id: resolvedPatientId ? String(resolvedPatientId) : "",
          doctor_id: resolvedDoctorId ? String(resolvedDoctorId) : "",
          appointment_date: formatDateForInput(
            appointment.appointment_date,
            selectedDate,
          ),
          appointment_time: normalizeTimeOut(appointment.appointment_time),
          notes: appointment.notes || "",
          status: appointment.status || "scheduled",
          branch_id: appointment.branch_id ? String(appointment.branch_id) : "",
        });
      } else {
        const defaultBranchId =
          currentUser?.branch_scope === "all"
            ? ""
            : currentUser?.branch_id
              ? String(currentUser.branch_id)
              : "";

        setFormData({
          patient_id: "",
          doctor_id: "",
          appointment_date: formatDateForInput(selectedDate),
          appointment_time: "",
          notes: "",
          status: "scheduled",
          branch_id: defaultBranchId,
        });
      }
      setError("");
    }
  }, [isOpen, appointment, selectedDate, currentUser?.branch_id, currentUser?.branch_scope]);

  if (!isOpen) return null;

  // Derived slot-grid state
  const isConfigured = availability?.configured === true;
  const slots = availability?.slots || [];
  const bookedTimes = (availability?.booked || []).filter((bt) => {
    if (isEditMode && appointment) {
      return bt !== normalizeTimeOut(appointment.appointment_time);
    }
    return true;
  });
  const showSlotGrid = !!formData.doctor_id && !!formData.appointment_date && isConfigured;

  const selectSlot = (time: string) => {
    setFormData((prev) => ({ ...prev, appointment_time: time }));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // In "All Branches" mode the branch must be explicitly chosen
    if (currentUser?.branch_scope === "all" && !formData.branch_id) {
      setError(t.appointments.branchRequired);
      setSubmitting(false);
      return;
    }

    // In slot-grid mode the chosen time must be one of the doctor's slots
    if (showSlotGrid && !slots.includes(formData.appointment_time)) {
      setError(t.appointments.selectSlotRequired);
      setSubmitting(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEditMode
        ? `${baseUrl}/api/appointments/${appointment.id}`
        : `${baseUrl}/api/appointments`;

      const method = isEditMode ? "PUT" : "POST";

      // Match payload schema strictly with controller endpoints
      const payload = isEditMode
        ? {
            patient_id: Number(formData.patient_id),
            doctor_id: Number(formData.doctor_id),
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            notes: formData.notes || null,
            status: formData.status,
            branch_id: formData.branch_id ? Number(formData.branch_id) : null,
          }
        : {
            patient_id: Number(formData.patient_id),
            doctor_id: Number(formData.doctor_id),
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            notes: formData.notes || null,
            branch_id: formData.branch_id ? Number(formData.branch_id) : null,
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
            data.error ||
            data.details ||
            t.appointments.errSaveAppointment,
        );
      }

      const createdData = data.data || data;

      // Display feedback notifications according to operation response
      showToast(
        isEditMode
          ? lang === "en"
            ? t.appointments.successEditMsg
            : t.appointments.successEditMsgAr
          : (lang === "en"
              ? t.appointments.bookingSuccessMsg
              : t.appointments.bookingSuccessMsgAr
            ).replace("{{queueNumber}}", String(createdData.queue_number)),
        "success",
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t.appointments.errNetworkExecution);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-hive/40 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* PANEL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-stone-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-honey-gold rounded-lg">
              {isEditMode ? <Save size={18} /> : <CalendarPlus size={18} />}
            </div>
            <h3 className="text-lg font-bold text-dark-hive dark:text-white tracking-tight">
              {isEditMode
                ? t.appointments.modalTitleEdit
                : t.appointments.modalTitleNew}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* REGISTRATION CORE CONTROLS DESIGN */}
        <form
          id="appointmentModalForm"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Profile and Doctor Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PATIENTS SELECT */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.appointments.selectPatientLabel}
              </label>
              <select
                name="patient_id"
                required
                disabled={loadingOptions}
                value={formData.patient_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all disabled:opacity-50"
              >
                <option value="">
                  {loadingOptions
                    ? t.appointments.loadingPatients
                    : t.appointments.choosePatientPlaceholder}
                </option>
                {patients
                  .filter(
                    (p) =>
                      p.is_active === 1 || String(p.id) === formData.patient_id,
                  )
                  .map((p) => (
                    <option
                      key={p.id}
                      value={String(p.id)}
                      className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                    >
                      {p.first_name} {p.last_name} ({p.patient_number})
                    </option>
                  ))}
              </select>
            </div>

            {/* DOCTORS SELECT */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.appointments.assignedDoctorLabel}
              </label>
              <select
                name="doctor_id"
                required
                disabled={loadingOptions}
                value={formData.doctor_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all disabled:opacity-50"
              >
                <option value="">
                  {loadingOptions
                    ? t.appointments.loadingDoctors
                    : t.appointments.chooseDoctorPlaceholder}
                </option>
                {doctors
                  .filter(
                    (d) =>
                      d.is_active === 1 || String(d.id) === formData.doctor_id,
                  )
                  .map((d) => (
                    <option
                      key={d.id}
                      value={String(d.id)}
                      className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                    >
                      {t.appointments.drPrefix} {d.first_name} {d.last_name}{" "}
                      {d.specialization ? `[${d.specialization}]` : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Branch selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {t.appointments.branch}{" "}
              {currentUser?.branch_scope === "all" && (
                <span className="text-rose-500">*</span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <Building2 size={16} className="shrink-0 text-honey-gold" />
              <BranchSelect
                branches={branches}
                value={formData.branch_id}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Booking Metrics Clock Target and Status parameters Row block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.appointments.targetDateLabel}
              </label>
              <input
                type="date"
                name="appointment_date"
                required
                value={formData.appointment_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all text-center"
              />
            </div>

            {/* Workflow Status selector (Only relevant or modifiable in Edit Mode) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.appointments.workflowStatusLabel}
              </label>
              <select
                name="status"
                disabled={!isEditMode}
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all disabled:opacity-60"
              >
                <option
                  value="scheduled"
                  className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                >
                  {t.appointments.statusScheduled}
                </option>
                <option
                  value="completed"
                  className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                >
                  {t.appointments.statusCompleted}
                </option>
                <option
                  value="cancelled"
                  className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
                >
                  {t.appointments.statusCancelled}
                </option>
              </select>
            </div>
          </div>

          {/* Time slot picker: slot grid for configured doctors, free-form otherwise */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {t.appointments.timeSlotLabel}
            </label>

            {formData.doctor_id && formData.appointment_date && availabilityLoading ? (
              <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-xs font-semibold text-slate-400 dark:text-stone-500">
                <Loader2 size={15} className="animate-spin" />
                <span>{t.appointments.slotsLoading}</span>
              </div>
            ) : availabilityError ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-rose-500">
                  {availabilityError}
                </p>
                <input
                  type="time"
                  name="appointment_time"
                  required
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all text-center"
                />
              </div>
            ) : showSlotGrid ? (
              slots.length === 0 ? (
                <p className="p-4 text-xs font-semibold text-slate-400 dark:text-stone-500 bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg">
                  {t.appointments.noSlotsToday}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    const isSelected = formData.appointment_time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => selectSlot(time)}
                        title={isBooked ? t.appointments.slotBooked : ""}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          isBooked
                            ? "opacity-40 cursor-not-allowed line-through bg-slate-50 dark:bg-dark-hive/30 border-slate-200 dark:border-stone-800 text-slate-400 dark:text-stone-600"
                            : isSelected
                              ? "bg-bee-yellow border-honey-gold text-dark-hive shadow-sm"
                              : "bg-slate-50 dark:bg-dark-hive/30 border-slate-200 dark:border-stone-800 text-slate-600 dark:text-stone-300 hover:border-honey-gold hover:text-honey-gold"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )
            ) : formData.branch_id ? (
              <div>
                <input
                  type="time"
                  name="appointment_time"
                  required
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all text-center"
                />
                {bookedTimes.includes(formData.appointment_time) && (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-500">
                    {t.appointments.slotBooked}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-stone-500">
                  {t.appointments.freeFormHint}
                </p>
              </div>
            ) : (
              <p className="p-4 text-xs font-semibold text-slate-400 dark:text-stone-500 bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg">
                {t.appointments.selectBranchHint}
              </p>
            )}
          </div>

          {/* Clinical Session Notes textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {t.appointments.notesLabel}
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder={t.appointments.notesPlaceholder}
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all resize-none"
            />
          </div>
        </form>

        {/* SUBMIT ACTIONS FOOTER */}
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
            form="appointmentModalForm"
            disabled={submitting || loadingOptions}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-bee-yellow hover:bg-honey-gold disabled:bg-bee-yellow/50 text-dark-hive font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.form.saving}</span>
              </>
            ) : (
              <span>
                {isEditMode
                  ? t.users.saveChanges
                  : t.form.save}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}