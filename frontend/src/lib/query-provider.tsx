"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "./api/axios-instance";

// Create a custom fetch function with auth
const createAuthenticatedFetch = (getToken: () => Promise<string | null>) => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...options.headers,
    };

    // Add auth header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete (headers as any)["Content-Type"]; // Let browser set boundary
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      // Parse error response
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();

        // Handle standardized error format
        if (errorData.status === "error" && errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        } else if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail[0]?.msg || errorData.detail[0] || errorMessage
            : errorData.detail;
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response;
  };
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  // Set up the token getter for the Axios instance used by generated hooks
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (
                error.message.includes("401") ||
                error.message.includes("Unauthorized")
              ) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (
                error.message.includes("401") ||
                error.message.includes("Unauthorized")
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Custom hook to get authenticated fetch function (for backward compatibility)
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();
  return createAuthenticatedFetch(getToken);
}
