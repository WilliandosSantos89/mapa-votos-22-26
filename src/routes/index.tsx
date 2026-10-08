import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getVotosComparativo } from "@/lib/votos.functions";
import { compararSecoes, agrupar, gerarInsights, prioritarias } from "@/lib/comparativo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ComparisonFilters } from "@/components/ComparisonFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral 2022 x 2026 — Mapa de Votos" },
      { name: "description", content: "Painel comparativo dos votos de David Durand e Ronaldo Martins em 2022 e 2026, com insights para decisão." },
      { property: "og:title", content: "Visão geral 2022 x 2026 — Mapa de Votos" },
      { property: "og:description", content: "Compare 2022 e 2026 por zona, bairro e local e descubra onde agir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisaoGeral,
});

const DAVID = "DAVID DURAND";
const RONALDO = "RONALDO MARTINS";
const CANDS: Record<string, string[]> = { ambos: [DAVID, RONALDO], david: [DAVID], ronaldo: [RONALDO] };
const T = "__todos";
const fmt = (n: number) => n.toLocaleString("pt-BR");
const sinal = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;
const C22 = "var(--muted-foreground)";
const C26 = "var(--primary)";

function Filtro({ label, value, onChange, opcoes }: { label: string; value: string; onChange: (v: string) => void; opcoes: { v: string; l: string }[] }) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{opcoes.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Kpi({ titulo, v22, v26, sufixo = "", decimais = 0 }: { titulo: string; v22: number; v26: number; sufixo?: string; decimais?: number }) {
  const d = v26 - v22;
  const f = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: decimais, minimumFractionDigits: decimais });
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</div>
        <div className="flex flex-col gap-1 xl:flex-row xl:items-baseline xl:gap-3">
          <span className="text-2xl sm:text-3xl font-semibold tabular-nums">{f(v26)}{sufixo}<span className="ml-2 text-xs font-normal text-muted-foreground">2026</span></span>
          <span className="text-sm text-muted-foreground">2022: {f(v22)}{sufixo}</span>
        </div>
        <div className={`flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium ${d > 0 ? "text-primary" : d < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {d >= 0 ? <TrendingUp className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
          {d > 0 ? "+" : ""}{f(d)}{sufixo} {v22 > 0 && !sufixo ? `(${((d / v22) * 100).toFixed(1)}%)` : ""}
        </div>
      </CardContent>
    </Card>
  );
}

function VisaoGeral() {
  const isMobile = useIsMobile();
  const fn = useServerFn(getVotosComparativo);
  const { data = [], isLoading } = useQuery({ queryKey: ["votos-comparativo"], queryFn: () => fn(), staleTime: 5 * 60_000 });

  const [cand, setCand] = useState("ambos");
  const [zona, setZona] = useState(T);
  const [bairro, setBairro] = useState(T);
  const [local, setLocal] = useState(T);
  const [escopo, setEscopo] = useState("ambos");

  const todas = useMemo(() => compararSecoes(data, CANDS[cand]), [data, cand]);
  const zonas = useMemo(() => [...new Set(todas.map((s) => s.zona))].sort(), [todas]);
  const bairros = useMemo(() => [...new Set(todas.filter((s) => zona === T || s.zona === zona).map((s) => s.bairro))].sort(), [todas, zona]);
  const locais = useMemo(() => [...new Set(todas.filter((s) => (zona === T || s.zona === zona) && (bairro === T || s.bairro === bairro)).map((s) => s.local))].sort(), [todas, zona, bairro]);

  const secoes = useMemo(() => todas.filter((s) =>
    (zona === T || s.zona === zona) && (bairro === T || s.bairro === bairro) && (local === T || s.local === local) &&
    (escopo === "todas" || (s.em2022 && s.em2026))), [todas, zona, bairro, local, escopo]);

  // Divisão por candidato (respeita filtros geográficos)
  const porCand = useMemo(() => {
    const chaves = new Set(secoes.map((s) => s.chave));
    return [DAVID, RONALDO].filter((c) => CANDS[cand].includes(c)).map((c) => {
      const ss = compararSecoes(data, [c]).filter((s) => chaves.has(s.chave));
      return { nome: c === DAVID ? "David Durand" : "Ronaldo Martins", "2022": ss.reduce((a, s) => a + s.v2022, 0), "2026": ss.reduce((a, s) => a + s.v2026, 0) };
    });
  }, [data, secoes, cand]);

  const v22 = secoes.reduce((a, s) => a + s.v2022, 0);
  const v26 = secoes.reduce((a, s) => a + s.v2026, 0);
  const a22 = secoes.reduce((a, s) => a + s.aptos2022, 0);
  const a26 = secoes.reduce((a, s) => a + s.aptos2026, 0);
  const ef22 = a22 ? (v22 / a22) * 100 : 0;
  const ef26 = a26 ? (v26 / a26) * 100 : 0;
  const comVoto22 = secoes.filter((s) => s.v2022 > 0).length;
  const comVoto26 = secoes.filter((s) => s.v2026 > 0).length;

  const grupoCampo = bairro === T ? "bairro" : "local";
  const grupos = useMemo(() => agrupar(secoes, grupoCampo).sort((a, b) => b.v2026 + b.v2022 - (a.v2026 + a.v2022)), [secoes, grupoCampo]);
  const chart = grupos.slice(0, 12).map((g) => ({ nome: g.nome.length > 22 ? g.nome.slice(0, 21) + "…" : g.nome, "2022": g.v2022, "2026": g.v2026 }));
  const insights = useMemo(() => gerarInsights(secoes), [secoes]);
  const prio = useMemo(() => prioritarias(secoes, 8), [secoes]);
  const ganhos = useMemo(() => [...secoes].filter((s) => s.em2022 && s.em2026 && s.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 6), [secoes]);
  const perdas = useMemo(() => [...secoes].filter((s) => s.em2022 && s.em2026 && s.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 6), [secoes]);

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Carregando dados...</div>;

  const opt = (arr: string[], todos: string) => [{ v: T, l: todos }, ...arr.map((x) => ({ v: x, l: x }))];
  const iconeInsight = { positivo: TrendingUp, negativo: TrendingDown, alerta: AlertTriangle, info: Lightbulb } as const;
  const corInsight = { positivo: "text-primary", negativo: "text-destructive", alerta: "text-destructive", info: "text-muted-foreground" } as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Visão geral · 2022 x 2026</h1>
        <p className="text-sm text-muted-foreground">David Durand (Dep. Estadual) e Ronaldo Martins (Dep. Federal) — o que mudou e onde agir.</p>
      </header>

      <ComparisonFilters activeCount={[zona, bairro, local].filter(v => v !== T).length + (escopo === "todas" ? 1 : 0)} primary={
          <Filtro label="Candidato" value={cand} onChange={setCand} opcoes={[{ v: "ambos", l: "Aliança (ambos)" }, { v: "david", l: "David Durand" }, { v: "ronaldo", l: "Ronaldo Martins" }]} />
      }>
          <Filtro label="Zona" value={zona} onChange={(v) => { setZona(v); setBairro(T); setLocal(T); }} opcoes={opt(zonas, "Todas as zonas")} />
          <Filtro label="Bairro" value={bairro} onChange={(v) => { setBairro(v); setLocal(T); }} opcoes={opt(bairros, "Todos os bairros")} />
          <Filtro label="Local de votação" value={local} onChange={setLocal} opcoes={opt(locais, "Todos os locais")} />
          <Filtro label="Seções" value={escopo} onChange={setEscopo} opcoes={[{ v: "ambos", l: "Presentes nos 2 anos" }, { v: "todas", l: "Todas" }]} />
      </ComparisonFilters>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Votos" v22={v22} v26={v26} />
        <Kpi titulo="Eficiência (votos / aptos)" v22={ef22} v26={ef26} sufixo="%" decimais={2} />
        <Kpi titulo="Seções com voto" v22={comVoto22} v26={comVoto26} />
        <Kpi titulo="Eleitores aptos" v22={a22} v26={a26} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Votos por {grupoCampo === "bairro" ? "bairro" : "local de votação"}</CardTitle>
            <CardDescription>Os 12 maiores — cinza = 2022, destaque = 2026</CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? "h-[560px]" : "h-80"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout={isMobile ? "vertical" : "horizontal"} margin={isMobile ? { left: 0, right: 8 } : { left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type={isMobile ? "number" : "category"} dataKey={isMobile ? undefined : "nome"} angle={isMobile ? 0 : -35} textAnchor={isMobile ? "middle" : "end"} interval={isMobile ? "preserveStartEnd" : 0} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis type={isMobile ? "category" : "number"} dataKey={isMobile ? "nome" : undefined} width={isMobile ? 108 : 60} interval={0} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                <Legend verticalAlign="top" />
                <Bar dataKey="2022" fill={C22} radius={[3, 3, 0, 0]} />
                <Bar dataKey="2026" fill={C26} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Insights</CardTitle><CardDescription>Leituras automáticas do recorte atual</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 && <p className="text-sm text-muted-foreground">Sem seções comparáveis neste recorte.</p>}
            {insights.map((i) => { const I = iconeInsight[i.tipo]; return (
              <div key={i.titulo} className="flex gap-3 rounded-md border border-border p-3">
                <I className={`mt-0.5 h-4 w-4 shrink-0 ${corInsight[i.tipo]}`} />
                <div className="min-w-0"><div className="text-sm font-medium">{i.titulo}</div><div className="text-sm leading-relaxed text-muted-foreground">{i.texto}</div></div>
              </div>
            ); })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Por candidato</CardTitle><CardDescription>2022 x 2026 no recorte</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCand} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                <Legend />
                <Bar dataKey="2022" fill={C22} radius={[3, 3, 0, 0]} />
                <Bar dataKey="2026" fill={C26} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ListaSecoes titulo="Maiores ganhos" icone={<TrendingUp className="h-5 w-5 text-primary" />} itens={ganhos} />
        <ListaSecoes titulo="Maiores perdas" icone={<TrendingDown className="h-5 w-5 text-destructive" />} itens={perdas} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Seções prioritárias</CardTitle><CardDescription>Muitos eleitores e baixa eficiência em 2026 — maior potencial</CardDescription></CardHeader>
          <CardContent>
            <div className="divide-y divide-border md:hidden">
              {prio.map(s => <div key={s.chave} className="py-3"><div className="text-sm font-medium">{s.zona}/{s.secao}</div><div className="mt-1 text-sm text-muted-foreground">{s.local}</div><div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground"><div>Aptos<strong className="block text-sm font-medium text-foreground">{fmt(s.aptos2026)}</strong></div><div>Votos 2026<strong className="block text-sm font-medium text-foreground">{fmt(s.v2026)}</strong></div><div>Eficiência<strong className="block text-sm font-medium text-foreground">{s.ef2026.toFixed(2)}%</strong></div></div></div>)}
            </div>
            <div className="hidden md:block"><Table>
              <TableHeader><TableRow><TableHead>Seção</TableHead><TableHead>Local</TableHead><TableHead className="text-right">Aptos</TableHead><TableHead className="text-right">Votos 26</TableHead><TableHead className="text-right">Efic.</TableHead></TableRow></TableHeader>
              <TableBody>{prio.map((s) => (
                <TableRow key={s.chave}><TableCell>{s.zona}/{s.secao}</TableCell><TableCell className="max-w-[180px] truncate">{s.local}</TableCell><TableCell className="text-right">{fmt(s.aptos2026)}</TableCell><TableCell className="text-right">{fmt(s.v2026)}</TableCell><TableCell className="text-right">{s.ef2026.toFixed(2)}%</TableCell></TableRow>
              ))}</TableBody>
            </Table></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ranking de {grupoCampo === "bairro" ? "bairros" : "locais"}</CardTitle><CardDescription>Ordenado pela variação</CardDescription></CardHeader>
          <CardContent className="max-h-96 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">2022</TableHead><TableHead className="text-right">2026</TableHead><TableHead className="text-right">Var.</TableHead></TableRow></TableHeader>
              <TableBody>{[...grupos].sort((a, b) => b.diff - a.diff).map((g) => (
                <TableRow key={g.nome}><TableCell className="max-w-[200px] truncate">{g.nome}</TableCell><TableCell className="text-right">{fmt(g.v2022)}</TableCell><TableCell className="text-right">{fmt(g.v2026)}</TableCell>
                  <TableCell className={`text-right font-medium ${g.diff > 0 ? "text-primary" : g.diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>{sinal(g.diff)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <Button asChild variant="outline"><Link to="/comparativo">Detalhe por seção <ArrowRight className="ml-1 h-4 w-4 shrink-0" /></Link></Button>
        <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal text-left"><Link to="/analise-2022"><span className="min-w-0">Análise completa de 2022 (todos os candidatos)</span> <ArrowRight className="ml-1 h-4 w-4 shrink-0" /></Link></Button>
      </div>
    </div>
  );
}

function ListaSecoes({ titulo, icone, itens }: { titulo: string; icone: React.ReactNode; itens: ReturnType<typeof compararSecoes> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{icone} {titulo}</CardTitle><CardDescription>Por seção (zona/seção)</CardDescription></CardHeader>
      <CardContent className="space-y-2">
        {itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma seção.</p>}
        {itens.map((s) => (
          <div key={s.chave} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0"><div className="font-medium">{s.zona}/{s.secao}</div><div className="truncate text-xs text-muted-foreground">{s.local} · {s.bairro}</div></div>
            <div className="text-right shrink-0"><div className={s.diff > 0 ? "text-primary font-medium" : "text-destructive font-medium"}>{sinal(s.diff)}</div><div className="text-xs text-muted-foreground">{s.v2022} → {s.v2026}</div></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
