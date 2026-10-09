# 🗳️ Mapa de Votos — Fortaleza & Maracanaú (2022 × 2026)

> **Plataforma de inteligência eleitoral** que transforma dados brutos de votação por seção em insights estratégicos para tomada de decisão de campanha.

---

## 🎯 O problema que este projeto resolve

Campanhas políticas geram montanhas de dados (boletins de urna, planilhas do TSE, levantamentos internos), mas raramente conseguem responder rápido às perguntas que realmente importam:

- **Onde** a aliança cresceu ou perdeu votos entre duas eleições?
- **Quais seções eleitorais** zeraram e precisam de recuperação urgente?
- **Onde há eleitores aptos** com baixa conversão — ou seja, potencial a conquistar?
- **Quais bairros** merecem reforço de presença e quais já estão consolidados?

Este sistema responde tudo isso em segundos, comparando **seção por seção** as eleições de **2022 e 2026** para os candidatos aliados **David Durand** (Deputado Estadual) e **Ronaldo Martins** (Deputado Federal) em Fortaleza e Maracanaú (CE).

---

## ✨ Recursos principais

### 📊 Visão geral comparativa (2022 × 2026)
- Indicadores lado a lado: votos, eficiência (votos ÷ eleitores aptos), seções com voto e eleitores aptos — sempre com a variação entre os anos.
- Filtros por **candidato, zona eleitoral, bairro e local de votação**, com escopo "seções presentes nos dois anos" ou "todas".
- Gráficos por bairro, por local e por candidato.

### 🧠 Insights automáticos
O sistema gera leituras prontas para decisão:
- Crescimento ou queda geral nas seções comparáveis;
- **Bairro destaque** (maior ganho) e **bairro em queda** (maior perda);
- **Seções que zeraram** em 2026 — prioridade de recuperação;
- **Seções novas** que só existem em 2026;
- **Seções prioritárias**: muitos eleitores aptos e baixa eficiência — o maior potencial de conversão.

### 👤 Perfil dos candidatos
- Página individual por candidato com bio, eixos de atuação, contatos e desempenho eleitoral.

### 🔄 Sincronização sob demanda
- Importação dos dados de 2022 direto do **Google Sheets**, com sincronização incremental em lotes.
- Atualização **somente manual** (botão "Atualizar dados") — os dados ficam estáticos e estáveis entre sessões.

### 📱 Mobile first
- Layout pensado primeiro para celular, onde a equipe de campanha mais acessa: navegação inferior, filtros em painel recolhível, tabelas com rolagem horizontal e gráficos legíveis em telas pequenas.

---

## 🧱 Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | **React 19 + TanStack Start** (SSR, rotas por arquivo, server functions) |
| Estilo | **Tailwind CSS v4 + shadcn/ui** com tokens semânticos |
| Gráficos | **Recharts** |
| Backend / Banco | **Lovable Cloud** (PostgreSQL com Row Level Security) |
| Integração | **Google Sheets API** via conector seguro do Lovable |
| Qualidade | **Vitest** (testes da lógica de comparação) + TypeScript |

### Decisões de arquitetura
- **Comparação seção a seção**: os dois anos convivem na mesma tabela (`votos.ano`), permitindo cruzamento por chave `zona + seção` sem duplicar estruturas.
- **Lógica pura e testada**: toda a matemática de comparação (`compararSecoes`, `agrupar`, `gerarInsights`, `prioritarias`) vive em módulos puros cobertos por testes — a UI apenas renderiza.
- **Dados estáticos por padrão**: cache infinito no cliente; a atualização acontece só por ação explícita do usuário, evitando surpresas durante apresentações e análises.

---

## 📈 Relevância e impacto

Ferramentas de análise eleitoral desse nível costumam ser restritas a grandes campanhas com equipes de dados. Este projeto entrega o mesmo tipo de inteligência — **diagnóstico territorial, detecção de perdas e priorização de esforço** — em uma interface acessível, que roda no celular de qualquer coordenador de campanha.

Na prática, ele transforma uma planilha de milhares de linhas em uma **lista de prioridades acionável**: onde ir, o que recuperar e onde investir.

---

## 🚀 Executando localmente

```bash
bun install
bun run dev
# http://localhost:8080
```

---

## 🗂️ Estrutura

```text
src/
├── components/      # UI reutilizável (navegação, filtros, perfil de candidato)
├── lib/             # Lógica de dados e comparação (pura e testada)
├── routes/          # Páginas: visão geral, análise 2022, candidatos, sincronização
└── integrations/    # Clientes do backend (Lovable Cloud)
```

---

<p align="center">
  🗳️ <strong>Mapa de Votos</strong> — dados que viram estratégia.
</p>
