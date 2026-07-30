import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { translations } from "../services/translations";
import { 
  ArrowLeft, ArrowRight, Stethoscope, Phone, Mail, Award, 
  Calendar, Clock, ShieldAlert, Loader2, CheckCircle2, XCircle, Inbox, User
} from "lucide-react";

interface DoctorAppointment {
  id: number;
  queue_number: number | null;
  appointment_time: string;
  status: string;
  notes: string | null;
  patient: {
    id: number;
    patient_number: string;
    name: string;
    phone: string;
  };
}

interface Doctor {
  id: number;
  uuid: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  license_number: string;
  is_active: boolean;
  appointments?: DoctorAppointment[];
}

interface DoctorProfileProps {
  doctorId: number;
  onBack: () => void;
}

export default function DoctorProfile({ doctorId, onBack }: DoctorProfileProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const t = translations[lang];

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchDoctorProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/doctors/${doctorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`${t.doctorProfile.errLoadProfile} (Status: ${response.status})`);
      }
      
      const data = await response.json();
      setDoctor(data.data || data);
    } catch (err: any) {
      setError(err.message || t.doctorProfile.errLoadProfile);
    } finally {
      setLoading(false);
    }
  }, [doctorId, token, t]);

  useEffect(() => {
    fetchDoctorProfile();
  }, [fetchDoctorProfile]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-honey-gold" />
        <span className="font-bold text-sm">{t.doctorProfile.loadingProfile}</span>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center gap-2">
        <ShieldAlert size={18} className="shrink-0" />
        <span>{error || t.doctorProfile.errDoctorNotFound}</span>
      </div>
    );
  }

  const appointments = doctor.appointments || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* NAVIGATION ACTION BAR */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-dark-hive dark:hover:text-white transition-all cursor-pointer uppercase tracking-wider"
      >
        {lang === "ar" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
        <span>{t.doctorProfile.back}</span>
      </button>

      {/* DOCTOR HEADER BANNER */}
      <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-slate-50 dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl text-honey-gold">
            <Stethoscope size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-dark-hive dark:text-white tracking-tight">
                {doctor.name}
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                doctor.is_active 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                  : "bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400 border-slate-200 dark:border-stone-700"
              }`}>
                {doctor.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{doctor.is_active ? t.doctorProfile.active : t.doctorProfile.inactive}</span>
              </span>
            </div>
            <p className="text-sm font-semibold text-honey-gold dark:text-honey-gold/90 mt-1 uppercase tracking-wide">
              {doctor.specialization}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: DOCTOR INFO CARD */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-dark-hive dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-stone-800 pb-3">
              {t.doctorProfile.doctorDetails}
            </h3>

            <div className="space-y-3 text-sm font-medium">
              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.doctorProfile.specialization}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold">
                  <Stethoscope size={14} className="text-slate-400" />
                  <span>{doctor.specialization}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.doctorProfile.phone}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold">
                  <Phone size={14} className="text-slate-400" />
                  <span className="direction-ltr">{doctor.phone || "—"}</span>
                </div>
              </div>

              {/* <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.doctorProfile.email}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold truncate">
                  <Mail size={14} className="text-slate-400" />
                  <span>{doctor.email || "—"}</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: APPOINTMENTS FEED (2 Columns wide on LG) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-stone-800 pb-3 mb-4">
              <h3 className="text-sm font-black text-dark-hive dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-honey-gold" />
                <span>{t.doctorProfile.scheduledAppointments}</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300">
                {appointments.length}
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400 dark:text-stone-500">
                <Inbox size={36} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">{t.doctorProfile.noAppointments}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="p-4 bg-slate-50/60 dark:bg-stone-800/40 border border-slate-100 dark:border-stone-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/80 dark:hover:bg-stone-800 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="bg-dark-hive text-white font-mono font-black text-xs px-2.5 py-1.5 rounded-lg shrink-0 mt-0.5">
                        #{apt.queue_number ? String(apt.queue_number).padStart(2, "0") : "--"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <p className="font-bold text-sm text-slate-900 dark:text-stone-100">
                            {apt.patient?.name || "Unknown Patient"}
                          </p>
                          {apt.patient?.patient_number && (
                            <span className="text-[10px] font-mono font-semibold text-slate-400">
                              ({apt.patient.patient_number})
                            </span>
                          )}
                        </div>

                        {apt.notes && (
                          <p className="text-xs text-slate-500 dark:text-stone-400 mt-1 italic line-clamp-1">
                            "{apt.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-end gap-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/40 dark:border-stone-700/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-stone-300">
                        <Clock size={13} className="text-honey-gold" />
                        <span>{formatTime(apt.appointment_time)}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        {apt.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}