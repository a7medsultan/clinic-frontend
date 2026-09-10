import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { translations } from "../services/translations";
import type { Settings as SettingsType } from "../types/settings";
import {
  Settings,
  Building2,
  Monitor,
  Bell,
  Save,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { lang } = useApp();
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const isAdmin = user?.role_name === "admin";

  const [formData, setFormData] = useState<Partial<SettingsType>>({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    date_format: "DD/MM/YYYY",
    time_format: "24h",
    default_view: "dashboard",
    email_notifications: 1,
    sms_notifications: 0,
    appointment_reminders: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/settings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error(t.settings.errLoad);
        const data = await response.json();
        if (data.data && Object.keys(data.data).length > 0) {
          setFormData(data.data);
        }
      } catch (err: any) {
        setError(err.message || t.settings.errLoad);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token, lang]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.settings.errSave);
      }

      showToast(
        lang === "en" ? t.settings.saveSuccess : t.settings.saveSuccessAr,
        "success",
      );
    } catch (err: any) {
      showToast(err.message || t.settings.errSave, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-stone-500">
        <Loader2 size={36} className="animate-spin text-honey-gold" />
        <span className="font-semibold text-sm">{t.settings.errLoad}</span>
      </div>
    );
  }

  const inputStyles =
    "w-full px-3 py-2.5 bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all";
  const selectStyles =
    "w-full px-3 py-2.5 bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all cursor-pointer";
  const labelStyles =
    "text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider";
  const cardStyles =
    "bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm p-6";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="text-honey-gold" size={24} />
            <span>{t.settings.title}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-0.5">
            {t.settings.subtitle}
          </p>
        </div>
        {!isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold">
            <Lock size={13} />
            <span>{t.settings.readOnlyNotice}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Clinic Information */}
      <div className={cardStyles}>
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-honey-gold" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings.clinicInfo}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.clinicName}</label>
            <input
              type="text"
              value={formData.clinic_name || ""}
              onChange={(e) => handleChange("clinic_name", e.target.value)}
              placeholder={t.settings.clinicNamePlaceholder}
              disabled={!isAdmin}
              className={inputStyles}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.clinicPhone}</label>
            <input
              type="text"
              value={formData.clinic_phone || ""}
              onChange={(e) => handleChange("clinic_phone", e.target.value)}
              placeholder={t.settings.clinicPhonePlaceholder}
              disabled={!isAdmin}
              className={inputStyles}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelStyles}>{t.settings.clinicAddress}</label>
            <input
              type="text"
              value={formData.clinic_address || ""}
              onChange={(e) => handleChange("clinic_address", e.target.value)}
              placeholder={t.settings.clinicAddressPlaceholder}
              disabled={!isAdmin}
              className={inputStyles}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.clinicEmail}</label>
            <input
              type="email"
              value={formData.clinic_email || ""}
              onChange={(e) => handleChange("clinic_email", e.target.value)}
              placeholder={t.settings.clinicEmailPlaceholder}
              disabled={!isAdmin}
              className={inputStyles}
            />
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className={cardStyles}>
        <div className="flex items-center gap-2 mb-5">
          <Monitor size={18} className="text-honey-gold" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings.displayPrefs}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.dateFormat}</label>
            <select
              value={formData.date_format || "DD/MM/YYYY"}
              onChange={(e) => handleChange("date_format", e.target.value)}
              disabled={!isAdmin}
              className={selectStyles}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.timeFormat}</label>
            <select
              value={formData.time_format || "24h"}
              onChange={(e) => handleChange("time_format", e.target.value)}
              disabled={!isAdmin}
              className={selectStyles}
            >
              <option value="24h">24h</option>
              <option value="12h">12h (AM/PM)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelStyles}>{t.settings.defaultView}</label>
            <select
              value={formData.default_view || "dashboard"}
              onChange={(e) => handleChange("default_view", e.target.value)}
              disabled={!isAdmin}
              className={selectStyles}
            >
              <option value="dashboard">{t.settings.viewDashboard}</option>
              <option value="patients">{t.settings.viewPatients}</option>
              <option value="appointments">{t.settings.viewAppointments}</option>
              <option value="doctors">{t.settings.viewDoctors}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className={cardStyles}>
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-honey-gold" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings.notifications}
          </h3>
        </div>
        <div className="space-y-4">
          {[
            {
              field: "email_notifications",
              label: t.settings.emailNotifications,
            },
            {
              field: "sms_notifications",
              label: t.settings.smsNotifications,
            },
            {
              field: "appointment_reminders",
              label: t.settings.appointmentReminders,
            },
          ].map(({ field, label }) => (
            <div
              key={field}
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-stone-800/60 last:border-0"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-stone-300">
                {label}
              </span>
              <button
                onClick={() =>
                  handleChange(field, formData[field as keyof SettingsType] ? 0 : 1)
                }
                disabled={!isAdmin}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData[field as keyof SettingsType]
                    ? "bg-honey-gold"
                    : "bg-slate-300 dark:bg-stone-600"
                } ${!isAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    formData[field as keyof SettingsType]
                      ? "translate-x-6 rtl:-translate-x-6"
                      : "translate-x-1 rtl:translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-bee-yellow hover:bg-honey-gold text-dark-hive font-bold rounded-xl shadow-sm transition-all cursor-pointer text-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{t.settings.saveSettings}</span>
          </button>
        </div>
      )}
    </div>
  );
}
