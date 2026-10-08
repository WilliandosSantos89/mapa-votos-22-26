# 🗳️ Mapa de Votos — Fortaleza & Maracanaú

> **Dashboard de inteligência eleitoral para campanhas aliadas.**  
> Análise demográfica, regional e por local de votação para estratégia de campanha dos candidatos **Ronaldo Martins** e **David Durand**.

---

## 📌 Sobre este projeto

Este aplicativo consome dados de uma planilha do **Google Sheets** e transforma informações brutas de votação em painéis visuais interativos:

- 🗺️ **Filtros por região, município, zona, cargo e local de votação**
- 📊 **Gráficos dinâmicos** de penetração, comparecimento e ranking de locais
- 🎯 **Diagnóstico estratégico** identificando onde a aliança já é forte e onde precisa avançar
- 📱 **Layout responsivo** para desktop e mobile

A base técnica utiliza:
- ⚛️ **React 19 + TanStack Start**
- 🎨 **Tailwind CSS v4 + shadcn/ui**
- ☁️ **Lovable Cloud** (backend + banco de dados)
- 📈 **Recharts** para visualização de dados

---

## 🔌 GitHub API Connector

Este projeto pode se integrar com a **API do GitHub** via o conector oficial do Lovable.

### 🤔 Para que serve?

O connector `GitHub API` permite que o app leia e gerencie repositórios, issues, pull requests e outros recursos do GitHub diretamente pelo código do servidor.

Exemplos de uso neste projeto:
- 📁 Publicar relatórios de campanha em um repositório
- 🐛 Criar issues automaticamente a partir de alertas estratégicos
- 📑 Listar PRs e colaboradores para auditoria de código
- 🔄 Sincronizar releases com marcos da campanha

### 🔑 Como conectar

1. No editor Lovable, abra o menu **Conectores**.
2. Busque por **GitHub API** (`connector_id: github`).
3. Clique em **Conectar** e escolha uma das opções:
   - 🔵 **OAuth** (recomendado): login único com a conta GitHub.
   - 🔑 **Personal Access Token**: crie um token em [github.com/settings/tokens](https://github.com/settings/tokens) com os escopos necessários (`repo`, `read:user`, etc.).
4. Após conectar, o Lovable injeta as variáveis de ambiente no servidor:
   - `LOVABLE_API_KEY`
   - `GITHUB_API_KEY`

> ⚠️ **Nunca exponha essas chaves no frontend.** Elas devem ser lidas apenas dentro de `createServerFn`.

---

## 🛠️ Exemplo de uso no código

```typescript
import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

export const listarIssues = createServerFn({ method: "GET" })
  .handler(async () => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const githubKey = process.env["GITHUB_API_KEY"];

    if (!lovableKey || !githubKey) {
      throw new Error("GitHub API não está conectada.");
    }

    const owner = "seudono";
    const repo = "mapa-votos-fortaleza-maracanau";

    const response = await fetch(
      `${GATEWAY_URL}/repos/${owner}/${repo}/issues?state=open&per_page=10`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": githubKey,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error [${response.status}]: ${errorBody}`);
    }

    return response.json();
  });
```

---

## 🚀 Endpoints úteis do GitHub

| Recurso | Caminho (via gateway) |
|---------|------------------------|
| 📝 Listar issues | `/repos/{owner}/{repo}/issues` |
| 🔀 Listar pull requests | `/repos/{owner}/{repo}/pulls` |
| 👥 Listar colaboradores | `/repos/{owner}/{repo}/collaborators` |
| 🏷️ Listar releases | `/repos/{owner}/{repo}/releases` |
| 📂 Listar repositórios do usuário | `/user/repos` |

> 💡 Sempre use caminhos **sem barra inicial** após a URL base do gateway.

---

## 🧩 Estrutura do repositório

```text
src/
├── components/         # Componentes visuais reutilizáveis
├── hooks/              # Hooks customizados (touch detection, contadores)
├── integrations/       # Clientes Lovable Cloud
├── lib/                # Funções de dados e server functions
├── routes/             # Rotas TanStack (dashboard, perfis, sincronização)
└── styles.css          # Tokens de design e tema visual
```

---

## ⚙️ Configuração local

1. Clone o repositório via GitHub sync.
2. Instale as dependências:
   ```bash
   bun install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   bun run dev
   ```
4. Acesse `http://localhost:8080`.

---

## 📞 Suporte

- 📖 [Documentação do GitHub REST API](https://docs.github.com/en/rest)
- 🧩 [Documentação dos Connectors Lovable](https://docs.lovable.dev/integrations)
- 🐛 Para reportar bugs ou sugerir melhorias, use a aba de issues do repositório conectado.

---

<p align="center">
  🗳️ <strong>Mapa de Votos</strong> — dados que viram estratégia
</p>
