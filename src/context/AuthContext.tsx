import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clinic_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cachedUser = localStorage.getItem('clinic_user');
    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
    }
    setLoading(false);
  }, [token]);

  const login = (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('clinic_token', jwtToken);
    localStorage.setItem('clinic_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
  };

  const switchBranch = async (branchId: number | null) => {
    if (!token) throw new Error('Not authenticated.');
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${baseUrl}/api/auth/switch-branch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ branch_id: branchId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to switch branch.');
    }

    login(data.user, data.token);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchBranch, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};