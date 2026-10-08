import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVotos } from "@/lib/votos.functions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import { useCountUp } from "@/hooks/useCountUp";
import { useIsTouch } from "@/hooks/useIsTouch";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  CANDIDATO_DAVID,
  CANDIDATO_RONALDO,
  FOCUS_CANDIDATOS,
} from "@/lib/candidatos";
import { TrendingUp, MapPin, Target, AlertTriangle, Trophy, Upload, Users } from "lucide-react";

export const Route = createFileRoute("/analise-2022")({
  component: Dashboard,
});

type VotoRow = {
  municipio: string;
  zona: string;
  secao: string;
  cargo: string;
  candidato: string;
  votos: number;
  aptos: number | null;
  local_votacao: string | null;
};

const ALIANCA_COR = "var(--primary)";
const ALERTA_COR = "var(--destructive)";
const OK_COR = "var(--chart-3)";
/** Meta de participação da aliança nos votos válidos (%) */
const META_SHARE = 15;


function Dashboard() {
  const isTouch = useIsTouch();
  const fetchVotos = useServerFn(getVotos);
  const votosQ = useQuery({
    queryKey: ["votos_all"],
    queryFn: () => fetchVotos() as Promise<VotoRow[]>,
    staleTime: 5 * 60_000,
  });

  const [municipio, setMunicipio] = useState<string>("all");
  const [zona, setZona] = useState<string>("all");
  const [cargo, setCargo] = useState<string>("all");
  const [local, setLocal] = useState<string>("all");
  const [faixa, setFaixa] = useState<string>("all");
  const [ordem, setOrdem] = useState<string>("comparecimento_asc");

  const rows = votosQ.data ?? [];

  const municipios = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.municipio).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [rows],
  );
  const escopo = useMemo(
    () => rows.filter((r) => municipio === "all" || r.municipio === municipio),
    [rows, municipio],
  );
  const zonas = useMemo(
    () =>
      Array.from(new Set(escopo.map((r) => r.zona).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { numeric: true }),
      ),
    [escopo],
  );
  const cargos = useMemo(
    () => Array.from(new Set(escopo.map((r) => r.cargo))).sort(),
    [escopo],
  );
  const locais = useMemo(
    () =>
      Array.from(
        new Set(
          escopo
            .filter((r) => zona === "all" || r.zona === zona)
            .map((r) => r.local_votacao)
            .filter(Boolean) as string[],
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [escopo, zona],
  );
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (municipio !== "all" && r.municipio !== municipio) return false;
      if (zona !== "all" && r.zona !== zona) return false;
      if (cargo !== "all" && r.cargo !== cargo) return false;
      if (local !== "all" && r.local_votacao !== local) return false;
      return true;
    });
  }, [rows, municipio, zona, cargo, local]);

  const isValidCandidato = (nome: string) =>
    !nome.startsWith("LEGENDA") && nome !== "BRANCOS" && nome !== "NULOS";

  // Estatísticas gerais da aliança
  const alianca = useMemo(() => {
    let ronaldo = 0;
    let david = 0;
    let totalValidos = 0;
    const secoes = new Set<string>();
    const locaisSet = new Set<string>();
    for (const r of filtered) {
      if (!isValidCandidato(r.candidato)) continue;
      totalValidos += r.votos;
      if (r.candidato === CANDIDATO_RONALDO) {
        ronaldo += r.votos;
        secoes.add(r.secao);
        if (r.local_votacao) locaisSet.add(r.local_votacao);
      } else if (r.candidato === CANDIDATO_DAVID) {
        david += r.votos;
        secoes.add(r.secao);
        if (r.local_votacao) locaisSet.add(r.local_votacao);
      }
    }
    const total = ronaldo + david;
    return {
      ronaldo,
      david,
      total,
      totalValidos,
      share: totalValidos ? (total / totalValidos) * 100 : 0,
      secoes: secoes.size,
      locais: locaisSet.size,
    };
  }, [filtered]);

  // Desempenho por local: total aliança + total válidos + share%
  const desempenhoPorLocal = useMemo(() => {
    const map: Record<
      string,
      { local: string; alianca: number; validos: number; ronaldo: number; david: number }
    > = {};
    for (const r of filtered) {
      if (!r.local_votacao) continue;
      if (!isValidCandidato(r.candidato)) continue;
      map[r.local_votacao] ??= {
        local: r.local_votacao,
        alianca: 0,
        validos: 0,
        ronaldo: 0,
        david: 0,
      };
      map[r.local_votacao].validos += r.votos;
      if (r.candidato === CANDIDATO_RONALDO) {
        map[r.local_votacao].ronaldo += r.votos;
        map[r.local_votacao].alianca += r.votos;
      } else if (r.candidato === CANDIDATO_DAVID) {
        map[r.local_votacao].david += r.votos;
        map[r.local_votacao].alianca += r.votos;
      }
    }
    return Object.values(map).map((l) => ({
      ...l,
      share: l.validos ? (l.alianca / l.validos) * 100 : 0,
    }));
  }, [filtered]);

  const topLocais = useMemo(
    () => [...desempenhoPorLocal].sort((a, b) => b.alianca - a.alianca).slice(0, 10),
    [desempenhoPorLocal],
  );

  const piorLocais = useMemo(
    () =>
      [...desempenhoPorLocal]
        .filter((l) => l.validos > 50) // ignora locais irrelevantes
        .sort((a, b) => a.share - b.share)
        .slice(0, 10),
    [desempenhoPorLocal],
  );



  // Comparativo aptos × votos por seção (comparecimento / abstenção)
  const comparecimentoPorSecao = useMemo(() => {
    // por seção: aptos = maior valor informado; votos = maior soma entre cargos
    const map: Record<
      string,
      {
        key: string;
        secao: string;
        local: string;
        zona: string;
        aptos: number;
        porCargo: Record<string, number>;
        alianca: number;
      }
    > = {};
    for (const r of filtered) {
      const key = `${r.zona}-${r.local_votacao ?? "—"}::${r.secao}`;
      map[key] ??= {
        key,
        secao: r.secao,
        local: r.local_votacao ?? "—",
        zona: r.zona,
        aptos: 0,
        porCargo: {},
        alianca: 0,
      };
      const e = map[key];
      if (r.aptos && r.aptos > e.aptos) e.aptos = r.aptos;
      e.porCargo[r.cargo] = (e.porCargo[r.cargo] ?? 0) + r.votos;
      if (r.candidato === CANDIDATO_RONALDO || r.candidato === CANDIDATO_DAVID) {
        e.alianca += r.votos;
      }
    }
    return Object.values(map)
      .map((e) => {
        const votos = Math.max(0, ...Object.values(e.porCargo));
        const comparecimento = e.aptos ? (votos / e.aptos) * 100 : 0;
        const abstencao = e.aptos ? Math.max(0, e.aptos - votos) : 0;
        return {
          key: e.key,
          secao: e.secao,
          local: e.local,
          zona: e.zona,
          aptos: e.aptos,
          votos,
          abstencao,
          comparecimento,
          alianca: e.alianca,
          shareAptos: e.aptos ? (e.alianca / e.aptos) * 100 : 0,
        };
      })
      .filter((e) => e.aptos > 0);
  }, [filtered]);

  const comparecimentoFiltrado = useMemo(() => {
    const arr = comparecimentoPorSecao.filter((s) => {
      if (faixa === "lt70") return s.comparecimento < 70;
      if (faixa === "70_80") return s.comparecimento >= 70 && s.comparecimento < 80;
      if (faixa === "80_90") return s.comparecimento >= 80 && s.comparecimento < 90;
      if (faixa === "gte90") return s.comparecimento >= 90;
      return true;
    });
    const sorters: Record<string, (a: typeof arr[number], b: typeof arr[number]) => number> = {
      comparecimento_asc: (a, b) => a.comparecimento - b.comparecimento,
      comparecimento_desc: (a, b) => b.comparecimento - a.comparecimento,
      abstencao_desc: (a, b) => b.abstencao - a.abstencao,
      aptos_desc: (a, b) => b.aptos - a.aptos,
    };
    return [...arr].sort(sorters[ordem] ?? sorters.comparecimento_asc);
  }, [comparecimentoPorSecao, faixa, ordem]);

  const resumoComparecimento = useMemo(() => {
    const aptos = comparecimentoPorSecao.reduce((s, x) => s + x.aptos, 0);
    const votos = comparecimentoPorSecao.reduce((s, x) => s + x.votos, 0);
    return {
      aptos,
      votos,
      abstencao: Math.max(0, aptos - votos),
      taxa: aptos ? (votos / aptos) * 100 : 0,
      secoes: comparecimentoPorSecao.length,
    };
  }, [comparecimentoPorSecao]);

  // Locais críticos (< 15% de penetração da aliança nos votos válidos)
  const locaisCriticos = useMemo(
    () =>
      desempenhoPorLocal
        .filter((l) => l.validos > 50 && l.share < 15)
        .sort((a, b) => a.share - b.share),
    [desempenhoPorLocal],
  );


  if (votosQ.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        Carregando dados...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h2 className="text-2xl font-semibold">Ainda não há dados carregados</h2>
        <p className="mt-2 text-muted-foreground">
          Atualize os dados da planilha para começar a analisar.
        </p>
        <Link to="/sincronizar">
          <Button className="mt-6">
            <Upload className="mr-2 h-4 w-4" /> Atualizar dados
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-0 sm:border-x sm:border-border">
      {/* Hero */}
      <section className="reveal-in border-b border-border px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur sm:mb-6 sm:text-[11px] sm:tracking-[0.2em]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-sm bg-primary opacity-0" />
            <span className="relative inline-flex h-2 w-2 rounded-[2px] bg-primary" />
          </span>
          Estratégia · {municipio === "all" ? `${municipios.length} municípios` : municipio} ·{" "}
          {zona === "all" ? `${zonas.length} zonas` : `Zona ${zona}`}
        </div>
        <h1 className="font-display-xl text-3xl text-foreground sm:text-5xl md:text-7xl lg:text-8xl whitespace-pre-line">
          {`MAPA DE VOTOS\n${zona === "all" ? (municipio === "all" ? "GERAL" : municipio) : `ZONA ${zona}`}`}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:mt-6 sm:text-base whitespace-pre-line">
          Diagnóstico de locais e seções para reforçar campanha - Identifique onde a base já está consolidada e onde precisamos avançar.
        </p>
        <div className="mt-6 flex justify-center">
          <Badge variant="secondary">{filtered.length.toLocaleString("pt-BR")} registros analisados</Badge>
        </div>

        {/* Resumo em uma linha */}
        <p className="mx-auto mt-5 max-w-3xl text-sm font-medium text-foreground/80">
          {alianca.secoes.toLocaleString("pt-BR")} seções
          <span className="mx-2 text-muted-foreground">·</span>
          {resumoComparecimento.aptos.toLocaleString("pt-BR")} aptos
          <span className="mx-2 text-muted-foreground">·</span>
          {alianca.totalValidos.toLocaleString("pt-BR")} votos válidos
          <span className="mx-2 text-muted-foreground">·</span>
          {locaisCriticos.length.toLocaleString("pt-BR")} locais críticos
        </p>

        {/* Banner de alerta condicional */}
        {locaisCriticos.length > 0 && (
          <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-sm border border-[color-mix(in_oklch,var(--chart-2)_55%,var(--border))] bg-[color-mix(in_oklch,var(--chart-2)_16%,transparent)] px-4 py-3 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--chart-4)" }} />
            <p className="text-sm text-foreground">
              <strong className="font-semibold">
                {locaisCriticos.length} {locaisCriticos.length === 1 ? "local crítico" : "locais críticos"}
              </strong>{" "}
              — reforçar boca de urna em{" "}
              <strong className="font-semibold">{locaisCriticos[0].local}</strong> (
              {locaisCriticos[0].share.toFixed(1)}%).
            </p>
          </div>
        )}

        <div className="brand-divider mx-auto mt-8 w-40 sm:w-56" />
      </section>





      {/* Filtros */}
      <section className="animate-on-scroll border-b border-border px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
            FILTROS
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3 lg:grid-cols-5">
            <FiltroSelect
              label="Município"
              value={municipio}
              onChange={(v) => {
                setMunicipio(v);
                setZona("all");
                setLocal("all");
              }}
              options={municipios}
            />
            <FiltroSelect
              label="Zona"
              value={zona}
              onChange={(v) => {
                setZona(v);
                setLocal("all");
              }}
              options={zonas}
            />
            <FiltroSelect label="Cargo" value={cargo} onChange={setCargo} options={cargos} />
            <FiltroSelect label="Local de votação" value={local} onChange={setLocal} options={locais} />
          </CardContent>
        </Card>
      </section>

      {/* KPIs da aliança */}
      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
              PANORAMA
            </div>
            <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              Panorama da aliança
            </h2>
          </div>
        </div>
        <div className="stagger-reveal grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

        <KpiCard
          titulo="Votos da aliança"
          valor={alianca.total}
          cor={ALIANCA_COR}
          icone={<Users className="h-4 w-4" />}
          meta={`meta: ${Math.round(alianca.totalValidos * (META_SHARE / 100)).toLocaleString("pt-BR")}`}
          progresso={
            alianca.totalValidos
              ? (alianca.total / (alianca.totalValidos * (META_SHARE / 100))) * 100
              : 0
          }
          subtitulo={`${alianca.ronaldo.toLocaleString("pt-BR")} Ronaldo + ${alianca.david.toLocaleString("pt-BR")} David`}
        />
        <KpiCard
          titulo="Participação nos válidos"
          valor={Number(alianca.share.toFixed(1))}
          cor={OK_COR}
          icone={<TrendingUp className="h-4 w-4" />}
          meta={`meta: ${META_SHARE}%`}
          progresso={(alianca.share / META_SHARE) * 100}
          subtitulo={`de ${alianca.totalValidos.toLocaleString("pt-BR")} votos válidos`}
          sufixo="%"
        />
        <KpiCard
          titulo="ESCOLAS"
          valor={alianca.locais}
          cor="var(--chart-2)"
          icone={<MapPin className="h-4 w-4" />}
          meta={`de ${locais.length} no filtro`}
          progresso={locais.length ? (alianca.locais / locais.length) * 100 : 0}
          subtitulo={`${alianca.secoes} seções alcançadas`}
        />
        <KpiCard
          titulo="Locais para atacar"
          valor={piorLocais.length}
          cor={ALERTA_COR}
          icone={<Target className="h-4 w-4" />}
          meta="meta: 0"
          progresso={
            desempenhoPorLocal.length
              ? 100 - (piorLocais.length / desempenhoPorLocal.length) * 100
              : 0
          }
          subtitulo="menor % de votos da aliança"
        />

        </div>
      </section>

      {/* Top locais (onde vamos bem) */}
      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
            BASE CONSOLIDADA
          </div>
          <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Onde já somos fortes
          </h2>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Top 10 locais — onde a aliança já é forte
          </CardTitle>
          <CardDescription>Consolide a base: mantenha presença e mobilização</CardDescription>
        </CardHeader>
        <CardContent className="h-[420px] sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topLocais}
              layout="vertical"
              margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="grad-alianca" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                type="category"
                dataKey="local"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                width={130}
              />
              <Tooltip
                content={<PtTooltip />}
                trigger={isTouch ? "click" : "hover"}
                cursor={{ fill: "color-mix(in oklch, var(--chart-3) 8%, transparent)" }}
              />
              <Bar dataKey="alianca" name="Votos da aliança" fill="var(--chart-3)" radius={0} animationDuration={180}>
                <LabelList
                  dataKey="alianca"
                  content={(p: any) =>
                    renderDestaque(p, topLocais.map((d) => d.alianca), "", "horizontal")
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>

      </Card>
      </section>

      {/* Barra segmentada — volume × penetração */}
      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="section-number text-[10px] sm:text-[11px]">
            MAPA DE CALOR
          </div>
          <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Volume × Penetração por local
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cada faixa = um local de votação</CardTitle>
            <CardDescription>
              A largura mostra o volume de votos da aliança · a cor mostra a força do local
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarraSegmentada locais={desempenhoPorLocal} />
          </CardContent>
        </Card>
      </section>


      {/* Piores locais (foco estratégico) */}

      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--destructive)] sm:text-[11px] sm:tracking-[0.2em]">
            PRIORIDADE ESTRATÉGICA
          </div>
          <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Onde precisamos avançar
          </h2>
        </div>
      <Card className="border-[color:var(--destructive)]/30">

        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[color:var(--destructive)]" /> Locais para atacar
            — menor % da aliança
          </CardTitle>
          <CardDescription>
            Ordenado pela participação (%) da aliança nos votos válidos do local. Ignora locais com
            menos de 50 votos válidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[420px] sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={piorLocais}
              layout="vertical"
              margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="grad-alerta" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} unit="%" />
              <YAxis
                type="category"
                dataKey="local"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                width={130}
              />
              <Tooltip
                content={<PtTooltip />}
                trigger={isTouch ? "click" : "hover"}
                cursor={{ fill: "color-mix(in oklch, var(--destructive) 8%, transparent)" }}
              />
              <Bar dataKey="share" name="% da aliança" fill="var(--destructive)" radius={0} animationDuration={180}>
                <LabelList
                  dataKey="share"
                  content={(p: any) =>
                    renderDestaque(p, piorLocais.map((d) => d.share), "%", "horizontal")
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>

      </Card>
      </section>

      {/* Tabela detalhada por local */}
      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
            DIAGNÓSTICO
          </div>
          <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Detalhe por local
          </h2>
        </div>
      <Card>

        <CardHeader>
          <CardTitle className="text-base">Diagnóstico por local</CardTitle>
          <CardDescription>
            Compare volume absoluto e penetração da aliança em cada local
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Local</th>
                <th className="px-4 py-2 text-right">Ronaldo</th>
                <th className="px-4 py-2 text-right">David</th>
                <th className="px-4 py-2 text-right">Aliança</th>
                
                <th className="px-4 py-2 text-right">% Aliança</th>
              </tr>
            </thead>
            <tbody>
              {[...desempenhoPorLocal]
                .sort((a, b) => b.alianca - a.alianca)
                .map((l) => (
                  <tr key={l.local} className="row-hover border-t border-border">
                    <td className="px-4 py-2 font-medium">{l.local}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[color:var(--ronaldo)]">
                      {l.ronaldo.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-[color:var(--david)]">
                      {l.david.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {l.alianca.toLocaleString("pt-BR")}
                    </td>

                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="pct-bar w-16 sm:w-24"
                          style={{
                            ["--pct-color" as any]:
                              l.share >= 20
                                ? "var(--chart-3)"
                                : l.share >= 10
                                ? "var(--chart-2)"
                                : "var(--destructive)",
                          }}
                        >
                          <span style={{ width: `${Math.min(100, l.share * 3)}%` }} />
                        </div>
                        <span
                          className="min-w-[46px] rounded-md px-2 py-0.5 text-right text-xs font-semibold tabular-nums"
                          style={{
                            backgroundColor:
                              l.share >= 20
                                ? "color-mix(in oklch, var(--chart-3) 18%, transparent)"
                                : l.share >= 10
                                ? "color-mix(in oklch, var(--chart-2) 18%, transparent)"
                                : "color-mix(in oklch, var(--destructive) 18%, transparent)",
                            color:
                              l.share >= 20
                                ? "var(--chart-3)"
                                : l.share >= 10
                                ? "var(--chart-2)"
                                : "var(--destructive)",
                          }}
                        >
                          {l.share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>

                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </section>

      {/* Aptos × Votos por seção */}
      <section className="animate-on-scroll border-b border-border px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
            COMPARECIMENTO
          </div>
          <h2 className="font-display-xl mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Aptos × Votos por seção
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Compare os eleitores aptos com os votos efetivamente registrados em cada seção. Seções
            com baixo comparecimento indicam potencial de crescimento com mobilização.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            titulo="Eleitores aptos"
            valor={resumoComparecimento.aptos}
            cor="var(--chart-2)"
            icone={<Users className="h-4 w-4" />}
            subtitulo={`${resumoComparecimento.secoes} seções com dado de aptos`}
          />
          <KpiCard
            titulo="Votos registrados"
            valor={resumoComparecimento.votos}
            cor={ALIANCA_COR}
            icone={<TrendingUp className="h-4 w-4" />}
            subtitulo="maior total entre os cargos"
          />
          <KpiCard
            titulo="VOTOS ALCANÇADOS"
            valor={Number(resumoComparecimento.taxa.toFixed(1))}
            sufixo="%"
            cor={OK_COR}
            icone={<Target className="h-4 w-4" />}
            subtitulo="votos ÷ aptos"
          />
          <KpiCard
            titulo="NÃO VOTARAM"
            valor={resumoComparecimento.abstencao}
            cor={ALERTA_COR}
            icone={<AlertTriangle className="h-4 w-4" />}
            subtitulo="eleitores que não votaram nos amigos"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtro de comparecimento</CardTitle>
            <CardDescription>
              Selecione a faixa de comparecimento e a ordenação das seções
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Faixa de comparecimento</div>
              <Select value={faixa} onValueChange={setFaixa}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as faixas</SelectItem>
                  <SelectItem value="lt70">Crítico — abaixo de 70%</SelectItem>
                  <SelectItem value="70_80">Atenção — 70% a 80%</SelectItem>
                  <SelectItem value="80_90">Bom — 80% a 90%</SelectItem>
                  <SelectItem value="gte90">Ótimo — 90% ou mais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Ordenar por</div>
              <Select value={ordem} onValueChange={setOrdem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comparecimento_asc">Menor comparecimento</SelectItem>
                  <SelectItem value="comparecimento_desc">Maior comparecimento</SelectItem>
                  <SelectItem value="abstencao_desc">Maior abstenção (absoluta)</SelectItem>
                  <SelectItem value="aptos_desc">Mais eleitores aptos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Aptos × votos — 20 seções em destaque</CardTitle>
            <CardDescription>
              {comparecimentoFiltrado.length.toLocaleString("pt-BR")} seções na faixa selecionada
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px] sm:h-[420px]">
            {comparecimentoFiltrado.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Nenhuma seção nessa faixa.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparecimentoFiltrado.slice(0, 20).map((s) => ({
                    ...s,
                    label: `${s.secao}`,
                  }))}
                  margin={{ left: 4, right: 8, top: 16, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis width={40} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    content={<PtTooltip />}
                    trigger={isTouch ? "click" : "hover"}
                    cursor={{ fill: "color-mix(in oklch, var(--primary) 8%, transparent)" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
                    iconType="circle"
                  />
                  <Bar dataKey="aptos" name="Aptos" fill="var(--chart-2)" radius={0} animationDuration={180} />
                  <Bar dataKey="votos" name="Votos" fill="var(--primary)" radius={0} animationDuration={180}>
                    <LabelList
                      dataKey="votos"
                      content={(p: any) =>
                        renderDestaque(
                          p,
                          comparecimentoFiltrado.slice(0, 20).map((s) => s.votos),
                          "",
                          "vertical",
                        )
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Detalhe por seção</CardTitle>
            <CardDescription>Aptos, votos e comparecimento</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[460px] overflow-auto p-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="sticky top-0 bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Seção</th>
                  <th className="px-4 py-2 text-left">Local</th>
                  <th className="px-4 py-2 text-right">Aptos</th>
                  <th className="px-4 py-2 text-right">Votos</th>
                  
                  <th className="px-4 py-2 text-right">Comparecimento</th>
                  <th className="px-4 py-2 text-right">Aliança / aptos</th>
                </tr>
              </thead>
              <tbody>
                {comparecimentoFiltrado.map((s) => {
                  const cor =
                    s.comparecimento >= 85
                      ? "var(--chart-3)"
                      : s.comparecimento >= 75
                      ? "var(--chart-2)"
                      : "var(--destructive)";
                  return (
                    <tr key={s.key} className="row-hover border-t border-border">
                      <td className="px-4 py-2 font-medium">{s.secao}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{s.local}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {s.aptos.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">
                        {s.votos.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className="pct-bar w-16 sm:w-24"
                            style={{ ["--pct-color" as any]: cor }}
                          >
                            <span style={{ width: `${Math.min(100, s.comparecimento)}%` }} />
                          </div>
                          <span
                            className="min-w-[46px] text-right text-xs font-semibold tabular-nums"
                            style={{ color: cor }}
                          >
                            {s.comparecimento.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-[color:var(--primary)]">
                        {s.shareAptos.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>


    </div>
  );
}


function KpiCard({
  titulo,
  valor,
  cor,
  icone,
  subtitulo,
  sufixo,
  meta,
  progresso,
}: {
  titulo: string;
  valor: number;
  cor: string;
  icone: React.ReactNode;
  subtitulo?: string;
  sufixo?: string;
  meta?: string;
  progresso?: number;
}) {
  const animated = useCountUp(valor, 1100);
  const display =
    sufixo === "%"
      ? animated.toFixed(1)
      : Math.round(animated).toLocaleString("pt-BR");
  const pct = progresso === undefined ? undefined : Math.max(0, Math.min(100, progresso));
  return (
    <Card
      className="kpi-card"
      style={{ ["--kpi-accent" as any]: cor }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {titulo}
          </CardDescription>
          <span className="kpi-icon">{icone}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="font-display text-3xl font-medium tabular-nums text-foreground">

            {display}
            {sufixo}
          </div>
          {meta && (
            <span className="text-xs font-medium text-muted-foreground">({meta})</span>
          )}
        </div>
        {pct !== undefined && (
          <div className="pct-bar mt-2" style={{ ["--pct-color" as any]: cor }}>
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        {subtitulo && <div className="mt-1.5 text-xs text-muted-foreground">{subtitulo}</div>}
      </CardContent>
    </Card>
  );
}



function FiltroSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PtTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const accent = payload[0]?.color ?? payload[0]?.payload?.fill ?? "var(--primary)";
  return (
    <div
      className="rounded-sm border border-foreground/20 bg-foreground px-3 py-2 text-xs text-background"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {label && (
        <div className="mb-1 font-display text-[11px] font-medium uppercase tracking-wide text-background">
          {label}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: p.color ?? p.payload?.fill }}
          />
          <span className="text-background/70">{p.name}:</span>
          <span className="font-medium tabular-nums text-background">
            {typeof p.value === "number" && p.unit === "%"
              ? `${p.value.toFixed(1)}%`
              : Number(p.value).toLocaleString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}



/**
 * Rótulo numérico sempre visível nas barras. Com mais de 8 itens, mostra
 * apenas o maior e o menor valor para não poluir; o resto fica no toque/hover.
 */
function renderDestaque(
  props: any,
  valores: number[],
  unidade: "" | "%",
  orientacao: "horizontal" | "vertical",
) {
  const { x, y, width, height, value, index } = props;
  if (typeof value !== "number" || value <= 0) return null;

  const limpos = valores.filter((v) => typeof v === "number");
  if (limpos.length > 8) {
    const max = Math.max(...limpos);
    const min = Math.min(...limpos.filter((v) => v > 0));
    const iMax = valores.indexOf(max);
    const iMin = valores.indexOf(min);
    if (index !== iMax && index !== iMin) return null;
  }

  const texto =
    unidade === "%" ? `${value.toFixed(1)}%` : value.toLocaleString("pt-BR");

  const pos =
    orientacao === "horizontal"
      ? { px: x + width + 5, py: y + height / 2 + 3, anchor: "start" as const }
      : { px: x + width / 2, py: y - 5, anchor: "middle" as const };

  return (
    <text
      x={pos.px}
      y={pos.py}
      textAnchor={pos.anchor}
      fill="var(--foreground)"
      fontSize={10}
      fontWeight={500}
    >
      {texto}
    </text>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const STATUS_FAIXAS = [
  { label: "Muito forte", cor: "var(--chart-3)" },
  { label: "Forte", cor: "var(--chart-2)" },
  { label: "Atenção", cor: "color-mix(in oklch, var(--destructive) 55%, var(--chart-2))" },
  { label: "Crítico", cor: "var(--destructive)" },
] as const;

function quantil(ordenado: number[], q: number) {
  if (!ordenado.length) return 0;
  const pos = (ordenado.length - 1) * q;
  const base = Math.floor(pos);
  const resto = pos - base;
  const a = ordenado[base];
  const b = ordenado[Math.min(base + 1, ordenado.length - 1)];
  return a + (b - a) * resto;
}

/** Classifica por posição relativa de VOLUME de votos (quartis da distribuição). */
function criarClassificador(votos: number[]) {
  const asc = [...votos].sort((a, b) => a - b);
  const q1 = quantil(asc, 0.25);
  const q2 = quantil(asc, 0.5);
  const q3 = quantil(asc, 0.75);
  return (v: number) => {
    if (v >= q3) return STATUS_FAIXAS[0];
    if (v >= q2) return STATUS_FAIXAS[1];
    if (v >= q1) return STATUS_FAIXAS[2];
    return STATUS_FAIXAS[3];
  };
}

function BarraSegmentada({
  locais,
}: {
  locais: { local: string; alianca: number; validos: number; share: number }[];
}) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selecionado) return;
    const fechar = (e: Event) => {
      if (!barraRef.current?.contains(e.target as Node)) setSelecionado(null);
    };
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [selecionado]);

  const dados = [...locais].filter((l) => l.alianca > 0).sort((a, b) => b.alianca - a.alianca);
  const total = dados.reduce((acc, l) => acc + l.alianca, 0);
  if (!total) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Sem dados para exibir</div>;
  }

  const statusDoLocal = criarClassificador(dados.map((l) => l.alianca));

  const resumo = STATUS_FAIXAS.map((f) => {
    const itens = dados.filter((l) => statusDoLocal(l.alianca).label === f.label);
    return {
      ...f,
      qtd: itens.length,
      votos: itens.reduce((acc, l) => acc + l.alianca, 0),
    };
  });

  const ativo = dados.find((l) => l.local === selecionado) ?? null;

  return (
    <div className="space-y-5">
      <div ref={barraRef} className="relative">
        <div className="flex h-14 w-full overflow-hidden rounded-sm border border-border sm:h-16">
          {dados.map((l) => {
            const st = statusDoLocal(l.alianca);
            const pct = (l.alianca / total) * 100;
            const isAtivo = selecionado === l.local;
            return (
              <button
                type="button"
                key={l.local}
                aria-label={`${l.local} — ${st.label}`}
                onClick={() => setSelecionado(isAtivo ? null : l.local)}
                onMouseEnter={() => setSelecionado(l.local)}
                onMouseLeave={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) return;
                  setSelecionado((atual) => (atual === l.local ? null : atual));
                }}
                title={`${l.local} — ${st.label}`}
                className="h-full transition-opacity"
                style={{
                  width: `${pct}%`,
                  backgroundColor: st.cor,
                  minWidth: 4,
                  opacity: selecionado && !isAtivo ? 0.55 : 1,
                }}
              />
            );
          })}
        </div>

        {ativo ? (
          <div className="pointer-events-none mt-2 flex justify-center">
            <div
              className="rounded-sm border border-foreground/20 bg-foreground px-3 py-2 text-xs text-background"
              style={{ borderLeft: `3px solid ${statusDoLocal(ativo.alianca).cor}` }}
            >
              <div className="font-medium uppercase tracking-wide">{ativo.local}</div>
              <div className="mt-0.5 text-background/80">
                {statusDoLocal(ativo.alianca).label} ·{" "}
                {ativo.alianca.toLocaleString("pt-BR")} votos · {ativo.share.toFixed(1)}% do local
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            Toque (ou passe o mouse) em uma faixa para ver os detalhes do local
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.label} className="rounded-sm border border-border p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: r.cor }}>
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: r.cor }} />
              {r.label}
            </div>
            <div className="mt-1.5 text-xl font-semibold">{r.qtd}</div>
            <div className="text-xs text-muted-foreground">
              {r.qtd === 1 ? "local" : "locais"} · {r.votos.toLocaleString("pt-BR")} votos
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-[320px] overflow-auto rounded-sm border border-border">
        <table className="w-full min-w-[420px] text-sm">
          <tbody>
            {dados.map((l) => {
              const st = statusDoLocal(l.alianca);
              return (
                <tr key={l.local} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-[2px] align-middle" style={{ backgroundColor: st.cor }} />
                    <span className="align-middle">{l.local}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs uppercase tracking-wider" style={{ color: st.cor }}>
                    {st.label}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {l.alianca.toLocaleString("pt-BR")} votos
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// silence unused import warnings
void FOCUS_CANDIDATOS;
void Cell;
void AreaChart;
void Area;

void LegendDot;
