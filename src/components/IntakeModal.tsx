import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../services/translations';
import { X, UserPlus, ShieldAlert, Loader2, Save } from 'lucide-react';
import type { Patient } from '../types/patients';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: Patient | null; // ⚡ Optional tracking parameter to determine form mode execution
}

export default function IntakeModal({ isOpen, onClose, onSuccess, patient }: IntakeModalProps) {
  const { lang } = useApp();
  const { token } = useAuth();
  const { showToast } = useToast();
  const t = translations[lang];

  const isEditMode = !!patient;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'male',
    phone: '',
    email: '',
    national_id: '',
    allergies: 'No known allergies'
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeErrorField, setActiveErrorField] = useState<string>(''); // ⚡ Tracks which field to visually highlight

  // ⚡ HYDRATION EFFECT: Watch for mode updates and map existing row parameters into local states cleanly
  useEffect(() => {
    if (isOpen) {
      if (patient) {
        setFormData({
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          // Extract just the YYYY-MM-DD parameter string if your DB saves ISO timestamps
          dob: patient.dob ? patient.dob.substring(0, 10) : '',
          gender: patient.gender || 'male',
          phone: patient.phone || '',
          email: patient.email || '',
          national_id: patient.national_id || '',
          allergies: patient.allergies || 'No known allergies'
        });
      } else {
        // Clear all input tracking back to defaults when opening fresh creation cards
        setFormData({
          first_name: '',
          last_name: '',
          dob: '',
          gender: 'male',
          phone: '',
          email: '',
          national_id: '',
          allergies: 'No known allergies'
        });
      }
      setError('');
      setActiveErrorField('');
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    // ⚡ Strict restriction: Only permit numeric digits in the phone field
    if (name === 'phone') {
      value = value.replace(/\D/g, '');
    }

    setFormData({ ...formData, [name]: value });

    // Clear active error layout tags once the user modifies the problematic field
    if (activeErrorField === name) {
      setActiveErrorField('');
      setError('');
    }
  };

  const validateForm = (): boolean => {
    // 1. First Name validation
    if (!formData.first_name.trim()) {
      setError(t.registration.validation.firstNameReq);
      setActiveErrorField('first_name');
      return false;
    }

    // 2. Last Name validation
    if (!formData.last_name.trim()) {
      setError(t.registration.validation.lastNameReq);
      setActiveErrorField('last_name');
      return false;
    }

    // 3. Date of Birth timeline check
    if (!formData.dob) {
      setError(t.registration.validation.dobReq);
      setActiveErrorField('dob');
      return false;
    }
    const dobDate = new Date(formData.dob);
    const today = new Date();
    if (dobDate > today) {
      setError(t.registration.validation.dobFuture);
      setActiveErrorField('dob');
      return false;
    }
    if (today.getFullYear() - dobDate.getFullYear() > 125) {
      setError(t.registration.validation.dobHistorical);
      setActiveErrorField('dob');
      return false;
    }

    // 4. Contact Phone basic length check (Guaranteed to be digits only due to handleChange restriction)
    if (formData.phone.length < 7) {
      setError(t.registration.validation.phoneMin);
      setActiveErrorField('phone');
      return false;
    }

    // 5. Email address syntax pattern mapping
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError(t.registration.validation.emailInvalid);
      setActiveErrorField('email');
      return false;
    }

    // 6. Emirates ID format sanity checking
    const cleanedEid = formData.national_id.replace(/-/g, '');
    if (cleanedEid.length !== 15 || !/^\d+$/.test(cleanedEid)) {
      setError(t.registration.validation.nationalIdLen);
      setActiveErrorField('national_id');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setActiveErrorField('');

    // Trigger explicit interface verification
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      // ⚡ DYNAMIC ROUTING PATH MATRIX Selection: POST vs PUT
      const url = isEditMode 
        ? `${baseUrl}/api/patients/${patient!.id}` 
        : `${baseUrl}/api/patients`;
        
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.registration.errDbFallback);
      }

      // Success announcement alerts
      showToast(
        isEditMode ? t.registration.successEdit : t.registration.successAdd,
        'success'
      );

      onSuccess(); 
      onClose();   
    } catch (err: any) {
      setError(err.message || t.registration.errNetwork);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper utility to inject specific CSS highlight markers when validation criteria crashes
  const getInputStyles = (fieldName: string) => {
    const baseStyle = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 transition-all";
    const statusStyle = activeErrorField === fieldName
      ? "border-rose-500 ring-2 ring-rose-500/20 focus:ring-rose-500 dark:border-rose-500"
      : "border-slate-200 dark:border-stone-800 focus:ring-honey-gold";
    return `${baseStyle} ${statusStyle}`;
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
                ? `${t.registration.editTitle} ${patient?.patient_number}`
                : t.registration.modalTitle
              }
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* DATA FILL WORKSPACE */}
        <form id="intakeModalForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.firstName}</label>
              <input 
                type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                className={getInputStyles('first_name')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.lastName}</label>
              <input 
                type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                className={getInputStyles('last_name')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.dob}</label>
              <input 
                type="date" name="dob" value={formData.dob} onChange={handleChange}
                className={getInputStyles('dob')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.gender}</label>
              <select 
                name="gender" value={formData.gender} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all appearance-none cursor-pointer"
              >
                <option value="male">{t.registration.male}</option>
                <option value="female">{t.registration.female}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.phone}</label>
              <input 
                type="tel" name="phone" placeholder="500000000" value={formData.phone} onChange={handleChange}
                className={`${getInputStyles('phone')} ltr:text-left rtl:text-right`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.email}</label>
              <input 
                type="email" name="email" placeholder="patient@example.com" value={formData.email} onChange={handleChange}
                className={`${getInputStyles('email')} ltr:text-left rtl:text-right`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.nationalId}</label>
            <input 
              type="text" name="national_id" placeholder="784-1988-XXXXXXX-X" value={formData.national_id} onChange={handleChange}
              className={`${getInputStyles('national_id')} font-mono`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{t.registration.allergies}</label>
            <textarea 
              name="allergies" rows={3} value={formData.allergies} onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all resize-none"
            />
          </div>
        </form>

        {/* MODAL CONTROLS FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-stone-800/80 bg-slate-50/50 dark:bg-stone-900/50 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-all cursor-pointer">
            {t.registration.cancel}
          </button>
          
          <button type="submit" form="intakeModalForm" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-bee-yellow hover:bg-honey-gold disabled:bg-bee-yellow/50 text-dark-hive font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.registration.submitting}</span>
              </>
            ) : (
              <span>{isEditMode ? t.registration.saveChanges : t.registration.submit}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}