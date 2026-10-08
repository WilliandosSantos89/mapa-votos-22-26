// Aliases e cores para os candidatos em destaque
export const CANDIDATO_RONALDO = "RONALDO MARTINS";
export const CANDIDATO_DAVID = "DAVID DURAND";
export const FOCUS_CANDIDATOS = [CANDIDATO_RONALDO, CANDIDATO_DAVID] as const;

export const CANDIDATO_CORES: Record<string, string> = {
  [CANDIDATO_RONALDO]: "var(--ronaldo)",
  [CANDIDATO_DAVID]: "var(--david)",
};

export function corDoCandidato(nome: string, fallback = "var(--chart-3)") {
  return CANDIDATO_CORES[nome] ?? fallback;
}

// Nome exibido de forma amigável
export function displayCandidato(nome: string) {
  return nome
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (m) => m.toLocaleUpperCase("pt-BR"));
}
