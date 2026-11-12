import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_photos?: { url: string; position: number }[];
};

export const AGENCY = {
  name: "Michele Folster",
  tagline: "Imóveis selecionados com atendimento próximo e consultoria exclusiva",
  phone: "(12)98146-7549",
  whatsapp: "5512981467549",
  whatsappMessage: "Olá! Vim pelo site e preciso de ajuda.",
  email: "contato@michelefolster.com",
  creci: "CRECI 168771-F",
  city: "Caçapava",
  state: "SP",
  address: "Caçapava-SP",
  hours: "Atendimento: Seg a Sex, 09h às 17h30",
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
  let supabaseItems: Property[] = [];
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_photos(url, position)")
      .eq("status", "publicado")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) {
      supabaseItems = data as Property[];
    }
  } catch (err) {
    console.warn("Aviso ao buscar propriedades do Supabase:", err);
  }

  // Imóveis ativos diretamente do banco de dados Supabase
  const allProperties = supabaseItems.filter((p) => p.status === "publicado");

  // Aplica filtros sobre a lista completa do Supabase
  let filtered = allProperties;

  if (f.code) {
    const codeTerm = f.code.trim().toUpperCase();
    filtered = filtered.filter((p) => p.code?.toUpperCase().includes(codeTerm));
  }
  if (f.purpose === "venda") {
    filtered = filtered.filter((p) => p.purpose === "venda" || p.purpose === "ambos");
  }
  if (f.purpose === "locacao") {
    filtered = filtered.filter((p) => p.purpose === "locacao" || p.purpose === "ambos");
  }
  if (f.type) {
    filtered = filtered.filter((p) => p.type === f.type);
  }
  if (f.city) {
    const cityTerm = strip(f.city);
    filtered = filtered.filter((p) => strip(p.city || "").includes(cityTerm));
  }
  if (f.neighborhood) {
    const neighTerm = strip(f.neighborhood);
    filtered = filtered.filter((p) => strip(p.neighborhood || "").includes(neighTerm));
  }
  if (f.bedrooms) {
    filtered = filtered.filter((p) => (p.bedrooms ?? 0) >= f.bedrooms!);
  }
  if (f.bathrooms) {
    filtered = filtered.filter((p) => (p.bathrooms ?? 0) >= f.bathrooms!);
  }
  if (f.parking) {
    filtered = filtered.filter((p) => (p.parking ?? 0) >= f.parking!);
  }

  const priceProp = f.purpose === "locacao" ? "rent_price" : "sale_price";
  if (f.minPrice) {
    filtered = filtered.filter((p) => (p[priceProp] ?? 0) >= f.minPrice!);
  }
  if (f.maxPrice) {
    filtered = filtered.filter((p) => (p[priceProp] ?? 0) <= f.maxPrice!);
  }
  if (f.minArea) {
    filtered = filtered.filter(
      (p) => (p.area_built ?? 0) >= f.minArea! || (p.area_land ?? 0) >= f.minArea!
    );
  }
  if (f.maxArea) {
    filtered = filtered.filter((p) => (p.area_built ?? 0) <= f.maxArea!);
  }
  if (f.q) {
    const term = strip(f.q);
    filtered = filtered.filter(
      (p) =>
        strip(p.title || "").includes(term) ||
        strip(p.description || "").includes(term) ||
        strip(p.neighborhood || "").includes(term) ||
        strip(p.city || "").includes(term) ||
        strip(p.code || "").includes(term)
    );
  }

  // Ordenação
  if (f.sort === "menor") {
    filtered.sort((a, b) => (a[priceProp] ?? 0) - (b[priceProp] ?? 0));
  } else if (f.sort === "maior") {
    filtered.sort((a, b) => (b[priceProp] ?? 0) - (a[priceProp] ?? 0));
  } else {
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });
  }

  const page = Math.max(1, f.page ?? 1);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items: paginated, total: filtered.length };
}

export async function fetchLocations() {
  let supabaseItems: Property[] = [];
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("city, neighborhood, state, status")
      .eq("status", "publicado");
    if (!error && data) {
      supabaseItems = data as Property[];
    }
  } catch (err) {
    console.warn("Aviso ao buscar localidades:", err);
  }

  const allProperties = supabaseItems.filter((p) => p.status === "publicado");
  const cities = Array.from(new Set(allProperties.map((d) => d.city).filter(Boolean) as string[])).sort();
  const neighborhoods = Array.from(new Set(allProperties.map((d) => d.neighborhood).filter(Boolean) as string[])).sort();
  return { cities, neighborhoods };
}

export const slugify = (s: string) =>
  strip(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
