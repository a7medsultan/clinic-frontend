export interface User {
  id: number;
  username: string;
  role_name: 'admin' | 'receptionist' | 'doctor' | 'nurse';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, jwtToken: string) => void;
  logout: () => void;
}