import React, { createContext, useContext, useMemo } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Procurement Officer' | 'Executive Approver' | 'Compliance Analyst';
  avatarInitials: string;
}

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
}

const defaultUser: User = {
  id: 'usr-9042',
  name: 'Elena Rostova',
  email: 'e.rostova@autonosource.internal',
  role: 'Procurement Officer',
  avatarInitials: 'ER',
};

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  isAuthenticated: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo(
    () => ({
      user: defaultUser,
      isAuthenticated: true,
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
