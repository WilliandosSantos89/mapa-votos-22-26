import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, UserRound } from "lucide-react";
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
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Ronaldo Martins", url: "/ronaldo-martins", icon: UserRound },
  { title: "David Durand", url: "/david-durand", icon: UserRound },
] as const;


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
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
                    <Link to={item.url} className="flex items-center gap-2">
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
