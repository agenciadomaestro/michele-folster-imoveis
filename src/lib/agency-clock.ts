const agencyTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  year: "numeric",
  hourCycle: "h23",
});

export function getAgencyClock(date = new Date()) {
  const parts = agencyTime.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  return {
    year: Number(part("year")),
    isOpen: ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(part("weekday")) && minutes >= 9 * 60 && minutes < 17 * 60 + 30,
  };
}