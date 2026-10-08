import { createFileRoute } from "@tanstack/react-router";
import { CandidatoDetalhe } from "@/components/CandidatoDetalhe";
import { PERFIS } from "@/lib/candidato-perfil";
import { CANDIDATO_RONALDO } from "@/lib/candidatos";

export const Route = createFileRoute("/ronaldo-martins")({
  head: () => ({
    meta: [
      { title: "Ronaldo Martins — Republicanos 10" },
      { name: "description", content: "Perfil, biografia e desempenho eleitoral de Ronaldo Martins na Zona 117." },
      { property: "og:title", content: "Ronaldo Martins — Mapa de Votos" },
      { property: "og:description", content: "Perfil e desempenho eleitoral de Ronaldo Martins em 2022." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: PERFIS[CANDIDATO_RONALDO].foto },
      { name: "twitter:image", content: PERFIS[CANDIDATO_RONALDO].foto },
    ],
  }),
  component: () => <CandidatoDetalhe perfil={PERFIS[CANDIDATO_RONALDO]} />,
});
