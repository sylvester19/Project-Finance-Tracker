import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { User, UserRoleType } from "@shared/schema";
import { useLocation } from "wouter";
import { DecodedToken } from "utils/jwt";


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  authenticatedFetch: (method: string, url: string, options?: RequestInit) => Promise<Response>;
  isTokenExpired: (token: string | null) => boolean; // Add isTokenExpired function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getAccessToken: () => null,
  authenticatedFetch: async () => { throw new Error("authenticatedFetch not implemented"); },
  isTokenExpired: (token) => false // Default implementation for isTokenExpired
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);  
  const [, navigate] = useLocation();

  const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  // Function to check if token is expired
  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true; // No token means expired
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
      return decoded.exp < currentTime; // Compare expiration time with current time
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (isRefreshingToken) {
      console.log("Already refreshing token, returning null.");
      return null; // Prevent concurrent refresh requests
    }

    setIsRefreshingToken(true);
    console.log("Refreshing access token...");

    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.log("Refresh token expired or invalid, redirecting to login...");
          localStorage.removeItem('access_token');
          setUser(null);
          navigate("/login");// Redirect to login page
          return null;
        }
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;
      localStorage.setItem('access_token', newAccessToken);
      console.log("New access token obtained:", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const authenticatedFetch = async (method: string, url: string, options: RequestInit = {}): Promise<Response> => {
    let accessToken = getAccessToken();

    if (!accessToken || isTokenExpired(accessToken)) {
      console.log("Access token expired or not present, attempting to refresh...");
      
      accessToken = await refreshAccessToken();
      if (!accessToken) {
        throw new Error("Token refresh failed");
      }
    }

    const authOptions: RequestInit = {
      ...options,
      method,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let response = await fetch(url, authOptions);

    if (response.status === 401) {
      console.log("Received 401, retrying with a refreshed token...");
      accessToken = await refreshAccessToken();
      if (!accessToken) {
        throw new Error("Token refresh failed");
      }

      authOptions.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      response = await fetch(url, authOptions);
    }

    return response;
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        let accessToken = getAccessToken();
        if (!accessToken || isTokenExpired(accessToken)) {
          console.log("Access token expired or invalid, attempting refresh...");
          accessToken = await refreshAccessToken(); // 🧠 This is the key fix
        }
  
        if (accessToken) {
          const decoded = jwtDecode<DecodedToken>(accessToken);
          setUser({
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            role: decoded.role,
          });
        } else {
          console.log("Unable to refresh token. User is not authenticated.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const accessToken = data.accessToken;
      localStorage.setItem('access_token', accessToken);

      const decoded = jwtDecode<DecodedToken>(accessToken);
      setUser({
        id: decoded.id,
        username: decoded.username,
        name: decoded.name,
        role: decoded.role,
      });
    } catch (error) {
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem('access_token');
        setUser(null);
        navigate("/login");
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
        getAccessToken,
        authenticatedFetch,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
