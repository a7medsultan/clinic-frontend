import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useApp } from './AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast, ToastType } from '../types/toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { lang } = useApp();

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-destruct notification node after 3500ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* FLOATING TOASTS DECK CONTAINER */}
      <div 
        className={`fixed bottom-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 transition-all duration-300 ${
          lang === 'ar' ? 'left-5 animate-slide-in-left' : 'right-5 animate-slide-in-right'
        }`}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-3 p-4 rounded-xl border shadow-xl bg-white dark:bg-stone-900 transition-all transform animate-fade-in`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info size={18} className="text-honey-gold shrink-0" />}
              
              <p className="text-sm font-bold text-dark-hive dark:text-stone-200">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be within a ToastProvider context layer.');
  return context;
};