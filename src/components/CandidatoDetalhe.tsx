import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useServerFn } from "@tanstack/react-start";
import { getVotosCandidato } from "@/lib/votos.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, ExternalLink, Trophy, Users, Target } from "lucide-react";
import type { CandidatoPerfil } from "@/lib/candidato-perfil";
import { useIsMobile } from "@/hooks/use-mobile";

type Row = {
  cargo: string;
  secao: string;
  votos: number;
  local_votacao: string | null;
};

export function CandidatoDetalhe({ perfil }: { perfil: CandidatoPerfil }) {
  const isMobile = useIsMobile();
  const fetchVotos = useServerFn(getVotosCandidato);
  const q = useQuery({
    queryKey: ["votos_candidato", perfil.nome],
    queryFn: () => fetchVotos({ data: { nome: perfil.nome } }) as Promise<Row[]>,
    staleTime: 5 * 60_000,
  });

  const rows = q.data ?? [];

  const stats = useMemo(() => {
    let total = 0;
    const locais = new Map<string, number>();
    const secoes = new Map<string, number>();
    for (const r of rows) {
      total += r.votos;
      if (r.local_votacao) {
        locais.set(r.local_votacao, (locais.get(r.local_votacao) ?? 0) + r.votos);
      }
      secoes.set(r.secao, (secoes.get(r.secao) ?? 0) + r.votos);
    }
    const topLocais = [...locais.entries()]
      .map(([local, votos]) => ({ local, votos }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 15);
    const topSecoes = [...secoes.entries()]
      .map(([secao, votos]) => ({ secao, votos }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 10);
    return {
      total,
      locais: locais.size,
      secoes: secoes.size,
      topLocais,
      topSecoes,
      melhorLocal: topLocais[0]?.local ?? "—",
      melhorLocalVotos: topLocais[0]?.votos ?? 0,
    };
  }, [rows]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Cabeçalho com foto e informações */}
      <Card className="overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: perfil.cor }}
        />
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
            <div className="shrink-0">
              <div
                className="h-24 w-24 overflow-hidden rounded-sm border border-border bg-muted sm:h-32 sm:w-32 md:h-40 md:w-40"
                style={{ borderColor: "var(--background)" }}
              >
                <img
                  src={perfil.foto}
                  alt={perfil.nomeExibicao}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2 md:pt-6">
              <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {perfil.nomeExibicao}
                </h1>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: `color-mix(in oklab, ${perfil.cor} 15%, transparent)`, color: perfil.cor }}
                >
                  Republicanos {perfil.numero}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">{perfil.cargo}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {perfil.redes.map((r) => (
                  <Button
                    key={r.url}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
                  >
                    {r.label} <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                ))}

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Zona 117 */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
        <Kpi
          label="Total de votos (Zona 117)"
          value={stats.total.toLocaleString("pt-BR")}
          icon={<Trophy className="h-5 w-5" style={{ color: perfil.cor }} />}
        />
        <Kpi
          label="Locais de votação atingidos"
          value={stats.locais.toLocaleString("pt-BR")}
          icon={<MapPin className="h-5 w-5" style={{ color: perfil.cor }} />}
        />
        <Kpi
          label="Seções com voto"
          value={stats.secoes.toLocaleString("pt-BR")}
          icon={<Users className="h-5 w-5" style={{ color: perfil.cor }} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bio */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Biografia</CardTitle>
            <CardDescription>Fonte: republicanos10.org.br</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {perfil.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {perfil.eixos && (
              <div className="pt-2">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                  Eixos de atuação
                </div>
                <div className="flex flex-wrap gap-2">
                  {perfil.eixos.map((e) => (
                    <Badge key={e} variant="outline">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Gabinete e canais oficiais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{perfil.endereco}</span>
            </div>
            <div className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{perfil.telefone}</span>
            </div>
            <div className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`mailto:${perfil.email}`}
                className="break-all text-primary hover:underline"
              >
                {perfil.email}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destaque */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Local mais forte na Zona 117</CardTitle>
            <CardDescription>Onde a base já está consolidada</CardDescription>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{stats.melhorLocal}</div>
          <div className="text-sm text-muted-foreground">
            {stats.melhorLocalVotos.toLocaleString("pt-BR")} votos
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Top Locais */}
      <Card>
        <CardHeader>
          <CardTitle>Top 15 locais de votação</CardTitle>
          <CardDescription>Votos por local — Zona 117</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : stats.topLocais.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem dados. Importe/sincronize primeiro.</div>
          ) : (
            <div className="h-[360px] sm:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topLocais}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="local"
                    width={isMobile ? 100 : 130}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--foreground)", color: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                    }}
                    formatter={(v) => [Number(v).toLocaleString("pt-BR"), "Votos"]}
                  />
                  <Bar dataKey="votos" radius={0}>
                    {stats.topLocais.map((_, i) => (
                      <Cell key={i} fill={perfil.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top seções */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 seções</CardTitle>
          <CardDescription>Seções eleitorais com mais votos</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topSecoes.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem dados.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Seção</th>
                    <th className="px-3 py-2 text-right font-medium">Votos</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topSecoes.map((s, i) => (
                    <tr key={s.secao} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{s.secao}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {s.votos.toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-sm bg-muted">{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
