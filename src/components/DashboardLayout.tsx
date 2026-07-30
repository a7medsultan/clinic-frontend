import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { translations } from '../services/translations';
import beeclinic from '../assets/beeclinic.svg';

import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Globe,
  Stethoscope
} from 'lucide-react';
import type { NavItem } from '../types/navigation';

const sidebarItems: NavItem[] = [
  { nameKey: 'dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'doctor', 'nurse'] },
  { nameKey: 'patients', path: '/patients', icon: Users, roles: ['admin', 'receptionist', 'nurse'] },
  { nameKey: 'appointments', path: '/appointments', icon: CalendarDays, roles: ['admin', 'receptionist', 'doctor', 'nurse'] },
  { nameKey: 'doctors', path: '/doctors', icon: Stethoscope, roles: ['admin'] },
  { nameKey: 'users', path: '/users', icon: ShieldAlert, roles: ['admin'] },
  { nameKey: 'settings', path: '/settings', icon: Settings, roles: ['admin', 'receptionist', 'doctor', 'nurse'] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, lang, toggleTheme, changeLanguage } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const t = translations[lang];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream dark:bg-dark-hive font-sans">
      
      {/* 1. SIDEBAR CONTAINER */}
      <aside className="w-64 bg-stone-900 text-stone-100 border-r border-stone-800 flex flex-col justify-between h-full shrink-0">
        <div>
          {/* Main Logo Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-stone-800">
            <div>
              <img src={beeclinic} alt="Bee Clinic Logo" className="w-10 h-10" />
            </div>
            <span className="text-lg tracking-tight text-white"><span className='font-bold'>Bee</span>Clinic</span>
          </div>

          {/* User Role Card Profile indicator */}
          <div className="p-4 mx-3 my-4 rounded-lg bg-stone-950/40 border border-stone-800/60">
            <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Logged Operator</p>
            <p className="text-sm font-bold text-white mt-0.5 truncate">{user?.username}</p>
            <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 bg-bee-yellow/10 text-bee-yellow rounded border border-bee-yellow/20 uppercase">
              {user?.role_name}
            </span>
          </div>

          {/* Nav List Mapping - Conditioned dynamically by RBAC role types */}
          <nav className="space-y-1 py-2">
            {sidebarItems.map((item) => {
              if (!user || !item.roles.includes(user.role_name)) return null;

              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 px-5 text-sm font-semibold transition-all group border-y border-transparent ${
                    isActive
                      ? "bg-cream dark:bg-dark-hive text-dark-hive dark:text-white border-r-0 ltr:mr-0 ltr:rounded-l-xl rtl:ml-0 rtl:rounded-r-xl border-l-4 border-l-bee-yellow rtl:border-l-0 rtl:border-r-4 rtl:border-r-bee-yellow relative z-10"
                      : "text-stone-400 hover:bg-stone-800/40 hover:text-stone-100 ltr:mr-3 ltr:rounded-r-lg rtl:ml-3 rtl:rounded-l-lg"
                  }`}
                >
                  {/* Active Bleed Cover Layer Effect */}
                  {isActive && (
                    <div className="absolute top-0 bottom-0 w-2 bg-cream dark:bg-dark-hive ltr:-right-1 rtl:-left-1 z-20" />
                  )}

                  <Icon
                    size={18}
                    className={
                      isActive
                        ? "text-honey-gold"
                        : "text-stone-400 group-hover:text-stone-100"
                    }
                  />
                  <span>{t.nav[item.nameKey]}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Operational Footer Log Out */}
        <div className="p-3 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* TOP COMPONENT CONTROL NAVIGATION STATUS BAR */}
        <header className="h-16 border-b border-slate-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-sm font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider">
              {location.pathname.substring(1) || 'Workspace'}
            </h1>
          </div>

          {/* Dynamic Utilities Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeLanguage(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/50 cursor-pointer"
            >
              <Globe size={14} />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/50 cursor-pointer"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT CORE CANVAS SCREEN RENDERER */}
        <main className="flex-1 overflow-y-auto p-6 bg-cream dark:bg-dark-hive">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}