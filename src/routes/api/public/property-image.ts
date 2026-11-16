import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export const Route = createFileRoute("/api/public/property-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path");
        if (!path || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(path))
          return new Response("Not found", { status: 404 });
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const url = process.env["SUPABASE_URL"];
        if (!key || !url) return new Response("Unavailable", { status: 503 });
        const publicClient = createClient<Database>(url, key, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
                headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });
        const { data: photo, error } = await publicClient
          .from("property_photos")
          .select("id")
          .eq("storage_path", path)
          .limit(1)
          .maybeSingle();
        if (error || !photo) return new Response("Not found", { status: 404 });
        // Only a photo that anon RLS can read may be served from private storage.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error: downloadError } = await supabaseAdmin.storage
          .from("property-images")
          .download(path);
        if (downloadError || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
