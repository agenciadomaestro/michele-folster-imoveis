import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BedDouble, Bath, Car, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPropertyOwner, emptyOwnerDetails } from "@/lib/property-owners";
import { OwnerDetails } from "@/components/admin/OwnerDetails";
import { priceLabel, type Property } from "@/lib/realty";

const internalPropertyOptions = (id: string) =>
  queryOptions({
    queryKey: ["internal-property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_photos(url, position)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return { property: data as Property, owner: await fetchPropertyOwner(id) };
    },
  });

export const Route = createFileRoute("/admin/imovel/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(internalPropertyOptions(params.id)),
  head: () => ({
    meta: [
      { title: "Consulta interna do imóvel — Michele Folster" },
      {
        name: "description",
        content:
          "Informações do imóvel e contatos confidenciais do proprietário para a equipe Michele Folster.",
      },
      { property: "og:title", content: "Consulta interna do imóvel — Michele Folster" },
      {
        property: "og:description",
        content: "Consulta exclusiva da equipe autorizada Michele Folster.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InternalPropertyPage,
});

function InternalPropertyPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(internalPropertyOptions(id));
  if (!data)
    return (
      <main className="container-page py-8">
        <Link to="/admin" className="btn btn-outline">
          Voltar ao painel
        </Link>
        <h1 className="mt-6 text-xl font-semibold">Imóvel indisponível</h1>
      </main>
    );
  const p = data.property;
  const photos = [...(p.property_photos ?? [])].sort((a, b) => a.position - b.position);
  return (
    <main className="container-page max-w-4xl py-8">
      <Link to="/admin" className="btn btn-outline">
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>
      <p className="mt-6 font-mono text-sm text-muted-foreground">{p.code}</p>
      <h1 className="mt-2 text-2xl font-bold">{p.title}</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" />
        {[p.address, p.neighborhood, `${p.city}/${p.state}`].filter(Boolean).join(", ")}
      </p>
      <p className="mt-4 text-2xl font-semibold text-primary">{priceLabel(p)}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((photo) => (
          <img
            key={photo.url}
            src={photo.url}
            alt={p.title}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <span className="flex items-center gap-2">
          <BedDouble className="size-4" />
          {p.bedrooms ?? "—"} quartos
        </span>
        <span className="flex items-center gap-2">
          <Bath className="size-4" />
          {p.bathrooms ?? "—"} banheiros
        </span>
        <span className="flex items-center gap-2">
          <Car className="size-4" />
          {p.parking ?? "—"} vagas
        </span>
        <span>{p.area_useful ?? p.area_built ?? p.area_land ?? "—"} m²</span>
      </div>
      {p.features.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Características</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {p.features.map((feature) => (
              <li key={feature} className="text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      {p.description && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Sobre o imóvel</h2>
          <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
            {p.description}
          </p>
        </div>
      )}
      <OwnerDetails value={data.owner ?? emptyOwnerDetails} />
    </main>
  );
}
