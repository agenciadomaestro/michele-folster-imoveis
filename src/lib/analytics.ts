import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType = "page_view" | "property_view" | "photo_swipe" | "whatsapp_click";

export interface AnalyticsRecord {
  id: string;
  session_id: string;
  event_type: AnalyticsEventType | string;
  page_path: string;
  property_id?: string | null;
  traffic_source: string;
  duration_seconds: number;
  created_at: string;
}

const analyticsClient = supabase;

export type PeriodFilter = "today" | "7d" | "30d" | "all";

export const TRAFFIC_SOURCES = [
  "Google Meu Negócio",
  "Google (Busca)",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Meta Ads",
  "Acesso Direto",
] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

let inMemorySessionId: string | null = null;

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr-session";

  if (inMemorySessionId) return inMemorySessionId;

  try {
    const stored = window.sessionStorage.getItem("mf_analytics_session_id");
    if (stored) {
      inMemorySessionId = stored;
      return stored;
    }
    const newId = crypto.randomUUID();
    window.sessionStorage.setItem("mf_analytics_session_id", newId);
    inMemorySessionId = newId;
    return newId;
  } catch {
    if (!inMemorySessionId) {
      inMemorySessionId = crypto.randomUUID();
    }
    return inMemorySessionId;
  }
}

export function detectTrafficSource(): TrafficSource {
  if (typeof window === "undefined") return "Acesso Direto";

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = (urlParams.get("utm_source") || "").toLowerCase().trim();
    const utmMedium = (urlParams.get("utm_medium") || "").toLowerCase().trim();

    // 1. Meta Ads (Instagram Ads, Facebook Ads, campanhas com utm_medium cpc/paid/ads)
    if (
      utmSource.includes("meta") ||
      utmSource.includes("facebook_ads") ||
      utmSource.includes("fb_ads") ||
      utmSource.includes("ig_ads") ||
      utmSource.includes("instagram_ads") ||
      ((utmSource === "facebook" ||
        utmSource === "instagram" ||
        utmSource === "fb" ||
        utmSource === "ig") &&
        (utmMedium.includes("cpc") || utmMedium.includes("paid") || utmMedium.includes("ads")))
    ) {
      return "Meta Ads";
    }

    // 2. Google Meu Negócio
    if (
      utmSource.includes("gmb") ||
      utmSource.includes("google_my_business") ||
      utmSource.includes("meu_negocio") ||
      utmSource.includes("meunegocio") ||
      utmSource.includes("google_maps") ||
      utmMedium.includes("gmb")
    ) {
      return "Google Meu Negócio";
    }

    // 3. Instagram (Orgânico)
    if (utmSource.includes("instagram") || utmSource === "ig") {
      return "Instagram";
    }

    // 4. Facebook (Orgânico)
    if (utmSource.includes("facebook") || utmSource === "fb") {
      return "Facebook";
    }

    // 5. WhatsApp
    if (utmSource.includes("whatsapp") || utmSource === "wa") {
      return "WhatsApp";
    }

    // 6. Google (Busca) via UTM
    if (utmSource.includes("google")) {
      return "Google (Busca)";
    }

    // 7. Avaliação por document.referrer caso UTM não esteja presente
    const referrer = (document.referrer || "").toLowerCase();
    if (referrer) {
      if (referrer.includes("maps.google") || referrer.includes("business.google")) {
        return "Google Meu Negócio";
      }
      if (referrer.includes("google.")) {
        return "Google (Busca)";
      }
      if (referrer.includes("instagram.com") || referrer.includes("l.instagram.com")) {
        return "Instagram";
      }
      if (
        referrer.includes("facebook.com") ||
        referrer.includes("l.facebook.com") ||
        referrer.includes("fb.com")
      ) {
        return "Facebook";
      }
      if (
        referrer.includes("whatsapp.com") ||
        referrer.includes("api.whatsapp.com") ||
        referrer.includes("web.whatsapp.com")
      ) {
        return "WhatsApp";
      }
    }
  } catch {
    // Silencioso em caso de erro de parsing
  }

  return "Acesso Direto";
}

/**
 * Registra um evento de forma silenciosa na tabela site_analytics.
 * Nunca lança exceções para não interromper a navegação do usuário.
 */
export async function trackAnalyticsEvent(payload: {
  eventType: AnalyticsEventType;
  pagePath?: string | undefined;
  propertyId?: string | null | undefined;
  durationSeconds?: number | undefined;
}): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const path = payload.pagePath || window.location.pathname;

  // Não rastreia rotas internas administrativas da equipe
  if (path.startsWith("/admin")) return null;

  const eventId = crypto.randomUUID();
  const sessionId = getSessionId();
  const trafficSource = detectTrafficSource();

  try {
    const { error } = await analyticsClient.from("site_analytics").insert({
      id: eventId,
      session_id: sessionId,
      event_type: payload.eventType,
      page_path: path,
      property_id: payload.propertyId || null,
      traffic_source: trafficSource,
      duration_seconds: 0,
    });

    if (error) {
      // Falha silenciosa para não degradar a experiência do visitante
      return null;
    }
    return eventId;
  } catch {
    return null;
  }
}

/**
 * Atualiza silenciosamente os segundos de permanência de um evento de page_view.
 */
export async function updateAnalyticsDuration(eventId: string, seconds: number): Promise<void> {
  if (!eventId || seconds <= 0) return;

  try {
    await analyticsClient.rpc("update_analytics_duration", {
      _id: eventId,
      _seconds: Math.round(seconds),
    });
  } catch {
    // Falha silenciosa
  }
}

export interface AnalyticsSummary {
  totalVisits: number;
  averageDurationSeconds: number;
  totalPhotosViewed: number;
  totalWhatsappClicks: number;
  trafficSources: {
    source: TrafficSource;
    count: number;
    percentage: number;
  }[];
  topProperties: {
    propertyId: string;
    viewsCount: number;
    photoSwipesCount: number;
    whatsappClicksCount: number;
  }[];
}

export function getPeriodStartDate(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  }
  if (period === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

export async function fetchAnalyticsData(period: PeriodFilter): Promise<AnalyticsSummary> {
  try {
    let query = analyticsClient.from("site_analytics").select("*");

    const startDate = getPeriodStartDate(period);
    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        totalVisits: 0,
        averageDurationSeconds: 0,
        totalPhotosViewed: 0,
        totalWhatsappClicks: 0,
        trafficSources: TRAFFIC_SOURCES.map((source) => ({ source, count: 0, percentage: 0 })),
        topProperties: [],
      };
    }

    const records = data as AnalyticsRecord[];

    const pageViews = records.filter((r) => r.event_type === "page_view");
    const totalVisits = pageViews.length;

    // Tempo médio de permanência dos page_views
    const totalDuration = pageViews.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
    const averageDurationSeconds = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;

    const totalPhotosViewed = records.filter((r) => r.event_type === "photo_swipe").length;
    const totalWhatsappClicks = records.filter((r) => r.event_type === "whatsapp_click").length;

    // Origens de tráfego (baseado nos page_views)
    const sourceCounts: Record<string, number> = {};
    TRAFFIC_SOURCES.forEach((s) => {
      sourceCounts[s] = 0;
    });

    pageViews.forEach((pv) => {
      const src = pv.traffic_source || "Acesso Direto";
      const current = sourceCounts[src] ?? 0;
      sourceCounts[src] = current + 1;
    });

    const trafficSources = TRAFFIC_SOURCES.map((source) => {
      const count = sourceCounts[source] || 0;
      const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
      return { source, count, percentage };
    }).sort((a, b) => b.count - a.count);

    // Ranking de Imóveis Mais Vistos
    const propertyMap: Record<
      string,
      { viewsCount: number; photoSwipesCount: number; whatsappClicksCount: number }
    > = {};

    records.forEach((r) => {
      const pid = r.property_id;
      if (!pid) return;
      let entry = propertyMap[pid];
      if (!entry) {
        entry = { viewsCount: 0, photoSwipesCount: 0, whatsappClicksCount: 0 };
        propertyMap[pid] = entry;
      }
      if (
        r.event_type === "property_view" ||
        (r.event_type === "page_view" && r.page_path.includes("/imovel/"))
      ) {
        entry.viewsCount += 1;
      } else if (r.event_type === "photo_swipe") {
        entry.photoSwipesCount += 1;
      } else if (r.event_type === "whatsapp_click") {
        entry.whatsappClicksCount += 1;
      }
    });

    const topProperties = Object.entries(propertyMap)
      .map(([propertyId, stats]) => ({
        propertyId,
        viewsCount: stats.viewsCount,
        photoSwipesCount: stats.photoSwipesCount,
        whatsappClicksCount: stats.whatsappClicksCount,
      }))
      .sort((a, b) => b.viewsCount - a.viewsCount);

    return {
      totalVisits,
      averageDurationSeconds,
      totalPhotosViewed,
      totalWhatsappClicks,
      trafficSources,
      topProperties,
    };
  } catch {
    return {
      totalVisits: 0,
      averageDurationSeconds: 0,
      totalPhotosViewed: 0,
      totalWhatsappClicks: 0,
      trafficSources: TRAFFIC_SOURCES.map((source) => ({ source, count: 0, percentage: 0 })),
      topProperties: [],
    };
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
}
