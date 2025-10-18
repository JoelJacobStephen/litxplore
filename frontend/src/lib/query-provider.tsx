"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "./api/axios-instance";

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
