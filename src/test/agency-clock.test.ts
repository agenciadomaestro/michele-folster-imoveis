import { describe, expect, it } from "vitest";
import { getAgencyClock } from "@/lib/agency-clock";

describe("Agency schedule in São Paulo", () => {
  it.each([
    ["2026-11-09", "Monday"], ["2026-11-10", "Tuesday"],
    ["2026-11-11", "Wednesday"], ["2026-11-12", "Thursday"], ["2026-11-13", "Friday"],
  ])("opens at 09h and closes at 17h30 on %s (%s)", (day) => {
    expect(getAgencyClock(new Date(`${day}T11:59:59Z`)).isOpen).toBe(false);
    expect(getAgencyClock(new Date(`${day}T12:00:00Z`)).isOpen).toBe(true);
    expect(getAgencyClock(new Date(`${day}T20:29:59Z`)).isOpen).toBe(true);
    expect(getAgencyClock(new Date(`${day}T20:30:00Z`)).isOpen).toBe(false);
  });
  it("stays closed on Saturday and Sunday", () => {
    expect(getAgencyClock(new Date("2026-11-14T15:00:00Z")).isOpen).toBe(false);
    expect(getAgencyClock(new Date("2026-11-15T15:00:00Z")).isOpen).toBe(false);
  });
  it("updates the footer year when the year changes in São Paulo", () => {
    expect(getAgencyClock(new Date("2027-01-01T02:59:59Z")).year).toBe(2026);
    expect(getAgencyClock(new Date("2027-01-01T03:00:00Z")).year).toBe(2027);
  });
});