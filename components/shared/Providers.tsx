"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import PincodeModal from "@/components/shared/PincodeModal";
import { usePincodeStore, useSettingsStore } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const initializePincode = usePincodeStore((state) => state.initializePincode);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    initializePincode();
    fetchSettings();
  }, [initializePincode, fetchSettings]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes stale time
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <PincodeModal />
      </QueryClientProvider>
    </SessionProvider>
  );
}
