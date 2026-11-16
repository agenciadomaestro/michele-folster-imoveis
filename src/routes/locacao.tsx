import { createFileRoute } from "@tanstack/react-router";
import { ResultsPage } from "@/components/site/ResultsPage";
import { searchSchema } from "@/lib/search-schema";
import type { SearchFilters } from "@/lib/realty";

export const Route = createFileRoute("/locacao")({
  validateSearch: (s) => searchSchema.parse(s) as SearchFilters,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Imóveis para alugar — Michele Folster Imóveis" },
      { name: "description", content: "Apartamentos, casas e salas comerciais para locação." },
      { property: "og:title", content: "Imóveis para alugar — Michele Folster" },
      {
        property: "og:description",
        content: "Apartamentos, casas e salas comerciais para locação.",
      },
    ],
  }),
  component: () => <ResultsPage fixedPurpose="locacao" title="Imóveis para alugar" />,
});
