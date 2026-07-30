import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../services/translations';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id: string | number | undefined;     // The ID of the item being deleted
  endpoint: string;                     // e.g., 'patients', 'doctors', 'appointments'
  displayName: string;                  // e.g., 'Dr. John Smith'
  displaySubtitle?: string;             // e.g., 'MRN System ID: 12345' (Optional)
  successMessageEn?: string;            // Custom success msg in English (Optional)
  successMessageAr?: string;            // Custom success msg in Arabic (Optional)
}

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  endpoint, 
  displayName, 
  displaySubtitle,
  successMessageEn,
  successMessageAr
}: DeleteModalProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const [destroying, setDestroying] = useState<boolean>(false);

  // Guard clause: don't render if closed or if there's no target ID
  if (!isOpen || !id) return null;

  const handleDeleteTransaction = async () => {
    try {
      setDestroying(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      const response = await fetch(`${baseUrl}/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) throw new Error('Backend failed to complete removal cycle.');

      // Fallback messaging if no custom translations are supplied via props
      const defaultEn = 'Record successfully deleted.';
      const defaultAr = 'تم حذف السجل بنجاح.';

      showToast(
        lang === 'en' 
          ? (successMessageEn || defaultEn) 
          : (successMessageAr || defaultAr),
        'success'
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error executing record removal payload.', 'error');
    } finally {
      setDestroying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-hive/40 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl shadow-2xl p-6 space-y-4">
        
        {/* WARNING ALERT HEADER INDICATOR */}
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-lg font-black tracking-tight">{t.deleteModal.title}</h3>
        </div>

        {/* PROFILE CARD CARD SUMMARY DETAILS */}
        <div className="p-3 bg-slate-50 dark:bg-stone-900/60 border border-slate-100 dark:border-stone-800 rounded-lg">
          <p className="text-sm font-bold text-dark-hive dark:text-slate-200">
            {displayName}
          </p>
          {displaySubtitle && (
            <span className="font-mono text-xs text-slate-400 font-semibold block mt-0.5">
              {displaySubtitle}
            </span>
          )}
        </div>

        <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-stone-400">
          {t.deleteModal.warning}
        </p>

        {/* CONTROL DECK ACTION ARRAY PACKET */}
        <div className="flex items-center justify-end gap-3 pt-2 text-xs font-bold">
          <button
            type="button"
            disabled={destroying}
            onClick={onClose}
            className="px-4 py-2 text-slate-500 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {t.deleteModal.cancel}
          </button>
          
          <button
            type="button"
            disabled={destroying}
            onClick={handleDeleteTransaction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-rose-600/10"
          >
            {destroying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{t.deleteModal.confirm}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}