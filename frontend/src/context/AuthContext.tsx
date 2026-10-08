import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

export type UserRole = 'Procurement Officer' | 'Executive Approver' | 'Compliance Analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  department: string;
}

export const PRESET_USERS: User[] = [
  {
    id: 'usr_01H8X',
    name: 'Aria Vance',
    email: 'aria.vance@autonosource.internal',
    role: 'Procurement Officer',
    avatarInitials: 'AV',
    department: 'Commercial Sourcing & DPCO Compliance',
  },
  {
    id: 'usr_02B9Y',
    name: 'Dr. Rajesh Sharma',
    email: 'r.sharma@autonosource.internal',
    role: 'Compliance Analyst',
    avatarInitials: 'RS',
    department: 'CDSCO, Schedule M & Cold-Chain Oversight',
  },
  {
    id: 'usr_03C1Z',
    name: 'Vikram Malhotra',
    email: 'v.malhotra@autonosource.internal',
    role: 'Executive Approver',
    avatarInitials: 'VM',
    department: 'Hospital CFO & Executive Board',
  },
];

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  switchUser: (user: User) => void;
  availableUsers: User[];
}

const STORAGE_KEY_USER = 'autonosource_active_user_id';

const AuthContext = createContext<AuthContextType>({
  user: PRESET_USERS[0],
  isAuthenticated: true,
  switchRole: () => {},
  switchUser: () => {},
  availableUsers: PRESET_USERS,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_USER);
      if (savedId) {
        const found = PRESET_USERS.find((u) => u.id === savedId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return PRESET_USERS[0];
  });

  const switchRole = (role: UserRole) => {
    const target = PRESET_USERS.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      try {
        localStorage.setItem(STORAGE_KEY_USER, target.id);
      } catch {
        // ignore
      }
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, user.id);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      user: currentUser,
      isAuthenticated: true,
      switchRole,
      switchUser,
      availableUsers: PRESET_USERS,
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
