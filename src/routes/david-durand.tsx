import { createFileRoute } from "@tanstack/react-router";
import { CandidatoDetalhe } from "@/components/CandidatoDetalhe";
import { PERFIS } from "@/lib/candidato-perfil";
import { CANDIDATO_DAVID } from "@/lib/candidatos";

export const Route = createFileRoute("/david-durand")({
  head: () => ({
    meta: [
      { title: "David Durand — Republicanos 10" },
      { name: "description", content: "Perfil, biografia e desempenho eleitoral de David Durand na Zona 117." },
      { property: "og:title", content: "David Durand — Mapa de Votos" },
      { property: "og:description", content: "Perfil e desempenho eleitoral de David Durand em 2022." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: PERFIS[CANDIDATO_DAVID].foto },
      { name: "twitter:image", content: PERFIS[CANDIDATO_DAVID].foto },
    ],
  }),
  component: () => <CandidatoDetalhe perfil={PERFIS[CANDIDATO_DAVID]} />,
});
