import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { translations } from "../services/translations";
import { 
  Users, 
  Calendar, 
  Clock, 
  UserPlus, 
  CalendarPlus, 
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Inbox
} from "lucide-react";
import type { Patient } from "../types/patients";

// Import Modal Components
import IntakeModal from "../components/IntakeModal";
import AppointmentFormModal from "../components/AppointmentFormModal";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

interface DashboardData {
  metrics: {
    today_bookings: number;
    today_completed: number;
    live_queue: number;
    total_patients: number;
    active_doctors: number;
  };
  upcoming_queue: Array<{
    id: number;
    uuid: string;
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
    doctor: {
      id: number;
      name: string;
      specialization: string;
    };
  }>;
}

export default function Dashboard({ onNavigate = () => {} }: DashboardProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const t = translations[lang];

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Patient Intake Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Appointment Form Modal State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);

  // Fetch Dashboard Summary Data
  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/dashboard/summary`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.dashboard.errFetchMetrics);
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || t.dashboard.errNetworkMetrics);
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  // Helper to format 24h MySQL time (HH:MM:SS) to 12h format (HH:MM AM/PM)
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
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <Loader2 className="w-8 h-8 text-honey-gold animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-stone-400">
          {t.dashboard.loadingDashboard}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
        <ShieldAlert size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const metrics = data?.metrics;
  const queue = data?.upcoming_queue || [];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. KPI STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.todaysBookings}
          value={metrics ? String(metrics.today_bookings) : "0"}
          subtitle={`${metrics?.today_completed || 0} ${t.dashboard.completed}`}
          icon={<Calendar className="text-honey-gold" size={22} />}
        />
        <StatCard
          title={t.dashboard.liveQueue}
          value={metrics ? `${metrics.live_queue} ${t.dashboard.active}` : `0 ${t.dashboard.active}`}
          subtitle={t.dashboard.waitingInSession}
          icon={<Clock className="text-amber-500" size={22} />}
        />
        <StatCard
          title={t.dashboard.totalPatients}
          value={metrics ? metrics.total_patients.toLocaleString() : "0"}
          subtitle={t.dashboard.registeredInSystem}
          icon={<Users className="text-blue-500" size={22} />}
        />
        <StatCard
          title={t.dashboard.cliniciansActive}
          value={metrics ? `${metrics.active_doctors} ${t.dashboard.onDuty}` : `0 ${t.dashboard.onDuty}`}
          subtitle={t.dashboard.availableForCare}
          icon={<CheckCircle2 className="text-emerald-500" size={22} />}
        />
      </div>

      {/* 2. MAIN CONTENT AREA: Live Queue + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Up Queue (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t.dashboard.nextScheduledPatients}
            </h3>
          </div>

          {/* Quick list preview items */}
          {queue.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 dark:text-stone-500">
              <Inbox size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t.dashboard.noUpcomingAppointments}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-stone-800/50 rounded-xl hover:bg-slate-100/80 dark:hover:bg-stone-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-1.5 rounded-lg shrink-0">
                      #{item.queue_number ? String(item.queue_number).padStart(2, "0") : "--"}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-stone-200">
                        {item.patient.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.doctor.name} {item.doctor.specialization ? `• ${item.doctor.specialization}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 dark:text-stone-300 block">
                      {formatTime(item.appointment_time)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel (1 Column) */}
        <div className="bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
              {t.dashboard.quickOperations}
            </h3>
            <div className="space-y-2.5">
              {/* BOOK APPOINTMENT BUTTON */}
              <button 
                onClick={() => setIsAppointmentModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 bg-bee-yellow/10 hover:bg-bee-yellow/20 text-dark-hive dark:text-honey-gold rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <CalendarPlus size={18} />
                <span>{t.dashboard.bookAppointment}</span>
              </button>

              {/* NEW PATIENT INTAKE BUTTON */}
              <button 
                onClick={() => {
                  setEditingPatient(null);
                  setIsPatientModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-stone-800 hover:bg-slate-100 dark:hover:bg-stone-700/80 text-slate-700 dark:text-stone-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <UserPlus size={18} />
                <span>{t.dashboard.newPatientIntake}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONAL MODALS */}
      <IntakeModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSuccess={fetchDashboardSummary}
        patient={editingPatient}
      />

      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={fetchDashboardSummary}
      />
    </div>
  );
}

// Reusable Stat Card Helper Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ReactNode; 
}) {
  return (
    <div className="p-4 bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-2xl shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-2.5 bg-slate-50 dark:bg-stone-800 rounded-xl">{icon}</div>
    </div>
  );
}