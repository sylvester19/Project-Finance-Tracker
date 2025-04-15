import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth hook

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use the fetchWithAuth function from useAuth hook
    const { authenticatedFetch } = useAuth();

    if (!authenticatedFetch) {
      throw new Error("authenticatedFetch is not available. Ensure AuthProvider is wrapping your component.");
    }

    try {
      const res = await authenticatedFetch("GET", queryKey[0] as string);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle errors from authenticatedFetch (e.g., token refresh failed)
      console.error("Error in getQueryFn:", error);
      throw error; // Re-throw the error to be handled by useQuery
    }
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