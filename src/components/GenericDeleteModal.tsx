import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../services/translations';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Unified type signature for your platform's different record types
type DeleteableEntity = {
  id: string | number;
  [key: string]: any; 
};

// Available pages/modules supported by your clinical manager
type EntityPageType = 'patients' | 'users' | 'doctors' | 'appointments';

interface GenericDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entity: DeleteableEntity | null;
  pageType: EntityPageType;
}

export default function GenericDeleteModal({ isOpen, onClose, onSuccess, entity, pageType }: GenericDeleteModalProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const [destroying, setDestroying] = useState<boolean>(false);

  if (!isOpen || !entity) return null;

  // Centralized dictionary mapping configuration targets for each module page
  const pageConfigs: Record<EntityPageType, { 
    apiRoute: string; 
    label: string; 
    getTitle: (item: any) => string; 
    getIdentifier: (item: any) => string; 
  }> = {
    patients: {
      apiRoute: 'patients',
      label: 'MRN System ID',
      getTitle: (item) => `${item.first_name} ${item.last_name}`,
      getIdentifier: (item) => item.patient_number
    },
    users: {
      apiRoute: 'users',
      label: 'Username',
      getTitle: (item) => item.username,
      getIdentifier: (item) => item.email
    },
    doctors: {
      apiRoute: 'doctors',
      label: 'License/ID',
      getTitle: (item) => `Dr. ${item.first_name} ${item.last_name}`,
      getIdentifier: (item) => item.specialization || 'Medical Staff'
    },
    appointments: {
      apiRoute: 'appointments',
      label: 'Queue Token',
      getTitle: (item) => `Appointment for ${item.p_first || 'Patient'}`,
      getIdentifier: (item) => `#${item.queue_number || item.id}`
    }
  };

  const currentConfig = pageConfigs[pageType];

  const handleDeleteTransaction = async () => {
    try {
      setDestroying(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const targetIdStr = currentConfig.getIdentifier(entity);
      
      const response = await fetch(`${baseUrl}/api/${currentConfig.apiRoute}/${entity.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) throw new Error('Backend failed to complete removal cycle.');

      showToast(
        lang === 'en' 
          ? `Record [${targetIdStr}] successfully archived.` 
          : `تم أرشفة السجل [${targetIdStr}] بنجاح.`,
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

        {/* DYNAMIC CARD CONTENT RESOLVED VIA PAGE TYPE */}
        <div className="p-3 bg-slate-50 dark:bg-stone-900/60 border border-slate-100 dark:border-stone-800 rounded-lg">
          <p className="text-sm font-bold text-dark-hive dark:text-slate-200">
            {currentConfig.getTitle(entity)}
          </p>
          <span className="font-mono text-xs text-slate-400 dark:text-stone-500 font-semibold block mt-0.5">
            {currentConfig.label}: {currentConfig.getIdentifier(entity)}
          </span>
        </div>

        <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-stone-400">
          {t.deleteModal.warning}
        </p>

        {/* CONTROLS */}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
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