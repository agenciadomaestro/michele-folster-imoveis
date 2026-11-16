import { useEffect, useState } from "react";
import { getAgencyClock } from "@/lib/agency-clock";

export function useAgencyClock() {
  const [clock, setClock] = useState(() => ({ year: getAgencyClock().year, isOpen: false }));
  useEffect(() => {
    const update = () => setClock(getAgencyClock());
    update();
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return clock;
}
