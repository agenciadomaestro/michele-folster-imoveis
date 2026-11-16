import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "drizzle/migrations/0006_isolate_capture_uploads_and_staff_image_reads.sql",
  "utf8",
);
const upload = readFileSync("src/lib/capture-upload.functions.ts", "utf8");
const form = readFileSync("src/routes/anuncie.tsx", "utf8");

describe("Selected storage policy regressions", () => {
  it("removes unrestricted client capture inserts rather than requiring visitor login", () => {
    expect(migration).toContain('DROP POLICY "capture upload"');
    expect(migration).not.toMatch(/CREATE POLICY "capture upload"/);
    expect(form).toContain("uploadToSignedUrl(path,token,blob");
    expect(form).not.toContain("from('captacoes').upload(");
  });

  it("issues a non-overwriting capability for a server-generated path only", () => {
    expect(upload).toContain("crypto.randomUUID()");
    expect(upload).toContain(".createSignedUploadUrl(path, { upsert: false })");
    expect(upload).not.toContain("inputValidator");
    expect(upload).toContain("await import('@/integrations/supabase/client.server')");
  });

  it("requires active staff and assigned-property or explicit global permission for direct reads", () => {
    expect(migration).toContain("public.is_staff((SELECT auth.uid()))");
    expect(migration).toContain("p.broker_id=(SELECT auth.uid())");
    expect(migration).toContain("public.can_view_all((SELECT auth.uid()))");
    expect(migration).not.toContain("status='publicado'");
  });

  it("leaves published photo serving behind anonymous photo visibility checks", () => {
    const handler = readFileSync("src/routes/api/public/property-image.ts", "utf8");
    expect(handler.indexOf("from('property_photos')")).toBeLessThan(
      handler.indexOf("await import('@/integrations/supabase/client.server')"),
    );
    expect(handler).toContain("if (error || !photo) return new Response('Not found'");
  });
});
