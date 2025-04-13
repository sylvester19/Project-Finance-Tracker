import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let subscribers: ((token: string | null) => void)[] = [];

function subscribeToTokenRefresh(cb: (token: string | null) => void) {
  subscribers.push(cb);
}

function notifySubscribers(token: string | null) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include", // so cookies (refreshToken) are sent
    });

    if (!res.ok) throw new Error("Failed to refresh");

    const data = await res.json();
    localStorage.setItem("access_token", data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.error("🔒 Refresh failed:", err);
    localStorage.removeItem("access_token");
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const attemptRequest = async (token: string | null) => {
    const headers: Record<string, string> = {};

    if (data) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    return res;
  };

  let token = localStorage.getItem("access_token");
  let res = await attemptRequest(token);

  if (res.status !== 403) {
    await throwIfResNotOk(res);
    return res;
  }

  // We got 403, so access token might be expired
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken();
    const newToken = await refreshPromise;
    isRefreshing = false;
    notifySubscribers(newToken);
  }

  // Wait for the token refresh to complete
  const newToken = await new Promise<string | null>((resolve) => {
    subscribeToTokenRefresh(resolve);
  });

  if (!newToken) {
    // Refresh failed, logout or redirect
    throw new Error("Session expired. Please login again.");
  }

  // Retry the original request
  res = await attemptRequest(newToken);
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
