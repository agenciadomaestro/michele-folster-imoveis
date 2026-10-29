import { createFileRoute } from "@tanstack/react-router";
import { ResultsPage, searchSchema } from "./imoveis";
import type { SearchFilters } from "@/lib/realty";

export const Route = createFileRoute("/locacao")({
  validateSearch: (s) => searchSchema.parse(s) as SearchFilters,
  head: () => ({
    meta: [
      { title: "Imóveis para alugar — Michele Folster Imóveis" },
      { name: "description", content: "Apartamentos, casas e salas comerciais para locação." },
      { property: "og:title", content: "Imóveis para alugar — Michele Folster" },
      { property: "og:description", content: "Apartamentos, casas e salas comerciais para locação." },
    ],
  }),
  component: () => <ResultsPage fixedPurpose="locacao" title="Imóveis para alugar" />,
});
