import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  trackAnalyticsEvent,
  updateAnalyticsDuration,
  type AnalyticsEventType,
} from "@/lib/analytics";

/**
 * Hook silencioso para rastrear visitas e tempo de permanência no site público.
 */
export function useSiteAnalytics() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentRecordIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Não rastreia rotas do painel administrativo
    if (typeof window === "undefined" || currentPath.startsWith("/admin")) {
      return;
    }

    startTimeRef.current = Date.now();
    let isMounted = true;
    let localRecordId: string | null = null;

    // Registra page_view de forma silenciosa
    trackAnalyticsEvent({
      eventType: "page_view",
      pagePath: currentPath,
    }).then((id) => {
      if (isMounted && id) {
        localRecordId = id;
        currentRecordIdRef.current = id;
      }
    });

    const updateDuration = () => {
      const activeId = localRecordId || currentRecordIdRef.current;
      if (!activeId) return;
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsedSeconds > 0) {
        updateAnalyticsDuration(activeId, elapsedSeconds);
      }
    };

    // Atualização periódica a cada 15 segundos
    const interval = setInterval(updateDuration, 15000);

    // Atualização quando a aba perde foco ou a página é descarregada
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateDuration();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", updateDuration);
    window.addEventListener("beforeunload", updateDuration);

    return () => {
      isMounted = false;
      updateDuration();
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", updateDuration);
      window.removeEventListener("beforeunload", updateDuration);
    };
  }, [currentPath]);

  const trackEvent = (eventType: AnalyticsEventType, propertyId?: string | null) => {
    trackAnalyticsEvent({
      eventType,
      pagePath: currentPath,
      propertyId,
    });
  };

  return {
    trackEvent,
    trackPropertyView: (propId: string) => trackEvent("property_view", propId),
    trackPhotoSwipe: (propId: string) => trackEvent("photo_swipe", propId),
    trackWhatsappClick: (propId?: string | null) => trackEvent("whatsapp_click", propId),
  };
}
