import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_photos?: { url: string; position: number }[];
};

export const AGENCY = {
  name: "Michele Folster",
  tagline: "Imóveis selecionados com atendimento próximo e consultoria exclusiva",
  phone: "(12)98146-77549",
  whatsapp: "55129814677549",
  whatsappMessage: "Olá! Vim pelo site e preciso de ajuda.",
  email: "contato@michelefolster.com.br",
  creci: "CRECI 38.412-J",
  city: "Caçapava",
  state: "SP",
  address: "Caçapava-SP",
  hours: "Atendimento: Seg a Sex, 09h às 17h30h",
  instagram: "@michelefolsterimoveis",
};

export const getWhatsappUrl = (customMsg?: string) => {
  const msg = customMsg || AGENCY.whatsappMessage;
  return `https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent(msg)}`;
};

export const PROPERTY_TYPES = [
  "Casa", "Apartamento", "Terreno", "Sobrado", "Chácara", "Sítio",
  "Sala comercial", "Galpão", "Prédio comercial", "Outros",
];

export const PURPOSE_LABEL: Record<string, string> = {
  venda: "Venda",
  locacao: "Locação",
  ambos: "Venda e locação",
};

export const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  vendido: "Vendido",
  alugado: "Alugado",
  arquivado: "Arquivado",
};

export const LEAD_STATUS: Record<string, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  visita_agendada: "Visita agendada",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const brl = (v?: number | null) =>
  v == null ? "" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function priceLabel(p: Pick<Property, "sale_price" | "rent_price" | "purpose">) {
  if (p.purpose === "locacao" && p.rent_price) return `${brl(p.rent_price)}/mês`;
  if (p.sale_price) return brl(p.sale_price);
  if (p.rent_price) return `${brl(p.rent_price)}/mês`;
  return "Consulte";
}

export const coverOf = (p: Property) =>
  [...(p.property_photos ?? [])].sort((a, b) => a.position - b.position)[0]?.url;

export type SearchFilters = {
  q?: string | undefined;
  code?: string | undefined;
  purpose?: "venda" | "locacao" | undefined;
  type?: string | undefined;
  city?: string | undefined;
  neighborhood?: string | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  parking?: number | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minArea?: number | undefined;
  maxArea?: number | undefined;
  sort?: "recentes" | "menor" | "maior" | undefined;
  page?: number | undefined;
};

const NUM_WORDS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, "três": 3, quatro: 4, cinco: 5 };
const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Converts free text like "casa com dois quartos em Caçapava" into structured filters. */
export function parseTextQuery(text: string, cities: string[] = []): { filters: SearchFilters; rest: string } {
  const filters: SearchFilters = {};
  let rest = text.trim();
  const norm = strip(rest);

  const code = rest.match(/\b([A-Za-z]{2}\d{3,5})\b/);
  if (code) { filters.code = (code[1] ?? "").toUpperCase(); rest = rest.replace(code[0], ""); }

  for (const t of PROPERTY_TYPES) {
    if (new RegExp(`\\b${strip(t)}s?\\b`).test(norm)) { filters.type = t; rest = rest.replace(new RegExp(t + "s?", "i"), ""); break; }
  }
  if (/\b(alugar|aluguel|locacao)\b/.test(norm)) filters.purpose = "locacao";
  else if (/\b(comprar|venda|compra)\b/.test(norm)) filters.purpose = "venda";

  const rooms = norm.match(/(\d+|um|uma|dois|duas|tres|quatro|cinco)\s+(quartos?|dormitorios?)/);
  if (rooms) filters.bedrooms = Number(rooms[1]) || NUM_WORDS[rooms[1] ?? ""];
  const baths = norm.match(/(\d+|um|uma|dois|duas|tres|quatro)\s+banheiros?/);
  if (baths) filters.bathrooms = Number(baths[1]) || NUM_WORDS[baths[1] ?? ""];
  const vagas = norm.match(/(\d+|uma|duas|tres)\s+vagas?/);
  if (vagas) filters.parking = Number(vagas[1]) || NUM_WORDS[vagas[1] ?? ""];

  for (const c of cities) {
    if (norm.includes(strip(c))) { filters.city = c; break; }
  }
  if (!filters.city) {
    const em = rest.match(/\b(?:em|no|na)\s+([A-ZÀ-Ú][\wÀ-ú]+(?:\s[A-ZÀ-Ú][\wÀ-ú]+)*)/);
    if (em?.[1]) filters.city = em[1];
  }

  rest = strip(rest)
    .replace(/\b(\d+|um|uma|dois|duas|tres|quatro|cinco)\s+(quartos?|dormitorios?|banheiros?|vagas?)\b/g, "")
    .replace(/\b(com|em|no|na|de|para|alugar|aluguel|comprar|venda|e)\b/g, "")
    .replace(filters.city ? strip(filters.city) : "\u0000", "")
    .replace(/\s+/g, " ")
    .trim();
  return { filters, rest };
}

export const PAGE_SIZE = 9;

export async function searchProperties(f: SearchFilters) {
  let q = supabase
    .from("properties")
    .select("*, property_photos(url, position)", { count: "exact" })
    .eq("status", "publicado");
  if (f.code) q = q.ilike("code", f.code);
  if (f.purpose === "venda") q = q.in("purpose", ["venda", "ambos"]);
  if (f.purpose === "locacao") q = q.in("purpose", ["locacao", "ambos"]);
  if (f.type) q = q.eq("type", f.type);
  if (f.city) q = q.ilike("city", `%${f.city}%`);
  if (f.neighborhood) q = q.ilike("neighborhood", `%${f.neighborhood}%`);
  if (f.bedrooms) q = q.gte("bedrooms", f.bedrooms);
  if (f.bathrooms) q = q.gte("bathrooms", f.bathrooms);
  if (f.parking) q = q.gte("parking", f.parking);
  const priceCol = f.purpose === "locacao" ? "rent_price" : "sale_price";
  if (f.minPrice) q = q.gte(priceCol, f.minPrice);
  if (f.maxPrice) q = q.lte(priceCol, f.maxPrice);
  if (f.minArea) q = q.or(`area_built.gte.${f.minArea},area_land.gte.${f.minArea}`);
  if (f.maxArea) q = q.lte("area_built", f.maxArea);
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,neighborhood.ilike.%${term}%`);
  }
  if (f.sort === "menor") q = q.order(priceCol, { ascending: true, nullsFirst: false });
  else if (f.sort === "maior") q = q.order(priceCol, { ascending: false, nullsFirst: false });
  else q = q.order("featured", { ascending: false }).order("created_at", { ascending: false });
  const page = Math.max(1, f.page ?? 1);
  q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await q;
  if (error) throw error;
  return { items: (data ?? []) as Property[], total: count ?? 0 };
}

export async function fetchLocations() {
  const { data, error } = await supabase.from("properties").select("city, neighborhood, state").eq("status", "publicado");
  if (error) throw error;
  const cities = Array.from(new Set((data ?? []).map((d) => d.city))).sort();
  const neighborhoods = Array.from(new Set((data ?? []).map((d) => d.neighborhood).filter(Boolean) as string[])).sort();
  return { cities, neighborhoods };
}

export const slugify = (s: string) =>
  strip(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
