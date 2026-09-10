import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../services/translations';
import { X, UserPlus, ShieldAlert, Loader2, Save } from 'lucide-react';
import BranchSelect from './BranchSelect';
import type { User } from '../types/users';
import type { Branch } from '../types/branches';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  roles: { id: number; name: string }[];
  branches: Branch[];
}

export default function UserFormModal({ isOpen, onClose, onSuccess, user, roles, branches }: UserFormModalProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const isEditMode = !!user;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role_id: 2,
    password: '',
    confirmPassword: '',
    is_active: 1,
    branch_id: ''
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          role_id: Number(user.role_id) || 2,
          password: '',
          confirmPassword: '',
          is_active: String(user.is_active) === 'true' || String(user.is_active) === '1' ? 1 : 0,
          branch_id: user.branch_id ? String(user.branch_id) : ''
        });
      } else {
        setFormData({
          username: '',
          email: '',
          role_id: 2,
          password: '',
          confirmPassword: '',
          is_active: 1,
          branch_id: ''
        });
      }
      setError('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (pass.length >= 10 && score > 0) score = Math.min(score + 1, 4);

    const levels = [
      { score: 1, label: t.users.weak, color: 'bg-rose-500' },
      { score: 2, label: t.users.fair, color: 'bg-amber-500' },
      { score: 3, label: t.users.good, color: 'bg-blue-500' },
      { score: 4, label: t.users.strong, color: 'bg-emerald-500' }
    ];

    return levels[score - 1] || { score: 1, label: t.users.weak, color: 'bg-rose-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: (name === 'role_id' || name === 'is_active') ? Number(value) : value 
    });
  };

  const validateForm = (): boolean => {
    if (formData.username.trim().length < 3) {
      setError(t.users.usernameMinLength);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError(t.users.emailInvalid);
      return false;
    }

    if (!isEditMode || formData.password) {
      if (formData.password.length < 6) {
        setError(t.users.passwordMinLength);
        return false;
      }

      if (strength.score < 2) {
        setError(t.users.passwordTooWeak);
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError(t.users.passwordsDoNotMatch);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      const url = isEditMode 
        ? `${baseUrl}/api/users/${user!.id}` 
        : `${baseUrl}/api/users`;
        
      const method = isEditMode ? 'PUT' : 'POST';

      const payload: any = { ...formData };
      delete payload.confirmPassword;
      payload.branch_id = payload.branch_id ? Number(payload.branch_id) : null;

      if (isEditMode && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Database execution transaction validation breakdown.');
      }

      showToast(
        isEditMode ? t.users.userUpdated : t.users.userCreated,
        'success'
      );

      onSuccess(); 
      onClose();   
    } catch (err: any) {
      setError(err.message || 'System fault executing network registration packet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-hive/40 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* HEADER BAR PANEL */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-stone-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-honey-gold rounded-lg">
              {isEditMode ? <Save size={18} /> : <UserPlus size={18} />}
            </div>
            <h3 className="text-lg font-bold text-dark-hive dark:text-white tracking-tight">
              {isEditMode 
                ? t.users.editParameters.replace('{{username}}', user?.username || '')
                : t.users.modalTitle
              }
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* DATA FILL WORKSPACE */}
        <form id="userModalForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.users.username}</label>
              <input 
                type="text" name="username" required value={formData.username} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.users.email}</label>
              <input 
                type="email" name="email" required placeholder="user@example.com" value={formData.email} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all ltr:text-left rtl:text-right"
              />
            </div>
          </div>

          {/* Password alignment fields grid block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.users.password} {isEditMode && <span className="text-slate-400 dark:text-stone-500 font-normal lowercase">{t.users.leaveBlank}</span>}
              </label>
              <input 
                type="password" name="password" required={!isEditMode} placeholder="••••••••" value={formData.password} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              />
              
              {/* Dynamic Real-time Strength Indicator Meter Block */}
              {formData.password && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-400 dark:text-stone-500">
                      {t.users.passwordStrength}
                    </span>
                    <span className={
                      strength.score === 1 ? 'text-rose-500' :
                      strength.score === 2 ? 'text-amber-500' :
                      strength.score === 3 ? 'text-blue-500' : 'text-emerald-500'
                    }>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-stone-800 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={`h-full flex-1 transition-all duration-300 ${
                          step <= strength.score ? strength.color : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {t.users.confirmPassword}
              </label>
              <input 
                type="password" name="confirmPassword" required={!isEditMode || !!formData.password} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              />
            </div>
          </div>

          {/* role_id, branch and is_active options block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.users.role}</label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all capitalize"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id} className="text-dark-hive dark:text-white bg-white dark:bg-stone-900">
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.users.branch}</label>
              <BranchSelect
                branches={branches}
                value={formData.branch_id}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.users.accountStatus}</label>
              <select
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              >
                <option value={1} className="text-dark-hive dark:text-white bg-white dark:bg-stone-900">{t.users.activeAllowedLogin}</option>
                <option value={0} className="text-dark-hive dark:text-white bg-white dark:bg-stone-900">{t.users.inactiveSuspended}</option>
              </select>
            </div>
          </div>
        </form>

        {/* MODAL CONTROLS FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-stone-800/80 bg-slate-50/50 dark:bg-stone-900/50 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-all cursor-pointer">
            {t.form.cancel}
          </button>
          
          <button type="submit" form="userModalForm" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-bee-yellow hover:bg-honey-gold disabled:bg-bee-yellow/50 text-dark-hive font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.form.saving}</span>
              </>
            ) : (
              <span>{isEditMode ? t.users.saveChanges : t.form.save}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}