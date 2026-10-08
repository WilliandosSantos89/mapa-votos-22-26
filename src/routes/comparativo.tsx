import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVotosComparativo } from "@/lib/votos.functions";
import { compararSecoes, agrupar, type SecaoComp } from "@/lib/comparativo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ComparisonFilters } from "@/components/ComparisonFilters";

export const Route = createFileRoute("/comparativo")({
  head: () => ({
    meta: [
      { title: "Comparativo 2022 x 2026 — Mapa de Votos" },
      { name: "description", content: "Compare os votos de David Durand e Ronaldo Martins entre 2022 e 2026 por bairro, local e seção." },
      { property: "og:title", content: "Comparativo 2022 x 2026 — Mapa de Votos" },
      { property: "og:description", content: "Variação de votos entre 2022 e 2026 por bairro, local e seção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comparativo,
});

const CANDS = { ambos: ["DAVID DURAND", "RONALDO MARTINS"], david: ["DAVID DURAND"], ronaldo: ["RONALDO MARTINS"] } as const;
const TODOS = "__todos";
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number | null) => (n === null ? "novo" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`);

function Diff({ v }: { v: number }) {
  const cls = v > 0 ? "text-primary" : v < 0 ? "text-destructive" : "text-muted-foreground";
  return <span className={`font-medium ${cls}`}>{v > 0 ? "+" : ""}{fmt(v)}</span>;
}

function Filtro({ label, value, onChange, opcoes }: { label: string; value: string; onChange: (v: string) => void; opcoes: { v: string; l: string }[] }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Comparativo() {
  const fn = useServerFn(getVotosComparativo);
  const { data = [], isLoading } = useQuery({ queryKey: ["votos-comparativo"], queryFn: () => fn() });

  const [cand, setCand] = useState<keyof typeof CANDS>("ambos");
  const [zona, setZona] = useState(TODOS);
  const [bairro, setBairro] = useState(TODOS);
  const [local, setLocal] = useState(TODOS);
  const [escopo, setEscopo] = useState<"ambos" | "todas">("ambos");

  const todas = useMemo(() => compararSecoes(data, [...CANDS[cand]]), [data, cand]);
  const zonas = useMemo(() => [...new Set(todas.map((s) => s.zona))].sort(), [todas]);
  const bairros = useMemo(() => [...new Set(todas.filter((s) => zona === TODOS || s.zona === zona).map((s) => s.bairro))].sort(), [todas, zona]);
  const locais = useMemo(() => [...new Set(todas.filter((s) => (zona === TODOS || s.zona === zona) && (bairro === TODOS || s.bairro === bairro)).map((s) => s.local))].sort(), [todas, zona, bairro]);

  const secoes = useMemo(
    () => todas.filter((s) =>
      (zona === TODOS || s.zona === zona) &&
      (bairro === TODOS || s.bairro === bairro) &&
      (local === TODOS || s.local === local) &&
      (escopo === "todas" || (s.em2022 && s.em2026))),
    [todas, zona, bairro, local, escopo],
  );

  const tot22 = secoes.reduce((a, s) => a + s.v2022, 0);
  const tot26 = secoes.reduce((a, s) => a + s.v2026, 0);
  const apt26 = secoes.reduce((a, s) => a + s.aptos2026, 0);
  const so2022 = todas.filter((s) => s.em2022 && !s.em2026).length;
  const so2026 = todas.filter((s) => !s.em2022 && s.em2026).length;
  const porBairro = agrupar(secoes, "bairro").sort((a, b) => b.diff - a.diff);
  const porLocal = agrupar(secoes, "local").sort((a, b) => b.diff - a.diff);
  const ganhos = [...secoes].sort((a, b) => b.diff - a.diff).slice(0, 10);
  const perdas = [...secoes].sort((a, b) => a.diff - b.diff).slice(0, 10);
  const prioritarias = [...secoes].filter((s) => s.em2026).sort((a, b) => b.ef2026 - a.ef2026).slice(0, 15);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Comparativo 2022 x 2026</h1>
        <p className="text-sm text-muted-foreground">Mesmas seções, dois anos. Os dados de 2026 cobrem {fmt(todas.filter((s) => s.em2026).length)} seções nos bairros enviados.</p>
      </div>

      <ComparisonFilters activeCount={[zona, bairro, local].filter(v => v !== TODOS).length + (escopo === "todas" ? 1 : 0)} primary={
          <Filtro label="Candidato" value={cand} onChange={(v) => setCand(v as keyof typeof CANDS)} opcoes={[{ v: "ambos", l: "Aliança (ambos)" }, { v: "david", l: "David Durand" }, { v: "ronaldo", l: "Ronaldo Martins" }]} />
      }>
          <Filtro label="Zona" value={zona} onChange={(v) => { setZona(v); setBairro(TODOS); setLocal(TODOS); }} opcoes={[{ v: TODOS, l: "Todas" }, ...zonas.map((z) => ({ v: z, l: `Zona ${z}${z === "117" ? " · Fortaleza" : z === "122" ? " · Maracanaú" : ""}` }))]} />
          <Filtro label="Bairro" value={bairro} onChange={(v) => { setBairro(v); setLocal(TODOS); }} opcoes={[{ v: TODOS, l: "Todos" }, ...bairros.map((b) => ({ v: b, l: b }))]} />
          <Filtro label="Local de votação" value={local} onChange={setLocal} opcoes={[{ v: TODOS, l: "Todos" }, ...locais.map((l) => ({ v: l, l }))]} />
          <Filtro label="Seções" value={escopo} onChange={(v) => setEscopo(v as "ambos" | "todas")} opcoes={[{ v: "ambos", l: "Presentes nos dois anos" }, { v: "todas", l: "Todas" }]} />
      </ComparisonFilters>

      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi titulo="Votos 2022" valor={fmt(tot22)} />
            <Kpi titulo="Votos 2026" valor={fmt(tot26)} />
            <Kpi titulo="Variação" valor={<><Diff v={tot26 - tot22} /> <span className="text-base text-muted-foreground">{pct(tot22 ? ((tot26 - tot22) / tot22) * 100 : null)}</span></>} />
            <Kpi titulo="Eficiência 2026" valor={`${apt26 ? ((tot26 / apt26) * 100).toFixed(2) : "0"}%`} sub="votos ÷ eleitores aptos" />
          </div>
          <p className="text-xs text-muted-foreground">Seções só em 2022: {so2022} · só em 2026: {so2026}</p>

          <Tabs defaultValue="bairro">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:w-fit [&>button]:min-h-11">
              <TabsTrigger value="bairro">Por bairro</TabsTrigger>
              <TabsTrigger value="local">Por local</TabsTrigger>
              <TabsTrigger value="secao">Ganhos e perdas</TabsTrigger>
              <TabsTrigger value="prior">Seções prioritárias</TabsTrigger>
            </TabsList>
            <TabsContent value="bairro"><TabelaGrupo titulo="Bairro" linhas={porBairro} /></TabsContent>
            <TabsContent value="local"><TabelaGrupo titulo="Local de votação" linhas={porLocal} /></TabsContent>
            <TabsContent value="secao" className="grid gap-4 lg:grid-cols-2">
              <TabelaSecoes titulo="Onde ganhamos" icone={<TrendingUp className="h-4 w-4 text-primary" />} linhas={ganhos} />
              <TabelaSecoes titulo="Onde perdemos" icone={<TrendingDown className="h-4 w-4 text-destructive" />} linhas={perdas} />
            </TabsContent>
            <TabsContent value="prior">
              <Card>
                <CardHeader><CardTitle className="text-base">Maior eficiência em 2026</CardTitle><CardDescription>Votos ÷ aptos por seção, comparado a 2022.</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Seção</TableHead><TableHead>Local</TableHead><TableHead className="text-right">Efic. 2022</TableHead><TableHead className="text-right">Efic. 2026</TableHead><TableHead className="text-right">Votos 2026</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {prioritarias.map((s) => (
                        <TableRow key={s.chave}>
                          <TableCell>{s.zona}/{s.secao}</TableCell>
                          <TableCell className="max-w-[260px] truncate">{s.local}</TableCell>
                          <TableCell className="text-right">{s.em2022 ? `${s.ef2022.toFixed(2)}%` : "—"}</TableCell>
                          <TableCell className="text-right font-medium">{s.ef2026.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{fmt(s.v2026)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function Kpi({ titulo, valor, sub }: { titulo: string; valor: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{titulo}</CardDescription></CardHeader>
      <CardContent><div className="flex flex-wrap items-baseline gap-1 text-xl sm:text-2xl font-semibold tabular-nums">{valor}</div>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</CardContent>
    </Card>
  );
}

function TabelaGrupo({ titulo, linhas }: { titulo: string; linhas: ReturnType<typeof agrupar> }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>{titulo}</TableHead><TableHead className="text-right">Seções</TableHead><TableHead className="text-right">2022</TableHead><TableHead className="text-right">2026</TableHead><TableHead className="text-right">Variação</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
          <TableBody>
            {linhas.map((g) => (
              <TableRow key={g.nome}>
                <TableCell className="max-w-[300px] truncate">{g.nome}</TableCell>
                <TableCell className="text-right">{g.secoes}</TableCell>
                <TableCell className="text-right">{fmt(g.v2022)}</TableCell>
                <TableCell className="text-right">{fmt(g.v2026)}</TableCell>
                <TableCell className="text-right"><Diff v={g.diff} /></TableCell>
                <TableCell className="text-right">{pct(g.diffPct)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TabelaSecoes({ titulo, icone, linhas }: { titulo: string; icone: React.ReactNode; linhas: SecaoComp[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base">{icone}{titulo}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Seção</TableHead><TableHead>Bairro</TableHead><TableHead className="text-right">2022</TableHead><TableHead className="text-right">2026</TableHead><TableHead className="text-right">Var.</TableHead></TableRow></TableHeader>
          <TableBody>
            {linhas.map((s) => (
              <TableRow key={s.chave}>
                <TableCell>{s.zona}/{s.secao}{!s.em2022 && <Badge variant="secondary" className="ml-2">nova</Badge>}</TableCell>
                <TableCell className="max-w-[160px] truncate">{s.bairro}</TableCell>
                <TableCell className="text-right">{fmt(s.v2022)}</TableCell>
                <TableCell className="text-right">{fmt(s.v2026)}</TableCell>
                <TableCell className="text-right"><Diff v={s.diff} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
