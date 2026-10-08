import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { FloatingSyncButton } from "@/components/FloatingSyncButton";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-medium">404</h1>
        <p className="mt-4 text-muted-foreground">Página não encontrada.</p>
        <a href="/" className="mt-6 inline-block text-primary hover:underline">
          Voltar ao dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const err = error instanceof Error ? error : new Error(String(error));
  useEffect(() => {
    reportLovableError(err, { boundary: "root" });
  }, [err]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{err.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard Eleitoral — Zona 117 Fortaleza" },
      {
        name: "description",
        content:
          "Análise demográfica dos votos por local, seção e bairro na Zona 117 de Fortaleza (2022).",
      },
      { property: "og:title", content: "Dashboard Eleitoral — Zona 117 Fortaleza" },
      {
        property: "og:description",
        content: "Comparativo Ronaldo Martins × David Durand com filtros e gráficos dinâmicos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    const attach = () => {
      document.querySelectorAll(".animate-on-scroll:not(.is-visible)").forEach((el) => io.observe(el));
    };
    attach();
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur sm:gap-3 sm:px-4">
              <SidebarTrigger />
              <div className="min-w-0 truncate font-display text-[10px] font-semibold uppercase tracking-[0.15em] sm:text-sm sm:tracking-[0.2em]">
                ELEIÇÕES 2022 · 2026&nbsp;· FORTALEZA · MARACANAÚ
              </div>
            </header>
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
        <FloatingSyncButton />
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
