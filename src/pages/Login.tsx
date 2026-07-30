import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { translations } from '../services/translations';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Activity, Sun, Moon, Globe } from 'lucide-react';
import beeclinic from '../assets/beeclinic.svg';

export default function Login() {
  const [credentials, setCredentials] = useState({ usernameOrEmail: '', password: '' });
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const { login } = useAuth();
  const { theme, lang, toggleTheme, changeLanguage } = useApp();
  const navigate = useNavigate();

  const t = translations[lang]; // Pull localized translations object dictionary matching active state

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed.');

      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center font-sans relative">
      
      {/* Dynamic Top Floating Settings Control Action Bar */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center dir-none">
        <button 
          onClick={() => changeLanguage(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white/80 dark:bg-dark-hive/40 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <Globe size={16} />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/80 dark:bg-dark-hive/40 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md rounded-xl bg-white dark:bg-stone-900/40 p-8 shadow-xl border border-slate-100 dark:border-wood-brown/30 backdrop-blur-md">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 text-honey-gold rounded-lg mb-2">
            <p>
              <img src={beeclinic} alt="Bee Clinic Logo" className="w-20 h-20" />
            </p>
            
          </div>
          <h1 className="text-3xl text-dark-hive dark:text-white tracking-tight mb-4"><span className='font-bold'>Bee</span>Clinic</h1>
          <h2 className="text-2xl font-bold text-dark-hive dark:text-white tracking-tight">{t.loginTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.loginSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.usernameLabel}</label>
            <div className="relative flex items-center">
              <UserIcon size={18} className="absolute left-3 rtl:right-3 rtl:left-auto text-slate-400" />
              <input 
                type="text" 
                name="usernameOrEmail" 
                required 
                placeholder="admin_ahmed"
                value={credentials.usernameOrEmail}
                onChange={handleChange}
                className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-wood-brown/50 bg-white/50 dark:bg-dark-hive/40 text-dark-hive dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.passwordLabel}</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3 rtl:right-3 rtl:left-auto text-slate-400" />
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-wood-brown/50 bg-white/50 dark:bg-dark-hive/40 text-dark-hive dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-3 px-4 bg-bee-yellow hover:bg-honey-gold text-dark-hive font-bold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-wood-brown transition-all cursor-pointer text-center"
          >
            {submitting ? t.authenticating : t.authButton}
          </button>
        </form>

      </div>
    </div>
  );
}