import { Link, useRouterState } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";

export function FloatingSyncButton() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname === "/sincronizar") return null;

  return (
    <Link
      to="/sincronizar"
      aria-label="Atualizar dados"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded border border-border bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
      <span className="hidden sm:inline">Atualizar dados</span>
    </Link>
  );
}
