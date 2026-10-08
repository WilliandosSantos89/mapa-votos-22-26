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
