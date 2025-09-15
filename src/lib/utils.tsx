'use client';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- UserContext for Authenticated User State ---
import React, { createContext, useContext, useState } from 'react';

export type AuthUser = {
  userId: string;
  email?: string;
  name?: string;
  fullName?: string;
  role: string;
  type?: 'admin' | 'client';
  avatarUrl?: string;
  companyName?: string;
  clientId?: string;
  client_id?: string;
  bio?: string;
  permissions?: string[];
  role_name?: string;
};

interface UserContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
