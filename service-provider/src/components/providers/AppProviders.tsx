"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WebVitalsReporter } from "@/components/providers/WebVitalsReporter";
import { makePortalStore } from "@/store/portal-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [store] = useState(makePortalStore);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              const status = (error as Error & { status?: number }).status;
              return status !== 401 && status !== 403 && failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <WebVitalsReporter />
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}
