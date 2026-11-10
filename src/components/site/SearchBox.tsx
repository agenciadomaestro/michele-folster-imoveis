import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Hash, SlidersHorizontal, Sparkles, MapPin, Home, BedDouble, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchLocations, parseTextQuery, PROPERTY_TYPES } from "@/lib/realty";

type Mode = "filtros" | "codigo" | "texto";

export function SearchBox() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("filtros");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [f, setF] = useState({ purpose: "", type: "", city: "", bedrooms: "", maxPrice: "" });
  const { data: loc } = useQuery({ queryKey: ["locations"], queryFn: fetchLocations });

  const goCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) {
      toast.error("Por favor, digite o código de referência (ex: CA0531).");
      return;
    }

    // Consulta direta no Supabase
    try {
      const { data } = await supabase
        .from("properties")
        .select("code")
        .ilike("code", c)
        .eq("status", "publicado")
        .maybeSingle();

      if (data) {
        navigate({ to: "/imovel/$code", params: { code: data.code } });
        return;
      }
    } catch {}

    toast.error(`Nenhum imóvel disponível com o código "${c}".`);
  };

  const goFilters = () =>
    navigate({
      to: "/imoveis",
      search: {
        purpose: (f.purpose || undefined) as "venda" | "locacao" | undefined,
        type: f.type || undefined,
        city: f.city || undefined,
        bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
        maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
      },
    });

  const goText = () => {
    if (!text.trim()) {
      navigate({ to: "/imoveis" });
      return;
    }
    const { filters, rest } = parseTextQuery(text, loc?.cities);
    navigate({ to: "/imoveis", search: { ...filters, q: rest || undefined } });
  };

  const tabs: { id: Mode; label: string; icon: typeof Search }[] = [
    { id: "filtros", label: "Buscar por Filtros", icon: SlidersHorizontal },
    { id: "texto", label: "Busca Inteligente", icon: Sparkles },
    { id: "codigo", label: "Buscar por Código", icon: Hash },
  ];

  return (
    <div className="rounded-[24px] border border-border/80 bg-card/98 p-3 shadow-[0_20px_50px_-15px_oklch(0.53_0.17_292/18%)] backdrop-blur-xl md:p-5">
      {/* Search Mode Tabs */}
      <div className="flex gap-1.5 rounded-2xl bg-secondary/80 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
              mode === t.id
                ? "bg-background text-primary shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            }`}
          >
            <t.icon className="size-4 shrink-0" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "codigo") goCode();
          else if (mode === "texto") goText();
          else goFilters();
        }}
      >
        {mode === "filtros" && (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[repeat(5,1fr)_auto]">
            {/* Finalidade */}
            <div>
              <label className="sr-only">Finalidade</label>
              <select
                className="field font-medium text-xs sm:text-sm"
                value={f.purpose}
                onChange={(e) => setF({ ...f, purpose: e.target.value })}
                aria-label="Finalidade"
              >
                <option value="">Comprar ou Alugar</option>
                <option value="venda">Comprar (Venda)</option>
                <option value="locacao">Alugar (Locação)</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="sr-only">Tipo de Imóvel</label>
              <select
                className="field font-medium text-xs sm:text-sm"
                value={f.type}
                onChange={(e) => setF({ ...f, type: e.target.value })}
                aria-label="Tipo"
              >
                <option value="">Todos os Tipos</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="sr-only">Cidade</label>
              <select
                className="field font-medium text-xs sm:text-sm"
                value={f.city}
                onChange={(e) => setF({ ...f, city: e.target.value })}
                aria-label="Cidade"
              >
                <option value="">Todas as Cidades</option>
                {loc?.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Quartos */}
            <div>
              <label className="sr-only">Quartos</label>
              <select
                className="field font-medium text-xs sm:text-sm"
                value={f.bedrooms}
                onChange={(e) => setF({ ...f, bedrooms: e.target.value })}
                aria-label="Quartos"
              >
                <option value="">Quartos (Qualquer)</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}+ {n === 1 ? "quarto" : "quartos"}
                  </option>
                ))}
              </select>
            </div>

            {/* Preço Máximo */}
            <div>
              <label className="sr-only">Preço Máximo</label>
              <input
                className="field font-medium text-xs sm:text-sm"
                inputMode="numeric"
                placeholder="Preço máximo (R$)"
                value={f.maxPrice}
                onChange={(e) => setF({ ...f, maxPrice: e.target.value.replace(/\D/g, "") })}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary h-11 w-full gap-2 px-6 shadow-md shadow-primary/20 hover:shadow-lg sm:col-span-2 lg:col-span-1"
            >
              <Search className="size-4 shrink-0" />
              <span>Buscar Imóveis</span>
            </button>
          </div>
        )}

        {mode === "texto" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                className="field pl-4 pr-10 text-sm"
                placeholder="Ex: Apartamento com 3 quartos vista mar em Florianópolis"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary h-11 px-8 gap-2 shrink-0">
              <Search className="size-4" />
              <span>Buscar</span>
            </button>
          </div>
        )}

        {mode === "codigo" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                className="field font-mono uppercase tracking-wider text-sm pl-4"
                placeholder="Digite o código (ex: CA0531, AP0214)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary h-11 px-8 gap-2 shrink-0">
              <Search className="size-4" />
              <span>Localizar Imóvel</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
