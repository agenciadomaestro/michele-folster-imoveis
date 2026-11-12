import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BedDouble, Bath, Car, Ruler, MapPin, Share2, X, ChevronLeft, ChevronRight, Check, ImageOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { LeadForm } from "@/components/site/LeadForm";
import { supabase } from "@/integrations/supabase/client";
import { AGENCY, brl, priceLabel, PURPOSE_LABEL, getWhatsappUrl, type Property } from "@/lib/realty";
import { useSiteAnalytics } from "@/hooks/use-site-analytics";
import { getCurrentUserProfile } from "@/lib/brokers";
import { fetchPropertyOwner, emptyOwnerDetails } from "@/lib/property-owners";
import { OwnerDetails } from "@/components/admin/OwnerDetails";

export const Route = createFileRoute("/imovel/$code")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Imóvel ${params.code} — Michele Folster Imóveis` },
      { name: "description", content: `Detalhes, fotos e valores do imóvel ${params.code}.` },
      { property: "og:title", content: `Imóvel ${params.code} — Michele Folster` },
      { property: "og:description", content: `Detalhes, fotos e valores do imóvel ${params.code}.` },
    ],
  }),
  component: PropertyPage,
});

function PropertyPage() {
  const { code } = Route.useParams();
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const { trackPropertyView, trackPhotoSwipe, trackWhatsappClick } = useSiteAnalytics();

  // Consulta segura de perfil: dados confidenciais do proprietário são restritos à equipe
  const { data: userProfile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return await getCurrentUserProfile();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const isStaff = !!userProfile?.active;

  const { data: p, isLoading } = useQuery({
    queryKey: ["property", code],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*, property_photos(url, position)")
          .ilike("code", code)
          .maybeSingle();
        if (!error && data) return data as Property;
      } catch (err) {
        console.warn("Aviso ao buscar detalhes do imóvel no Supabase:", err);
      }
      return null;
    },
  });

  useEffect(() => {
    if (p?.id) {
      trackPropertyView(p.id);
    }
  }, [p?.id]);
  const { data: related } = useQuery({
    enabled: !!p,
    queryKey: ["related", p?.id],
    queryFn: async () => {
      let supabaseItems: Property[] = [];
      try {
        const { data } = await supabase
          .from("properties")
          .select("*, property_photos(url, position)")
          .eq("status", "publicado")
          .neq("id", p!.id)
          .limit(3);
        if (data) supabaseItems = data as Property[];
      } catch {}
      return supabaseItems;
    },
  });

  const { data: owner } = useQuery({
    queryKey: ["property-owner", p?.id],
    queryFn: async () => {
      if (!p?.id) return null;
      return await fetchPropertyOwner(p.id);
    },
    enabled: !!p?.id && isStaff,
    retry: false,
  });

  if (isLoading) return <SiteLayout><div className="container-page pt-10"><div className="aspect-[16/8] animate-pulse rounded-[24px] bg-secondary" /></div></SiteLayout>;
  if (!p)
    return (
      <SiteLayout>
        <div className="container-page pt-20">
          <div className="panel mx-auto max-w-md p-10 text-center">
            <h1 className="text-xl font-bold">Imóvel indisponível</h1>
            <p className="mt-2 text-sm text-muted-foreground">O código {code} não está disponível no momento.</p>
            <Link to="/imoveis" className="btn btn-primary mt-6">Ver outros imóveis</Link>
          </div>
        </div>
      </SiteLayout>
    );

  const photos = [...(p.property_photos ?? [])].sort((a, b) => a.position - b.position);
  const specs = [
    p.bedrooms != null && { i: BedDouble, l: "Quartos", v: `${p.bedrooms}${p.suites ? ` (${p.suites} suíte${p.suites > 1 ? "s" : ""})` : ""}` },
    p.bathrooms != null && { i: Bath, l: "Banheiros", v: p.bathrooms },
    p.parking != null && { i: Car, l: "Vagas", v: p.parking },
    p.area_built != null && { i: Ruler, l: "Área construída", v: `${p.area_built} m²` },
    p.area_useful != null && { i: Ruler, l: "Área útil", v: `${p.area_useful} m²` },
    p.area_land != null && { i: Ruler, l: "Terreno", v: `${p.area_land} m²` },
  ].filter(Boolean) as { i: typeof Bath; l: string; v: string | number }[];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: p.title, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }
  };
  const move = (d: number) => {
    if (p?.id) trackPhotoSwipe(p.id);
    setIdx((i) => (i + d + photos.length) % photos.length);
  };

  return (
    <SiteLayout>
      <div className="container-page pt-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Início</Link> / <Link to="/imoveis" className="hover:text-primary">Imóveis</Link> / <span className="font-mono">{p.code}</span>
        </nav>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px]">
          <button onClick={() => photos.length && setZoom(true)} className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-secondary">
            {photos[idx] ? <img src={photos[idx].url} alt={p.title} className="size-full object-cover" width={1280} height={896} /> : <div className="grid size-full place-items-center text-muted-foreground"><ImageOff /></div>}
          </button>
          {photos.length > 1 && (
            <div className="flex gap-3 overflow-auto md:flex-col">
              {photos.map((ph, i) => (
                <button
                  key={ph.url}
                  onClick={() => {
                    if (p?.id) trackPhotoSwipe(p.id);
                    setIdx(i);
                  }}
                  className={`aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-[14px] border-2 md:w-full ${i === idx ? "border-primary" : "border-transparent"}`}
                >
                  <img src={ph.url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{PURPOSE_LABEL[p.purpose]}</span>
              <span className="chip bg-secondary text-muted-foreground">{p.type}</span>
              <span className="chip bg-secondary font-mono text-muted-foreground">{p.code}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              {[p.show_address ? p.address : null, p.neighborhood, `${p.city} - ${p.state}`].filter(Boolean).join(", ")}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-muted-foreground">{p.purpose === "locacao" ? "Aluguel" : "Valor"}</p>
                <p className="text-3xl font-bold text-primary">{priceLabel(p)}</p>
              </div>
              {p.purpose === "ambos" && p.rent_price && <div><p className="text-xs text-muted-foreground">Aluguel</p><p className="text-xl font-semibold">{brl(p.rent_price)}/mês</p></div>}
              {p.condo_fee && <div><p className="text-xs text-muted-foreground">Condomínio</p><p className="font-semibold">{brl(p.condo_fee)}</p></div>}
              {p.iptu && <div><p className="text-xs text-muted-foreground">IPTU</p><p className="font-semibold">{brl(p.iptu)}</p></div>}
              <button onClick={share} className="btn btn-outline ml-auto"><Share2 className="size-4" /> Compartilhar</button>
            </div>

            {specs.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.l} className="rounded-[18px] bg-surface p-4">
                    <s.i className="size-4 text-primary" />
                    <p className="mt-2 text-xs text-muted-foreground">{s.l}</p>
                    <p className="font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>
            )}

            {p.features.length > 0 && (
              <>
                <h2 className="mt-10 text-lg font-semibold">Características</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><span className="grid size-5 place-items-center rounded-full bg-accent text-primary"><Check className="size-3" /></span>{f}</li>)}
                </ul>
              </>
            )}
            {p.description && (<><h2 className="mt-10 text-lg font-semibold">Sobre o imóvel</h2><p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p></>)}
          </div>

          <aside className="panel h-fit p-6 lg:sticky lg:top-24">
            <p className="font-semibold">Fale com {AGENCY.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Responderemos o mais rápido possível.</p>
            <div className="mt-5">
              <LeadForm
                propertyId={p.id}
                propertyCode={p.code}
                propertyTitle={p.title}
                brokerId={p.broker_id}
                source="pagina_imovel"
              />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <a
                href={`https://wa.me/5512981467549?text=${encodeURIComponent(
                  `Olá, vim pelo site e preciso de ajuda referente ao imóvel Código ${p.code} - ${p.title}.`
                )}`}
                onClick={() => {
                  trackWhatsappClick(p.id);
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs font-bold gap-2 shadow-xs"
              >
                <MessageCircle className="size-4" />
                <span>Conversar no WhatsApp ({AGENCY.phone})</span>
              </a>
            </div>
          </aside>
        </div>

        {/* Informações confidenciais do proprietário: visível exclusivamente para corretores autorizados */}
        {isStaff && (
          <div className="mt-12">
            <OwnerDetails value={owner ?? emptyOwnerDetails} />
          </div>
        )}

        {related && related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-xl font-bold">Imóveis relacionados</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <PropertyCard key={r.id} p={r} />)}</div>
          </section>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4" onClick={() => setZoom(false)}>
          <img src={photos[idx]?.url} alt={p.title} className="max-h-[85vh] max-w-full rounded-[20px]" onClick={(e) => e.stopPropagation()} />
          <button className="btn btn-outline absolute right-5 top-5 size-11 rounded-full p-0" onClick={() => setZoom(false)} aria-label="Fechar"><X className="size-5" /></button>
          {photos.length > 1 && (<>
            <button className="btn btn-outline absolute left-5 size-11 rounded-full p-0" onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label="Anterior"><ChevronLeft /></button>
            <button className="btn btn-outline absolute right-5 size-11 rounded-full p-0" onClick={(e) => { e.stopPropagation(); move(1); }} aria-label="Próxima"><ChevronRight /></button>
          </>)}
        </div>
      )}
    </SiteLayout>
  );
}
