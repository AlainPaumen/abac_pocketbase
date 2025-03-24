import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PocketBase from 'pocketbase';
import { TypedPocketBase } from '@/database/pocketbase-types';

// Create a typed PocketBase instance
const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;

type PocketBaseContextType = {
  pb: TypedPocketBase;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const PocketBaseContext = createContext<PocketBaseContextType | undefined>(undefined);

export const usePocketBase = () => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }
  return context;
};

type PocketBaseProviderProps = {
  children: ReactNode;
};

export const PocketBaseProvider: React.FC<PocketBaseProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(pb.authStore.isValid);

  useEffect(() => {
    // Listen for authentication changes
    const unsubscribe = pb.authStore.onChange(() => {
      setIsAuthenticated(pb.authStore.isValid);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await pb.collection('_superusers').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  const value = {
    pb,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <PocketBaseContext.Provider value={value}>
      {children}
    </PocketBaseContext.Provider>
  );
};
