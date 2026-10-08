import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type VotoRow = {
  municipio: string;
  zona: string;
  secao: string;
  cargo: string;
  candidato: string;
  votos: number;
  aptos: number | null;
  local_votacao: string | null;
};

const COLS = "municipio,zona,secao,cargo,candidato,votos,aptos,local_votacao";
const COLS_ANO = "municipio,zona,secao,cargo,candidato,votos,aptos,local_votacao,ano,bairro";

export const getVotos = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const CHUNK = 1000;
  const all: VotoRow[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await supabaseAdmin
      .from("votos")
      .select(COLS)
      .eq("ano", 2022)
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as VotoRow[];
    all.push(...rows);
    if (rows.length < CHUNK) break;
  }
  return all;
});

export const getVotosCandidato = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ nome: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const CHUNK = 1000;
    const all: VotoRow[] = [];
    for (let from = 0; ; from += CHUNK) {
      const { data: rowsData, error } = await supabaseAdmin
        .from("votos")
        .select(COLS)
      .eq("ano", 2022)
        .eq("candidato", data.nome)
        .order("id", { ascending: true })
        .range(from, from + CHUNK - 1);
      if (error) throw new Error(error.message);
      const rows = (rowsData ?? []) as VotoRow[];
      all.push(...rows);
      if (rows.length < CHUNK) break;
    }
    return all;
  });

export const getBairros = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("local_bairro").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ local_votacao: string; bairro: string | null }>;
});

export const getSyncStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("sync_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { last_sync_at: string | null; total_rows: number | null } | null;
});

export type VotoAnoRow = VotoRow & { ano: number; bairro: string | null };

export const getVotosComparativo = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const CHUNK = 1000;
  const all: VotoAnoRow[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await supabaseAdmin
      .from("votos")
      .select(COLS_ANO)
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as VotoAnoRow[];
    all.push(...rows);
    if (rows.length < CHUNK) break;
  }
  return all;
});
