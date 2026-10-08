import { createFileRoute } from "@tanstack/react-router";
import { CandidatoDetalhe } from "@/components/CandidatoDetalhe";
import { PERFIS } from "@/lib/candidato-perfil";
import { CANDIDATO_DAVID } from "@/lib/candidatos";

export const Route = createFileRoute("/david-durand")({
  head: () => ({
    meta: [
      { title: "David Durand — Republicanos 10" },
      { name: "description", content: "Perfil, biografia e desempenho eleitoral de David Durand na Zona 117." },
    ],
  }),
  component: () => <CandidatoDetalhe perfil={PERFIS[CANDIDATO_DAVID]} />,
});
