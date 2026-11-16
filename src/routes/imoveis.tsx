import { createFileRoute } from "@tanstack/react-router";
import { ResultsPage } from "@/components/site/ResultsPage";
import { searchSchema } from "@/lib/search-schema";
import type { SearchFilters } from "@/lib/realty";

export const Route = createFileRoute("/imoveis")({
  validateSearch: (s) => searchSchema.parse(s) as SearchFilters,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Imóveis à venda e para alugar — Michele Folster Imóveis" },
      { name: "description", content: "Pesquise imóveis por tipo, cidade, bairro, quartos e preço." },
      { property: "og:title", content: "Buscar imóveis — Michele Folster" },
      { property: "og:description", content: "Pesquise imóveis por tipo, cidade, bairro, quartos e preço." },
    ],
  }),
  component: ResultsPage,
});

