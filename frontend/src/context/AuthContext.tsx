import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUserAndOrg: (user: User, org: Organization) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('brandshield_access_token');
    const storedUser = localStorage.getItem('brandshield_user');
    const storedOrg = localStorage.getItem('brandshield_org');

    if (token && storedUser && storedOrg) {
      try {
        setUser(JSON.parse(storedUser));
        setOrganization(JSON.parse(storedOrg));
      } catch (e) {
        console.error("Failed to parse stored session", e);
      }
    }
    setLoading(false);
  }, []);

  const setUserAndOrg = (newUser: User, newOrg: Organization) => {
    setUser(newUser);
    setOrganization(newOrg);
    localStorage.setItem('brandshield_user', JSON.stringify(newUser));
    localStorage.setItem('brandshield_org', JSON.stringify(newOrg));
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      if (data.user && data.organization) {
        setUserAndOrg(data.user, data.organization);
      }
    } catch (e) {
      console.error("Error refreshing profile:", e);
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user && !!localStorage.getItem('brandshield_access_token'),
        loading,
        setUserAndOrg,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
