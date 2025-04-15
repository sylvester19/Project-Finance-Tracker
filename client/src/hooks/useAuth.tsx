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
  authenticatedFetch: (method: string, url: string, options?: RequestInit) => Promise<Response>; // Add authenticatedFetch to the context
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getAccessToken: () => null, // Initialize getAccessToken,
  authenticatedFetch: async () => { throw new Error("authenticatedFetch not implemented"); } // Provide a default implementation
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);  

  const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<string | null> => {
    if (isRefreshingToken) {
      return null; // Prevent concurrent refresh requests
    }

    setIsRefreshingToken(true);

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
          localStorage.removeItem('access_token'); // Remove access token
          setUser(null); // Clear user data
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
    }   finally {
      setIsRefreshingToken(false);
    }
  };

  // Custom fetch function with automatic token refresh
  const authenticatedFetch = async (method: string, url: string,  options: RequestInit = {}): Promise<Response> => {
    let accessToken = getAccessToken();

    if (!accessToken) {
        // If no access token, check for refresh token and attempt to refresh
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
            // No access token or refresh token, redirect to login
            window.location.href = '/login';
            throw new Error("No access token or refresh token");
        }

        accessToken = await refreshAccessToken();
        if (!accessToken) {
            // Token refresh failed, redirect to login (handled in refreshAccessToken)
            throw new Error("Token refresh failed");
        }
    }

    // Add the access token to the request headers
    const authOptions: RequestInit = {
        ...options,
        method: method, // Include the method
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    };

    let response = await fetch(url, authOptions);

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
        response = await fetch(url, authOptions); // Re-assign response
    }

    return response;
  };

  // Check if user is already logged in via session cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const accessToken = getAccessToken();
        if (accessToken) {
          // TODO :: User proper backend route to get the data of the user, ("/api/user") is not correct 
          const response = await authenticatedFetch("GET", "/api/user");

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // If the access token is invalid, attempt to refresh it
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              const newResponse = await authenticatedFetch("GET", "/api/user");
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
      const userRes = await authenticatedFetch("GET", "/api/user");

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
        //TODO:: checnk with the backend because it is  also removing the cookie from the browser  
        Cookies.remove('refreshToken'); // Remove the refresh token cookie
        window.location.href = '/login';
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
        authenticatedFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}