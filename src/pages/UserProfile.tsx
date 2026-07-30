import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../services/translations';
import { QRCodeSVG } from 'qrcode.react'; // ⚡ Light vector svg renderer engine
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Mail, Calendar, 
  User, ShieldAlert, Loader2, KeyRound, CheckCircle2, AlertCircle
} from 'lucide-react';

// Locally declare implicit structure to prevent type omissions if types file fluctuates
interface LocalUserProfile {
  id: number;
  username: string;
  email: string;
  role_name?: string;
  is_active?: number | boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfileProps {
  userId: number;
  onBack: () => void;
}

export default function UserProfile({ userId, onBack }: UserProfileProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const t = translations[lang];

  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        if (!response.ok) throw new Error(`Chart execution error: ${response.status}`);
        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize clinical profile memory map.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-stone-500">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 rounded-full border-2 border-honey-gold/20 animate-ping" />
          <Loader2 size={32} className="animate-spin text-honey-gold relative z-10" />
        </div>
        <span className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-stone-400">
          {lang === 'en' ? 'Synchronizing Profile Matrix...' : 'جاري تحميل بيانات الحساب...'}
        </span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-5 bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center gap-3">
        <ShieldAlert size={18} className="shrink-0" />
        <span>{error || 'User reference index point lost.'}</span>
      </div>
    );
  }

  const isActive = user.is_active === 1 || user.is_active === true || user.is_active === '1';

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* NAVIGATION ACTION BAR */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-dark-hive dark:text-stone-300 transition-all cursor-pointer uppercase tracking-wider group"
      >
        {lang === "ar" ? (
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        ) : (
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
        )}
        <span>{t.profile.back}</span>
      </button>

      {/* MAIN OVERVIEW PROFILE DASHBOARD */}
      <div className="bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/80 rounded-2xl shadow-sm overflow-hidden">
        {/* TOP ACCENT AMBIENT ROW BRAND BAR */}
        <div className="h-2 w-full bg-gradient-to-r from-bee-yellow via-honey-gold to-amber-600" />

        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT SIDE BLOCK: AVATAR BADGING MATRIX */}
          <div className="flex flex-col items-center text-center sm:text-left sm:items-start lg:items-center lg:text-center w-full lg:w-48 shrink-0 space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-honey-gold/10 rounded-2xl blur-md group-hover:blur-xl transition-all duration-300" />
              <div className="relative p-6 bg-slate-50 dark:bg-stone-900 border-2 border-slate-100 dark:border-stone-800 rounded-2xl text-honey-gold shadow-sm flex items-center justify-center w-28 h-28">
                <User size={48} strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-1 w-full">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Active Account</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} />
                    <span>Suspended</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* CENTER BLOCK: DETAILED INFORMATION MATRIX FEED */}
          <div className="flex-1 w-full space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <h2 className="text-2xl font-black text-dark-hive dark:text-white tracking-tight">
                  {user.username}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-honey-gold border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider max-w-fit">
                  <KeyRound size={12} />
                  <span>{user.role_name || "System User"}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-stone-500 mt-1 flex items-center gap-1.5">
                <Mail
                  size={14}
                  className="text-slate-300 dark:text-stone-600"
                />
                <span className="select-all">{user.email}</span>
              </p>
            </div>

            <hr className="border-slate-100 dark:border-stone-800/60" />

            {/* DATA FIELD RECTANGLE BLOCKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TIMESTAMPS CARD BLOCK */}
              <div className="p-4 bg-slate-50/50 dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider">
                  <Calendar size={14} className="text-honey-gold" />
                  <span>Timeline Matrix Logs</span>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-500 dark:text-stone-400">
                  <div className="flex items-center justify-between">
                    <span>{t.common.createdAt}</span>
                    <span className="font-mono bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-slate-100 dark:border-stone-800 text-dark-hive dark:text-stone-300 font-bold">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            lang === "ar" ? "ar-AE" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t.common.updatedAt}</span>
                    <span className="font-mono bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-slate-100 dark:border-stone-800 text-dark-hive dark:text-stone-300 font-bold">
                      {user.updated_at
                        ? new AppDateTime(user.updated_at).toLocaleDateString(
                            lang === "ar" ? "ar-AE" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECURITY TRACKING INDEX CARD */}
              <div className="p-4 bg-slate-50/50 dark:bg-stone-900/40 border border-slate-100 dark:border-stone-800/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-honey-gold" />
                  <span>System Security Reference</span>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-500 dark:text-stone-400">
                  <div className="flex items-center justify-between">
                    <span>System Index Keys</span>
                    <span className="font-mono text-dark-hive dark:text-white font-bold">
                      #ID-000{user.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Encrypted Connection</span>
                    <span className="text-emerald-500 font-bold tracking-tight">
                      SSL/TLS Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE BLOCK: SECURE IDENTIFICATION QR ENCODING BADGE */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center justify-center self-stretch lg:border-l lg:rtl:border-r-0 lg:rtl:border-l-0 lg:border-slate-100 lg:dark:border-stone-800/60 lg:pl-8 lg:rtl:pr-8 lg:rtl:pl-0">
            <div className="p-3 bg-white dark:bg-white rounded-xl shadow-inner border border-slate-100 dark:border-stone-800">
              <QRCodeSVG
                value={JSON.stringify({
                  id: user.id,
                  username: user.username,
                  role: user.role_name,
                })}
                size={110}
                level="M"
                includeMargin={false}
                imageSettings={{
                  src: "/favicon.ico", // Optional placement of branding iconography centers inside QR structures
                  x: undefined,
                  y: undefined,
                  height: 18,
                  width: 18,
                  excavate: true,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-widest mt-2">
              Secure QR Verification
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}