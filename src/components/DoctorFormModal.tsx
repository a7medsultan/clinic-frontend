import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { translations } from "../services/translations";
import { X, ShieldAlert, Loader2, Save, Stethoscope } from "lucide-react";
import type { Doctor } from "../types/doctors";

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor?: Doctor | null;
}

export default function DoctorFormModal({
  isOpen,
  onClose,
  onSuccess,
  doctor,
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
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          specialization: "",
          is_active: 1,
        });
      }
      setError("");
    }
  }, [isOpen, doctor]);

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
        phone: Number(formData.phone)
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