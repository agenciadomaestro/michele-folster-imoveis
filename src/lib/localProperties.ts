import type { Property } from "./realty";

const STORAGE_KEY = "app_custom_properties";
const DELETED_KEY = "app_deleted_properties";

export function getLocalProperties(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalProperty(prop: Property): Property {
  if (typeof window === "undefined") return prop;
  try {
    const current = getLocalProperties();
    const existingIndex = current.findIndex(
      (p) =>
        p.id === prop.id ||
        (Boolean(prop.code) && Boolean(p.code) && p.code.toUpperCase() === prop.code.toUpperCase())
    );

    let updated: Property[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...current[existingIndex],
        ...prop,
        updated_at: new Date().toISOString(),
      };
    } else {
      updated = [prop, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    removeDeletedPropertyId(prop.id);
  } catch (e) {
    console.warn("Aviso ao salvar imóvel localmente:", e);
  }
  return prop;
}

export function deleteLocalProperty(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalProperties();
    const filtered = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    addDeletedPropertyId(id);
  } catch (e) {
    console.warn("Aviso ao deletar imóvel localmente:", e);
  }
}

export function getDeletedPropertyIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function addDeletedPropertyId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedPropertyIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
    }
  } catch {}
}

function removeDeletedPropertyId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedPropertyIds();
    const filtered = ids.filter((item) => item !== id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(filtered));
  } catch {}
}

export function mergeWithLocalProperties(supabaseProperties: Property[]): Property[] {
  const localList = getLocalProperties();
  const deletedIds = new Set(getDeletedPropertyIds());

  // Filtra itens deletados da lista do Supabase
  const validSupabase = supabaseProperties.filter((p) => !deletedIds.has(p.id));

  if (localList.length === 0) return validSupabase;

  // Cria mapas de busca para propriedades locais
  const localMap = new Map<string, Property>();
  for (const lp of localList) {
    if (deletedIds.has(lp.id)) continue;
    if (lp.id) localMap.set(lp.id, lp);
    if (lp.code) localMap.set(lp.code.toUpperCase(), lp);
  }

  // Mescla: versão local sobrescreve versão do Supabase caso o ID ou Código coincidam
  const result: Property[] = [];
  const usedLocalIds = new Set<string>();

  for (const sp of validSupabase) {
    const override = localMap.get(sp.id) || (sp.code ? localMap.get(sp.code.toUpperCase()) : undefined);
    if (override) {
      result.push(override);
      usedLocalIds.add(override.id);
      if (override.code) usedLocalIds.add(override.code.toUpperCase());
    } else {
      result.push(sp);
    }
  }

  // Adiciona propriedades locais que não existem no Supabase (no topo da lista)
  for (const lp of localList) {
    if (deletedIds.has(lp.id)) continue;
    if (!usedLocalIds.has(lp.id) && (!lp.code || !usedLocalIds.has(lp.code.toUpperCase()))) {
      result.unshift(lp);
      usedLocalIds.add(lp.id);
    }
  }

  return result;
}

