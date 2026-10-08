import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, GitCompare, UserRound, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Visão geral 2022 x 2026", url: "/", icon: BarChart3 },
  { title: "Detalhe por seção", url: "/comparativo", icon: GitCompare },
  { title: "Análise completa 2022", url: "/analise-2022", icon: History },
  { title: "Ronaldo Martins", url: "/ronaldo-martins", icon: UserRound },
  { title: "David Durand", url: "/david-durand", icon: UserRound },
] as const;


export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 pt-4 pb-2">
          {!collapsed ? (
            <div className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
              Mapa de Votos
            </div>
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/20 text-primary font-semibold">
              M
            </div>
          )}
          {!collapsed && (
            <p className="text-xs text-muted-foreground whitespace-pre-line">{"\n"}</p>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url} onClick={() => setOpenMobile(false)} className="flex min-w-0 items-center gap-2 max-md:min-h-12">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
