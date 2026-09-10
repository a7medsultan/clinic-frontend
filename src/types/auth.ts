export interface User {
  id: number;
  username: string;
  role_name: 'admin' | 'receptionist' | 'doctor' | 'nurse';
  tenant_id: number;
  branch_id: number | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, jwtToken: string) => void;
  logout: () => void;
}