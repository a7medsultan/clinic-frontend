import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../services/translations';
import { QRCodeSVG } from 'qrcode.react'; 
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Phone, Mail, Calendar, 
  User, ShieldAlert, Loader2 
} from 'lucide-react';
import type { Patient } from '../types/patients';

interface PatientProfileProps {
  patientId: number;
  onBack: () => void;
}

export default function PatientProfile({ patientId, onBack }: PatientProfileProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const t = translations[lang];

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/patients/${patientId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        if (!response.ok) throw new Error(`${t.profile.errLoadProfile} (Status: ${response.status})`);
        const data = await response.json();
        setPatient(data.data);
      } catch (err: any) {
        setError(err.message || t.profile.errLoadProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, [patientId, token, t]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-honey-gold" />
        <span className="font-bold text-sm">{t.profile.loadingProfile}</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center gap-2">
        <ShieldAlert size={18} className="shrink-0" />
        <span>{error || t.profile.errPatientNotFound}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* NAVIGATION ACTION BAR */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-dark-hive dark:hover:text-white transition-all cursor-pointer uppercase tracking-wider"
      >
        {lang === 'ar' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
        <span>{t.profile.back}</span>
      </button>

      {/* PATIENT BRIEF BANNER CORES */}
      <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-slate-50 dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl text-slate-400 dark:text-stone-500">
            <User size={32} className="text-honey-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-dark-hive dark:text-white tracking-tight">
                {patient.first_name} {patient.last_name}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-stone-800 text-slate-500 dark:text-stone-400 border border-slate-200/50 dark:border-stone-700/50">
                MRN: {patient.patient_number}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-400 dark:text-stone-500 mt-1 uppercase tracking-wide">
              {patient.gender} • {patient.dob.substring(0, 10)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN PANEL: CORE REGISTER METRICS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-dark-hive dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-stone-800 pb-3">
              {t.profile.demographics}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.profile.contactPhone}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold">
                  <Phone size={14} className="text-slate-400" />
                  <span className="direction-ltr">{patient.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.profile.emailCoordinates}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold truncate">
                  <Mail size={14} className="text-slate-400" />
                  <span>{patient.email || "—"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.profile.governmentId}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-mono font-bold">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>{patient.national_id || "—"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-stone-900/50 rounded-xl border border-slate-100/50 dark:border-stone-800/50">
                <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1">
                  {t.profile.registrationDate}
                </span>
                <div className="flex items-center gap-2 text-slate-800 dark:text-stone-200 font-bold">
                  <Calendar size={14} className="text-slate-400" />
                  <span>
                    {patient.created_at 
                      ? new Date(patient.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium' }) 
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* CLINICAL ALLERGY NOTICES BLOCK */}
            <div className="mt-4">
              <span className="block text-xs text-slate-400 dark:text-stone-500 font-bold uppercase mb-1.5">
                {t.profile.allergiesNotice}
              </span>
              {patient.allergies && patient.allergies.toLowerCase() !== 'no known allergies' ? (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-bold flex gap-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{patient.allergies}</span>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {t.profile.noAllergies}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN PANEL: EMR SECURITY VERIFICATION OVERLAY & QR ENGINES */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/50 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
            <div>
              <h3 className="text-sm font-black text-dark-hive dark:text-white uppercase tracking-wider">
                {t.profile.uuidScanner}
              </h3>
              <p className="text-xs text-slate-400 dark:text-stone-500 font-medium mt-1 max-w-[200px]">
                {t.profile.scanNotice}
              </p>
            </div>

            {/* VECTOR QR BLOCK CANVAS */}
            <div className="p-4 bg-white border-4 border-slate-50 dark:border-stone-800/60 rounded-2xl shadow-inner transition-colors">
              <QRCodeSVG
                value={patient.uuid}
                size={160}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1c1917"
                includeMargin={false}
              />
            </div>

            <div className="w-full">
              <span className="block text-[10px] font-black text-slate-400 dark:text-stone-500 uppercase tracking-widest mb-1 font-mono">
                {t.profile.systemDeviceId}
              </span>
              <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-stone-400 bg-slate-50 dark:bg-stone-900 border border-slate-100 dark:border-stone-800 px-3 py-2 rounded-lg break-all select-all">
                {patient.uuid}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}