import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Hash, SlidersHorizontal, Sparkles } from "lucide-react";
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
    if (!c) return;
    const { data } = await supabase.from("properties").select("code").ilike("code", c).eq("status", "publicado").maybeSingle();
    if (data) navigate({ to: "/imovel/$code", params: { code: data.code } });
    else toast.error(`Nenhum imóvel disponível com o código ${c}.`);
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
    const { filters, rest } = parseTextQuery(text, loc?.cities);
    navigate({ to: "/imoveis", search: { ...filters, q: rest || undefined } });
  };

  const tabs: { id: Mode; label: string; icon: typeof Search }[] = [
    { id: "filtros", label: "Filtros", icon: SlidersHorizontal },
    { id: "texto", label: "Descreva", icon: Sparkles },
    { id: "codigo", label: "Código", icon: Hash },
  ];

  return (
    <div className="panel p-3 shadow-[var(--shadow-lift)] md:p-4">
      <div className="flex gap-1 rounded-2xl bg-secondary p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors ${mode === t.id ? "bg-background text-primary shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "codigo") goCode();
          else if (mode === "texto") goText();
          else goFilters();
        }}
      >
        {mode === "filtros" && (
          <div className="grid gap-2 md:grid-cols-[repeat(5,1fr)_auto]">
            <select className="field" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} aria-label="Finalidade">
              <option value="">Comprar ou alugar</option>
              <option value="venda">Comprar</option>
              <option value="locacao">Alugar</option>
            </select>
            <select className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Tipo">
              <option value="">Qualquer tipo</option>
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="field" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} aria-label="Cidade">
              <option value="">Todas as cidades</option>
              {loc?.cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="field" value={f.bedrooms} onChange={(e) => setF({ ...f, bedrooms: e.target.value })} aria-label="Quartos">
              <option value="">Quartos</option>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ quartos</option>)}
            </select>
            <input className="field" inputMode="numeric" placeholder="Preço máximo" value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value.replace(/\D/g, "") })} />
            <button className="btn btn-primary"><Search className="size-4" /> Buscar</button>
          </div>
        )}
        {mode === "texto" && (
          <div className="flex gap-2">
            <input className="field" placeholder="Ex.: casa com dois quartos em Florianópolis" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-primary"><Search className="size-4" /> Buscar</button>
          </div>
        )}
        {mode === "codigo" && (
          <div className="flex gap-2">
            <input className="field font-mono uppercase" placeholder="Ex.: CA0531" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn btn-primary"><Search className="size-4" /> Abrir</button>
          </div>
        )}
      </form>
    </div>
  );
}
