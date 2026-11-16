import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const REALTIME_TABLES = [
  "properties",
  "property_photos",
  "profiles",
  "leads",
  "user_roles",
  "broker_permissions",
] as const;
export function useAgencyRealtime(queryClient: QueryClient) {
  useEffect(() => {
    const channel = supabase.channel(`agency-${crypto.randomUUID()}`);
    for (const table of REALTIME_TABLES)
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        void queryClient.invalidateQueries();
      });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") void queryClient.invalidateQueries();
    });
    const catalog = supabase
      .channel("agency-catalog", { config: { private: true } })
      .on("broadcast", { event: "catalog_changed" }, () => {
        void queryClient.invalidateQueries();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(catalog);
    };
  }, [queryClient]);
}
