import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const redirectToLogin = () => {
  console.warn("[apiRequest] Redirecting to login.");
  localStorage.removeItem("access_token");
  window.location.href = "/login";
  throw new Error("Session expired or missing. Redirecting to login.");
};

const getAccessToken = (): string => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    redirectToLogin();
    throw new Error("Missing token");
  }
  return token;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Internal function for retrying request
  const makeRequest = async (accessToken?: string): Promise<Response> => {
    const headers: Record<string, string> = {};

    if (data) {
      headers["Content-Type"] = "application/json";
    }

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // to send refresh token via cookie
    });

    return res;
  };

  
  let accessToken = getAccessToken();

  let res = await makeRequest(accessToken);

  // Handle access token expiration
  if (res.status === 401 || res.status === 403) {
    console.warn(`[apiRequest] Access token might be expired. Attempting refresh...`);

    const refreshRes = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      try {
        const json = await refreshRes.json();
        const newAccessToken = typeof json.access_token === "string" ? json.access_token : null;

        if (!newAccessToken) {
          redirectToLogin();
          throw new Error("Invalid access_token in refresh response");
        }

        // Store and retry original request with new token
        localStorage.setItem("access_token", newAccessToken);
        res = await makeRequest(newAccessToken);

        if (!res.ok) await throwIfResNotOk(res);
        return res;
      } catch (err) {
        console.error(`[apiRequest] Failed to parse refresh response`, err);
      }
    }

    // ❌ Refresh failed → redirect to login
    console.warn(`[apiRequest] Refresh failed. Redirecting to login.`);
    localStorage.removeItem("access_token");
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login.");
  }

  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Important for sending cookies
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
