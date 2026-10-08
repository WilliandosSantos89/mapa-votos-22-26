import { createFileRoute } from "@tanstack/react-router";
import { CandidatoDetalhe } from "@/components/CandidatoDetalhe";
import { PERFIS } from "@/lib/candidato-perfil";
import { CANDIDATO_RONALDO } from "@/lib/candidatos";

export const Route = createFileRoute("/ronaldo-martins")({
  head: () => ({
    meta: [
      { title: "Ronaldo Martins — Republicanos 10" },
      { name: "description", content: "Perfil, biografia e desempenho eleitoral de Ronaldo Martins na Zona 117." },
    ],
  }),
  component: () => <CandidatoDetalhe perfil={PERFIS[CANDIDATO_RONALDO]} />,
});
