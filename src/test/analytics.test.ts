import { describe, expect, it } from "vitest";
import {
  detectTrafficSource,
  formatDuration,
  getPeriodStartDate,
  TRAFFIC_SOURCES,
} from "@/lib/analytics";

describe("Analytics Module Unit Tests", () => {
  it("formats duration correctly for various second intervals", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(-10)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(95)).toBe("1m 35s");
    expect(formatDuration(180)).toBe("3m");
  });

  it("calculates start dates for different period filters", () => {
    const today = getPeriodStartDate("today");
    expect(today).not.toBeNull();

    const d7 = getPeriodStartDate("7d");
    expect(d7).not.toBeNull();
    expect(d7!.getTime()).toBeLessThan(Date.now());

    const d30 = getPeriodStartDate("30d");
    expect(d30).not.toBeNull();
    expect(d30!.getTime()).toBeLessThan(d7!.getTime());

    const all = getPeriodStartDate("all");
    expect(all).toBeNull();
  });

  it("contains all expected traffic source categories", () => {
    expect(TRAFFIC_SOURCES).toContain("Google Meu Negócio");
    expect(TRAFFIC_SOURCES).toContain("Google (Busca)");
    expect(TRAFFIC_SOURCES).toContain("Instagram");
    expect(TRAFFIC_SOURCES).toContain("Facebook");
    expect(TRAFFIC_SOURCES).toContain("WhatsApp");
    expect(TRAFFIC_SOURCES).toContain("Meta Ads");
    expect(TRAFFIC_SOURCES).toContain("Acesso Direto");
  });

  it("defaults to Acesso Direto when no params or referrers exist", () => {
    expect(detectTrafficSource()).toBe("Acesso Direto");
  });
});
