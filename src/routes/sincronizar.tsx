import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { syncFromSheets, finalizeSync } from "@/lib/sheets.functions";
import { getSyncStatus } from "@/lib/votos.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud, Check, AlertTriangle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/sincronizar")({
  component: SincronizarPage,
});

const CHUNK = 5000;
const START_ROW = 2;

function SincronizarPage() {
  const [reset, setReset] = useState(true);
  const [running, setRunning] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [inserted, setInserted] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const qc = useQueryClient();
  const runSync = useServerFn(syncFromSheets);
  const runFinalize = useServerFn(finalizeSync);
  const fetchStatus = useServerFn(getSyncStatus);

  const status = useQuery({
    queryKey: ["sync_status"],
    queryFn: () => fetchStatus(),
  });

  const start = async () => {
    setRunning(true);
    setError(null);
    setScanned(0);
    setInserted(0);
    setProgress(0);

    const APPROX_TOTAL = 5000;
    let row = START_ROW;
    let totalScanned = 0;
    let totalInserted = 0;
    let first = true;

    try {
      while (true) {
        const res = await runSync({
          data: { startRow: row, chunkSize: CHUNK, reset: reset && first },
        });
        first = false;
        totalScanned += res.scanned;
        totalInserted += res.inserted;
        setScanned(totalScanned);
        setInserted(totalInserted);
        setProgress(Math.min(99, Math.round((totalScanned / APPROX_TOTAL) * 100)));
        if (res.done) break;
        row = res.nextRow;
      }
      await runFinalize({ data: { total: totalInserted } });
      setProgress(100);
      qc.invalidateQueries();
      toast.success(`Sincronização concluída: ${totalInserted.toLocaleString("pt-BR")} linhas.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(`Falha na sincronização: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sincronizar do Google Sheets</h1>
        <p className="text-sm text-muted-foreground">
          Puxa os dados diretamente da planilha oficial (apenas linhas da Zona 117).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" /> Fonte
          </CardTitle>
          <CardDescription>
            Planilha: <b>Mapa de Votos - Fortaleza - Zona 117 - 2022</b> · aba{" "}
            <code>MUNIC-RES-RESEC-…FORTALEZA.CSV</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {status.data?.last_sync_at ? (
            <div className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
              Última sincronização:{" "}
              <b>{new Date(status.data.last_sync_at).toLocaleString("pt-BR")}</b> ·{" "}
              {status.data.total_rows?.toLocaleString("pt-BR")} linhas
            </div>
          ) : (
            <div className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
              Nenhum dado carregado ainda.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="reset"
              checked={reset}
              onCheckedChange={(c) => setReset(Boolean(c))}
              disabled={running}
            />
            <Label htmlFor="reset" className="text-sm">
              Substituir dados existentes (recomendado)
            </Label>
          </div>

          {(running || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {scanned.toLocaleString("pt-BR")} linhas lidas ·{" "}
                {inserted.toLocaleString("pt-BR")} inseridas ({progress}%)
              </p>
            </div>
          )}

          <Button onClick={start} disabled={running} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Sincronizando..." : "Sincronizar agora"}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              <span className="break-all">{error}</span>
            </div>
          )}

          {!running && progress === 100 && !error && (
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Dados atualizados com sucesso.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
