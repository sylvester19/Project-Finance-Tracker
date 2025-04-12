// Note: auth.ts
import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Types
export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
});

// Provider component
export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if the user is authenticated
  async function checkAuth(): Promise<boolean> {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }

  // Login the user
  async function login(username: string, password: string): Promise<boolean> {
    try {
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      setUser(data.user);
      toast({
        title: 'Logged in successfully',
        description: `Welcome back, ${data.user.name}!`,
      });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid username or password',
        variant: 'destructive',
      });
      return false;
    }
  }

  // Logout the user
  async function logout(): Promise<void> {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      setLocation('/login');
      toast({
        title: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout failed',
        description: 'Could not log out',
        variant: 'destructive',
      });
    }
  }

  return React.createElement(
    AuthContext.Provider, 
    { value: { user, isLoading, login, logout, checkAuth } },
    props.children
  );
}

// Hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}
