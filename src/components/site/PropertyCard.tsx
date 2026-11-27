import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, Car, Ruler, MapPin, ImageOff, Star, ArrowUpRight } from "lucide-react";
import { coverOf, priceLabel, PURPOSE_LABEL, brl, resolvePhotoUrl, type Property } from "@/lib/realty";

export function PropertyCard({ p }: { p: Property }) {
  const cover = coverOf(p);
  const area = p.area_built ?? p.area_useful ?? p.area_land;

  return (
    <Link
      to="/imovel/$code"
      params={{ code: p.code }}
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_oklch(0.53_0.17_292/16%)]"
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={p.title}
            loading="lazy"
            width={800}
            height={550}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground bg-secondary/80">
            <div className="flex flex-col items-center gap-1.5 text-xs">
              <ImageOff className="size-6 text-muted-foreground/60" />
              <span>Sem fotos</span>
            </div>
          </div>
        )}

        {/* Gradient Overlay for contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 pointer-events-auto">
            <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur-md whitespace-nowrap">
              {PURPOSE_LABEL[p.purpose] || p.purpose}
            </span>
            {p.featured && (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm whitespace-nowrap">
                <Star className="size-3 fill-white" />
                <span>Destaque</span>
              </span>
            )}
          </div>

          {/* Top Right: Type Badge */}
          <div className="shrink-0 pointer-events-auto">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-md whitespace-nowrap">
              {p.type}
            </span>
          </div>
        </div>

        {/* Bottom Left Code */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[11px] font-bold text-white/90 backdrop-blur-md">
            REF: {p.code}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Location */}
        <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span className="truncate">
            {[p.neighborhood, p.city, p.state].filter(Boolean).join(" • ")}
          </span>
        </p>

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {p.title}
        </h3>

        {/* Features Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          {p.bedrooms != null && p.bedrooms > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
              <BedDouble className="size-3.5 text-primary" />
              <span>
                {p.bedrooms} {p.bedrooms === 1 ? "quarto" : "quartos"}
              </span>
            </span>
          )}
          {p.bathrooms != null && p.bathrooms > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
              <Bath className="size-3.5 text-primary" />
              <span>
                {p.bathrooms} {p.bathrooms === 1 ? "banheiro" : "banheiros"}
              </span>
            </span>
          )}
          {p.parking != null && p.parking > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
              <Car className="size-3.5 text-primary" />
              <span>
                {p.parking} {p.parking === 1 ? "vaga" : "vagas"}
              </span>
            </span>
          )}
          {area != null && area > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
              <Ruler className="size-3.5 text-primary" />
              <span>{area} m²</span>
            </span>
          )}
        </div>

        {/* Price & CTA Footer */}
        <div className="mt-auto pt-5 flex items-end justify-between gap-2">
          <div>
            <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {p.purpose === "locacao" ? "Valor de Aluguel" : "Valor de Venda"}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                {priceLabel(p)}
              </span>
            </div>
            {p.condo_fee != null && p.condo_fee > 0 && (
              <span className="text-[11px] text-muted-foreground block">
                + Condomínio: {brl(p.condo_fee)}
              </span>
            )}
          </div>

          <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:translate-x-0.5">
            <ArrowUpRight className="size-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border/60 bg-card">
      <div className="aspect-[16/11] animate-pulse bg-secondary" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary" />
        <div className="flex gap-2 pt-2">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-secondary" />
          <div className="h-7 w-20 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="pt-4 flex justify-between items-center">
          <div className="h-6 w-28 animate-pulse rounded-full bg-secondary" />
          <div className="size-8 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    </div>
  );
}
