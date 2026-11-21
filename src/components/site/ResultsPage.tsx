import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PropertyCard, CardSkeleton } from "@/components/site/PropertyCard";
import {
  fetchLocations,
  PAGE_SIZE,
  PROPERTY_TYPES,
  searchProperties,
  type SearchFilters,
} from "@/lib/realty";

export function ResultsPage({
  fixedPurpose,
  title,
}: {
  fixedPurpose?: "venda" | "locacao";
  title?: string;
}) {
  const raw = useSearch({ strict: false }) as SearchFilters;
  const search: SearchFilters = fixedPurpose ? { ...raw, purpose: fixedPurpose } : raw;
  const navigate = useNavigate();
  const set = (patch: Partial<SearchFilters>) =>
    navigate({
      to: fixedPurpose ? (fixedPurpose === "venda" ? "/venda" : "/locacao") : "/imoveis",
      search: { ...raw, ...patch, page: patch.page ?? undefined } as never,
    });

  const { data: loc } = useQuery({ queryKey: ["locations"], queryFn: fetchLocations });
  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["search", search],
    queryFn: () => searchProperties(search),
    placeholderData: keepPreviousData,
  });
  const page = search.page ?? 1;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const hasFilters = Object.entries(raw).some(
    ([k, v]) => k !== "page" && k !== "sort" && v != null && v !== "",
  );

  const numInput = (key: keyof SearchFilters, placeholder: string) => (
    <input
      className="field w-full min-w-0"
      inputMode="numeric"
      placeholder={placeholder}
      defaultValue={(search[key] as number | undefined) ?? ""}
      onBlur={(e) =>
        set({ [key]: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : undefined })
      }
    />
  );

  return (
    <SiteLayout>
      <div className="container-page pt-10">
        <h1 className="text-3xl font-bold">{title ?? "Imóveis"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Carregando..."
            : `${data?.total ?? 0} ${data?.total === 1 ? "imóvel encontrado" : "imóveis encontrados"}`}
          {search.q && <> · termo: “{search.q}”</>}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="panel h-fit space-y-4 p-4 sm:p-5 lg:sticky lg:top-24 w-full max-w-full box-border">
            {!fixedPurpose && (
              <div>
                <label className="label">Finalidade</label>
                <select
                  className="field w-full"
                  value={search.purpose ?? ""}
                  onChange={(e) => set({ purpose: (e.target.value || undefined) as never })}
                >
                  <option value="">Comprar ou alugar</option>
                  <option value="venda">Comprar</option>
                  <option value="locacao">Alugar</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Tipo</label>
              <select
                className="field w-full"
                value={search.type ?? ""}
                onChange={(e) => set({ type: e.target.value || undefined })}
              >
                <option value="">Qualquer</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cidade</label>
              <select
                className="field w-full"
                value={search.city ?? ""}
                onChange={(e) => set({ city: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                {loc?.cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Bairro</label>
              <select
                className="field w-full"
                value={search.neighborhood ?? ""}
                onChange={(e) => set({ neighborhood: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                {loc?.neighborhoods.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["bedrooms", "Quartos"],
                  ["bathrooms", "Banh."],
                  ["parking", "Vagas"],
                ] as const
              ).map(([k, l]) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <select
                    className="field px-2 w-full"
                    value={search[k] ?? ""}
                    onChange={(e) =>
                      set({ [k]: e.target.value ? Number(e.target.value) : undefined })
                    }
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="label">Preço (R$)</label>
              <div className="grid grid-cols-2 gap-2 min-w-0 w-full">
                {numInput("minPrice", "Mín.")}
                {numInput("maxPrice", "Máx.")}
              </div>
            </div>
            <div>
              <label className="label">Área (m²)</label>
              <div className="grid grid-cols-2 gap-2 min-w-0 w-full">
                {numInput("minArea", "Mín.")}
                {numInput("maxArea", "Máx.")}
              </div>
            </div>
            <div>
              <label className="label">Código</label>
              <input
                className="field font-mono uppercase w-full min-w-0"
                defaultValue={search.code ?? ""}
                placeholder="CA0531"
                onBlur={(e) => set({ code: e.target.value.trim() || undefined })}
              />
            </div>
            {hasFilters && (
              <button
                className="btn btn-soft w-full"
                onClick={() =>
                  navigate({
                    to: fixedPurpose
                      ? fixedPurpose === "venda"
                        ? "/venda"
                        : "/locacao"
                      : "/imoveis",
                    search: {} as never,
                  })
                }
              >
                Limpar filtros
              </button>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Ordenar</span>
              <select
                className="field h-10 w-auto min-w-[140px]"
                value={search.sort ?? "recentes"}
                onChange={(e) => set({ sort: e.target.value as never })}
              >
                <option value="recentes">Relevância</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
              </select>
            </div>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <div
                className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}
              >
                {data.items.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <div className="panel flex flex-col items-center p-14 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                  <SearchX className="size-5" />
                </span>
                <p className="mt-4 font-semibold">Nenhum imóvel encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajuste ou limpe os filtros para ver mais opções.
                </p>
              </div>
            )}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1">
                <button
                  className="btn btn-outline size-10 rounded-full p-0"
                  disabled={page <= 1}
                  onClick={() => set({ page: page - 1 })}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => set({ page: i + 1 })}
                    className={`btn size-10 rounded-full p-0 ${page === i + 1 ? "btn-primary" : "btn-ghost"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-outline size-10 rounded-full p-0"
                  disabled={page >= pages}
                  onClick={() => set({ page: page + 1 })}
                  aria-label="Próxima"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
