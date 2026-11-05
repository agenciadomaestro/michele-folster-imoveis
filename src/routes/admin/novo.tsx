import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/novo")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/imoveis/novo" });
  },
});
