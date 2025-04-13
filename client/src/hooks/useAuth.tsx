// client/src/hooks/use-auth.tsx

import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from 'js-cookie'; 

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
  getAccessToken: () => string | null; // Add getAccessToken function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getAccessToken: () => null, // Initialize getAccessToken
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        // Handle refresh token expiration or invalidation
        if (response.status === 403) {
          // Refresh token expired or invalid
          Cookies.remove('refreshToken'); // Remove the refresh token cookie
          setUser(null); // Clear user data
          localStorage.removeItem('access_token'); // Remove access token
          window.location.href = '/login'; // Redirect to login page
          return null;
        }
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;
      localStorage.setItem('access_token', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  // Custom fetch function with automatic token refresh
  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let accessToken = getAccessToken();

    if (!accessToken) {
      // If no access token, check for refresh token and attempt to refresh
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) {
          // Token refresh failed, redirect to login (handled in refreshAccessToken)
          throw new Error("Token refresh failed");
        }
      } else {
        // No access token or refresh token, redirect to login
        window.location.href = '/login';
        throw new Error("No access token or refresh token");
      }
    }

    // Add the access token to the request headers
    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await fetch(url, authOptions);

    // Handle token expiration errors (401 Unauthorized)
    if (response.status === 401) {
      accessToken = await refreshAccessToken();
      if (!accessToken) {
        // Token refresh failed, redirect to login (handled in refreshAccessToken)
        throw new Error("Token refresh failed");
      }

      // Retry the request with the new access token
      authOptions.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      return fetch(url, authOptions);
    }

    return response;
  };

  // Check if user is already logged in via session cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = getAccessToken();
        if (accessToken) {
          const response = await authenticatedFetch("/api/user");

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // If the access token is invalid, attempt to refresh it
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              const newResponse = await authenticatedFetch("/api/user");
              if (newResponse.ok) {
                const userData = await newResponse.json();
                setUser(userData);
              } else {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
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
      const userRes = await authenticatedFetch("/api/user");

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
        localStorage.removeItem('access_token'); // Remove access token
        Cookies.remove('refreshToken'); // Remove the refresh token cookie
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
        getAccessToken, // Add getAccessToken to the context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}