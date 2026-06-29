"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveClientProvider } from "@/components/active-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 10_000,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ActiveClientProvider>{children}</ActiveClientProvider>
    </QueryClientProvider>
  );
}
