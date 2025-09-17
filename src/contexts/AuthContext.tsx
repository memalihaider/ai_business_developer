"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface UserPreferences {
  id?: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  theme: string;
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
  timezone: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  status: string;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchPreferences: () => Promise<UserPreferences | null>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Ensure cookie is set for middleware
          setCookie('auth-token', storedToken);
          
          // Verify token is still valid before setting user state
          const isValid = await verifyToken(storedToken);
          
          if (isValid) {
            setToken(storedToken);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token is expired or invalid, clear auth data
        console.log('Token expired or invalid, clearing auth data');
        clearAuthData();
        return false;
      }

      if (!response.ok) {
        throw new Error(`Token verification failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.user) {
        setUser(data.data.user);
        return true;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuthData();
      return false;
    }
  };

  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    deleteCookie('auth-token');
    setToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { user: userData, token: authToken } = data.data;
        
        // Store auth data in localStorage and cookie
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setCookie('auth-token', authToken, rememberMe ? 30 : 7); // 30 days if remember me, otherwise 7 days
        
        setToken(authToken);
        setUser(userData);
        
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out from all devices');
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (token) {
      await verifyToken(token);
    }
  };

  const fetchPreferences = async (): Promise<UserPreferences | null> => {
    try {
      if (!token) return null;
      
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.preferences) {
          // Update user object with preferences
          setUser(prev => prev ? { ...prev, preferences: data.preferences } : null);
          return data.preferences;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<boolean> => {
    try {
      if (!token) return false;
      
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.preferences) {
          // Update user object with new preferences
          setUser(prev => prev ? { ...prev, preferences: data.preferences } : null);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    logoutAll,
    refreshUser,
    fetchPreferences,
    updatePreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;