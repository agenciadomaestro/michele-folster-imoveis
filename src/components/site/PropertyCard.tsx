import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, Car, Ruler, MapPin, ImageOff } from "lucide-react";
import { coverOf, priceLabel, PURPOSE_LABEL, type Property } from "@/lib/realty";

export function PropertyCard({ p }: { p: Property }) {
  const cover = coverOf(p);
  const area = p.area_built ?? p.area_useful ?? p.area_land;
  return (
    <Link
      to="/imovel/$code"
      params={{ code: p.code }}
      className="group block overflow-hidden rounded-[22px] border bg-card transition-all hover:-translate-y-0.5 hover:border-lilac hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {cover ? (
          <img src={cover} alt={p.title} loading="lazy" width={1280} height={896} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground"><ImageOff className="size-6" /></div>
        )}
        <span className="chip absolute left-3 top-3 bg-background/95">{PURPOSE_LABEL[p.purpose]}</span>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{p.type}</span>
          <span className="font-mono">{p.code}</span>
        </div>
        <h3 className="mt-1.5 line-clamp-1 font-semibold text-foreground">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" /> {[p.neighborhood, p.city].filter(Boolean).join(", ")}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{p.bedrooms}</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="size-3.5" />{p.bathrooms}</span>}
          {p.parking != null && <span className="flex items-center gap-1"><Car className="size-3.5" />{p.parking}</span>}
          {area != null && <span className="flex items-center gap-1"><Ruler className="size-3.5" />{area} m²</span>}
        </div>
        <p className="mt-4 text-lg font-bold text-primary">{priceLabel(p)}</p>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border">
      <div className="aspect-[4/3] animate-pulse bg-secondary" />
      <div className="space-y-2 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-1/3 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );
}
