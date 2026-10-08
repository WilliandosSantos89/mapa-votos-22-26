export type Linha = {
  ano: number;
  zona: string;
  secao: string;
  candidato: string;
  votos: number;
  aptos: number | null;
  local_votacao: string | null;
  bairro: string | null;
};

export type SecaoComp = {
  chave: string;
  zona: string;
  secao: string;
  local: string;
  bairro: string;
  v2022: number;
  v2026: number;
  aptos2022: number;
  aptos2026: number;
  diff: number;
  diffPct: number | null;
  ef2022: number;
  ef2026: number;
  em2022: boolean;
  em2026: boolean;
};

export const chaveSecao = (zona: string, secao: string) => `${Number(zona)}-${Number(secao)}`;

/** Agrupa votos por seção (zona+seção), somando os candidatos filtrados, para 2022 e 2026. */
export function compararSecoes(rows: Linha[], candidatos: string[]): SecaoComp[] {
  const map = new Map<string, SecaoComp>();
  const localPorChave = new Map<string, { local: string; bairro: string }>();
  for (const r of rows) {
    const k = chaveSecao(r.zona, r.secao);
    if (r.local_votacao) {
      const prev = localPorChave.get(k);
      if (!prev || r.ano === 2026) localPorChave.set(k, { local: r.local_votacao, bairro: r.bairro ?? prev?.bairro ?? "" });
    }
    if (!candidatos.includes(r.candidato)) continue;
    let s = map.get(k);
    if (!s) {
      s = { chave: k, zona: String(Number(r.zona)), secao: String(Number(r.secao)), local: "", bairro: "", v2022: 0, v2026: 0, aptos2022: 0, aptos2026: 0, diff: 0, diffPct: null, ef2022: 0, ef2026: 0, em2022: false, em2026: false };
      map.set(k, s);
    }
    if (r.ano === 2022) { s.v2022 += r.votos; s.aptos2022 = Math.max(s.aptos2022, r.aptos ?? 0); s.em2022 = true; }
    if (r.ano === 2026) { s.v2026 += r.votos; s.aptos2026 = Math.max(s.aptos2026, r.aptos ?? 0); s.em2026 = true; }
  }
  for (const s of map.values()) {
    const l = localPorChave.get(s.chave);
    s.local = l?.local ?? "—";
    s.bairro = l?.bairro || "Sem bairro";
    s.diff = s.v2026 - s.v2022;
    s.diffPct = s.v2022 > 0 ? (s.diff / s.v2022) * 100 : null;
    s.ef2022 = s.aptos2022 ? (s.v2022 / s.aptos2022) * 100 : 0;
    s.ef2026 = s.aptos2026 ? (s.v2026 / s.aptos2026) * 100 : 0;
  }
  return [...map.values()];
}

export function agrupar(secoes: SecaoComp[], campo: "bairro" | "local") {
  const m = new Map<string, { nome: string; v2022: number; v2026: number; secoes: number }>();
  for (const s of secoes) {
    const g = m.get(s[campo]) ?? { nome: s[campo], v2022: 0, v2026: 0, secoes: 0 };
    g.v2022 += s.v2022; g.v2026 += s.v2026; g.secoes++;
    m.set(s[campo], g);
  }
  return [...m.values()].map((g) => ({ ...g, diff: g.v2026 - g.v2022, diffPct: g.v2022 ? ((g.v2026 - g.v2022) / g.v2022) * 100 : null }));
}

export type Insight = { tipo: "positivo" | "negativo" | "alerta" | "info"; titulo: string; texto: string };

/** Gera leituras automáticas a partir das seções comparadas (somente seções presentes nos dois anos entram na variação). */
export function gerarInsights(secoes: SecaoComp[]): Insight[] {
  const out: Insight[] = [];
  const ambos = secoes.filter((s) => s.em2022 && s.em2026);
  if (!ambos.length) return out;
  const t22 = ambos.reduce((a, s) => a + s.v2022, 0);
  const t26 = ambos.reduce((a, s) => a + s.v2026, 0);
  const d = t26 - t22;
  out.push({
    tipo: d >= 0 ? "positivo" : "negativo",
    titulo: d >= 0 ? "Crescimento geral" : "Queda geral",
    texto: `Nas ${ambos.length} seções comparáveis, os votos foram de ${t22} para ${t26} (${d >= 0 ? "+" : ""}${d}${t22 ? `, ${((d / t22) * 100).toFixed(1)}%` : ""}).`,
  });
  const sub = ambos.filter((s) => s.diff > 0).length;
  const cai = ambos.filter((s) => s.diff < 0).length;
  out.push({ tipo: "info", titulo: "Seções em alta x em queda", texto: `${sub} seções cresceram, ${cai} caíram e ${ambos.length - sub - cai} ficaram iguais.` });
  const bairros = agrupar(ambos, "bairro");
  const melhor = [...bairros].sort((a, b) => b.diff - a.diff)[0];
  const pior = [...bairros].sort((a, b) => a.diff - b.diff)[0];
  if (melhor && melhor.diff > 0) out.push({ tipo: "positivo", titulo: `Bairro destaque: ${melhor.nome}`, texto: `Ganhou ${melhor.diff} votos (${melhor.v2022} → ${melhor.v2026}). Consolidar a base e replicar a estratégia.` });
  if (pior && pior.diff < 0) out.push({ tipo: "negativo", titulo: `Bairro em queda: ${pior.nome}`, texto: `Perdeu ${-pior.diff} votos (${pior.v2022} → ${pior.v2026}). Investigar causa e reforçar presença.` });
  const zeradas = ambos.filter((s) => s.v2022 > 0 && s.v2026 === 0);
  if (zeradas.length) out.push({ tipo: "alerta", titulo: `${zeradas.length} seções zeraram em 2026`, texto: `Tinham votos em 2022 e nenhum em 2026 — prioridade de recuperação.` });
  const novas = secoes.filter((s) => !s.em2022 && s.em2026 && s.v2026 > 0);
  if (novas.length) out.push({ tipo: "info", titulo: `${novas.length} seções novas com votos`, texto: `Só existem em 2026 e somam ${novas.reduce((a, s) => a + s.v2026, 0)} votos.` });
  return out;
}

/** Seções prioritárias: muitos eleitores aptos e baixa eficiência em 2026 (potencial a conquistar). */
export function prioritarias(secoes: SecaoComp[], n = 10) {
  return secoes
    .filter((s) => s.em2026 && s.aptos2026 > 0)
    .map((s) => ({ ...s, potencial: s.aptos2026 * (1 - s.ef2026 / 100) }))
    .sort((a, b) => a.ef2026 - b.ef2026 || b.aptos2026 - a.aptos2026)
    .slice(0, n);
}
