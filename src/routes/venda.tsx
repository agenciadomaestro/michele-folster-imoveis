import { createFileRoute } from "@tanstack/react-router";
import { ResultsPage, searchSchema } from "./imoveis";
import type { SearchFilters } from "@/lib/realty";

export const Route = createFileRoute("/venda")({
  validateSearch: (s) => searchSchema.parse(s) as SearchFilters,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Imóveis à venda — Michele Folster Imóveis" },
      { name: "description", content: "Casas, apartamentos e terrenos à venda com a Michele Folster Imóveis." },
      { property: "og:title", content: "Imóveis à venda — Michele Folster" },
      { property: "og:description", content: "Casas, apartamentos e terrenos à venda." },
    ],
  }),
  component: () => <ResultsPage fixedPurpose="venda" title="Imóveis à venda" />,
});
