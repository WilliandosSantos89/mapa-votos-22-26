import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, GitCompare, Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileNavigation() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Navegação principal no celular" className="mobile-navigation fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background md:hidden">
      {[{ to: "/", label: "Visão geral", icon: BarChart3 }, { to: "/comparativo", label: "Comparar", icon: GitCompare }, { to: "/sincronizar", label: "Atualizar dados", icon: RefreshCw }].map(({ to, label, icon: Icon }) => (
        <Button key={to} asChild variant="ghost" className={`h-16 min-w-0 flex-col gap-1 rounded-none px-1 text-[11px] ${pathname === to ? "bg-accent text-primary" : "text-muted-foreground"}`}>
          <Link to={to} aria-current={pathname === to ? "page" : undefined}><Icon className="h-5 w-5 shrink-0" />{label}</Link>
        </Button>
      ))}
      <Button variant="ghost" onClick={() => setOpenMobile(true)} className="h-16 min-w-0 flex-col gap-1 rounded-none px-1 text-[11px] text-muted-foreground"><Menu className="h-5 w-5" />Menu</Button>
    </nav>
  );
}