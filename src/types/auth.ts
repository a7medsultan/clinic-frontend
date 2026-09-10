export interface User {
  id: number;
  username: string;
  role_name: 'admin' | 'receptionist' | 'doctor' | 'nurse';
  tenant_id: number;
  branch_id: number | null;
  branch_scope?: 'single' | 'all';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, jwtToken: string) => void;
  logout: () => void;
  switchBranch: (branchId: number | null) => Promise<void>;
}