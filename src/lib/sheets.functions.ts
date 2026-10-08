import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "1JkzV17UPLJew3p0WMr6LZjY7_ZWxRA2DcVQ3ma77gyw";
const SHEET_NAME = "Mapa";
const HEADER_ROW = 1; // dados começam na linha 2

const inputSchema = z.object({
  startRow: z.number().int().min(HEADER_ROW + 1),
  chunkSize: z.number().int().min(100).max(10000).default(5000),
  reset: z.boolean().optional(),
});

async function fetchSheetRange(range: string) {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!key || !lovableKey) throw new Error("Credenciais do Google Sheets indisponíveis.");
  const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": key,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets [${res.status}]: ${body}`);
  }
  return (await res.json()) as { values?: string[][] };
}

export const syncFromSheets = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const endRow = data.startRow + data.chunkSize - 1;
    const range = `${SHEET_NAME}!A${data.startRow}:I${endRow}`;
    const json = await fetchSheetRange(range);
    const values = json.values ?? [];

    const rows: Array<{
      municipio: string;
      zona: string;
      secao: string;
      cargo: string;
      candidato: string;
      votos: number;
      aptos: number | null;
      local_votacao: string | null;
    }> = [];

    const toInt = (v: unknown) => {
      const n = Number(String(v ?? "").replace(/[^\d-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    for (const r of values) {
      // Colunas: Zona | Seção | Cargo | Nome do Candidato | Aptos | # Votos | % Votos Aptos | Município | Local de Votação
      const [zona, secao, cargo, candidato, aptos, votos, , municipio, local] = r;
      if (!candidato || !cargo || !secao) continue;
      const secaoClean = String(secao).replace(/\*/g, "").trim();
      if (!secaoClean) continue;
      const zonaClean = String(zona ?? "").replace(/\*/g, "").trim();
      const aptosNum = toInt(aptos);
      rows.push({
        municipio: municipio ? String(municipio).trim().toUpperCase() : "—",
        zona: zonaClean || "—",
        secao: secaoClean,
        cargo: String(cargo).trim(),
        candidato: String(candidato).trim(),
        votos: toInt(votos),
        aptos: aptosNum > 0 ? aptosNum : null,
        local_votacao: local ? String(local).trim() : null,
      });
    }

    if (data.reset) {
      const { error: delErr } = await supabaseAdmin.from("votos").delete().neq("id", -1);
      if (delErr) throw new Error(`Erro ao limpar: ${delErr.message}`);
    }

    if (rows.length > 0) {
      const BATCH = 1000;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabaseAdmin.from("votos").insert(rows.slice(i, i + BATCH));
        if (error) throw new Error(error.message);
      }
    }

    return {
      scanned: values.length,
      inserted: rows.length,
      nextRow: data.startRow + data.chunkSize,
      done: values.length < data.chunkSize,
    };
  });

export const finalizeSync = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ total: z.number().int() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("sync_status")
      .upsert({ id: 1, last_sync_at: new Date().toISOString(), total_rows: data.total });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
