# Plano — Refinamento visual e de experiência

Objetivo: elevar o acabamento do dashboard (Zona 117) com micro-interações, gráficos mais expressivos e hierarquia visual mais clara, mantendo a paleta Republicanos 10 e as fontes Lato/Roboto/PT Sans já definidas.

## 1. Hero e cabeçalho
- Hero com fundo em gradiente sutil (azul → preto) + textura de grid/pontos animada em CSS.
- Badge "Zona 117 • Fortaleza • 2022" acima do H1 com ícone.
- Contador animado (count-up) nos KPIs principais (Total Aliança, %, Locais, Seções).
- Divisor decorativo com as 3 cores da marca (azul/amarelo/verde) abaixo do hero.

## 2. Cards e KPIs
- Cards com `border` sutil + hover: leve elevação (`shadow`), translate-y -2px, borda muda para cor de destaque.
- Barra de progresso fina (2px) no topo do card usando cor semântica (verde = forte, amarelo = médio, vermelho = fraco).
- Ícone circular colorido em cada KPI (Lucide) com fundo suave (`bg-primary/10`).
- Sparkline (mini gráfico) dentro dos cards de KPI mostrando distribuição por seção.

## 3. Gráficos (Recharts)
- Gradiente vertical nas barras (`<linearGradient>` — azul topo, azul escuro base) em vez de cor sólida.
- `activeBar` com destaque (opacidade e borda) no hover.
- Tooltip customizado: fundo escuro translúcido, título em Roboto caixa-alta, valor grande, % secundário, borda colorida à esquerda.
- Animação de entrada dos gráficos (`animationDuration: 800`, `animationEasing: 'ease-out'`) disparada no reveal-in.
- Cursor do tooltip com `fill: rgba(...) muito sutil` em vez do cinza padrão.
- Adicionar gráfico novo: **Treemap** de locais de votação (tamanho = total de votos, cor = % da aliança) — visual de "mapa de calor" muito útil para estratégia.
- Adicionar **Radar chart** comparando os dois candidatos por top-locais (visão de cobertura).
- Legendas com bullets circulares coloridos + tipografia menor e uppercase.

## 4. Tabela de diagnóstico
- Linhas com `hover:bg-muted/50` e transição.
- Coluna % com barra de progresso horizontal inline (bg colorido por faixa: <20% vermelho, 20-40% amarelo, >40% verde).
- Header sticky ao rolar.
- Badges arredondados nos rótulos "Consolidado / Atacar / Neutro".
- Ícones de tendência (seta) opcionais.

## 5. Micro-interações e motion
- Reveal-in em cascata (stagger) já existe — reforçar com `translate-y-4 → 0` mais suave e delay incremental por card.
- Hover em links da sidebar: barra vertical colorida à esquerda animada (scale-y).
- Skeleton loaders (shimmer) enquanto os dados carregam, no lugar de "Carregando…".
- Transição de página suave (fade curto) entre rotas.

## 6. Sidebar e navegação
- Item ativo com fundo em gradiente sutil + borda esquerda em amarelo (cor de destaque da marca).
- Avatar/ícone dos candidatos ao lado do nome no menu.
- Rodapé da sidebar com versão + selo "Republicanos 10".

## 7. Perfis dos candidatos
- Foto com máscara em formato "arco" ou moldura em gradiente da marca.
- Seção de estatísticas com números grandes (Roboto, tracking apertado) estilo editorial.
- Card de contato com ícones sociais coloridos ao hover (cor original de cada rede).
- Timeline vertical com marcos/biografia.

## 8. Detalhes finos
- Aumentar `letter-spacing` em headings Roboto uppercase (já feito no hero, estender para seções).
- Rótulos de seção com número "01/", "02/" em cor de destaque + linha horizontal ao lado.
- Scrollbar customizada (fina, cor da marca).
- Favicon e og:image atualizados para identidade Republicanos.

## Detalhes técnicos
- Gráficos: usar `<defs><linearGradient/></defs>` do Recharts; extrair `CustomTooltip` e `CustomLegend` para `src/components/charts/`.
- Count-up: hook próprio com `requestAnimationFrame` (sem dependência nova).
- Treemap e Radar: componentes já inclusos no Recharts (sem instalar nada).
- Skeleton: componente shadcn `Skeleton` já disponível.
- Todas as cores via tokens semânticos em `src/styles.css` — nada hardcoded.
- Sem mudanças em lógica de dados nem em server functions.

## Fora de escopo
- Alteração da paleta ou tipografia.
- Novas fontes de dados ou filtros.
- Mudanças no schema do banco.
