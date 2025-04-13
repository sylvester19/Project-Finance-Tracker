import React, { createContext, useState, useContext, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in via session cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include", // Important for sending cookies
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important for cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      const accessToken = data.accessToken;

      // Store the token in localStorage
      localStorage.setItem('access_token', accessToken);

      // Fetch user info using the access token
      const userRes = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error("Failed to fetch user");
      }

      setUser(userData);
      return userData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // Important for cookies
      });
      
      if (response.ok) {
        setUser(null);
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
