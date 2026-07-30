import { ComponentType } from 'react';

export interface NavItem {
  nameKey: 'dashboard' | 'patients' | 'appointments' | 'doctors' | 'users' | 'settings';
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  roles: ('admin' | 'receptionist' | 'doctor' | 'nurse')[];
}