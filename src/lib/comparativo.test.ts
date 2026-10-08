import { describe, it, expect } from "vitest";
import { compararSecoes } from "./comparativo";

const base = { aptos: 300, local_votacao: "Escola", bairro: "JARI" };

describe("compararSecoes", () => {
  it("casa a mesma seção entre 2022 e 2026 mesmo com zeros à esquerda", () => {
    const r = compararSecoes(
      [
        { ...base, ano: 2022, zona: "0122", secao: "0031", candidato: "DAVID DURAND", votos: 10 },
        { ...base, ano: 2026, zona: "122", secao: "31", candidato: "DAVID DURAND", votos: 4 },
      ],
      ["DAVID DURAND"],
    );
    expect(r).toHaveLength(1);
    expect(r[0].diff).toBe(-6);
    expect(r[0].diffPct).toBe(-60);
  });

  it("soma os aliados só dos candidatos escolhidos", () => {
    const r = compararSecoes(
      [
        { ...base, ano: 2026, zona: "117", secao: "1", candidato: "DAVID DURAND", votos: 8 },
        { ...base, ano: 2026, zona: "117", secao: "1", candidato: "RONALDO MARTINS", votos: 10 },
      ],
      ["DAVID DURAND", "RONALDO MARTINS"],
    );
    expect(r[0].v2026).toBe(18);
    expect(r[0].em2022).toBe(false);
    expect(r[0].ef2026).toBe(6);
  });
});

import { gerarInsights as _gi, compararSecoes as _cs } from "./comparativo";
describe("gerarInsights", () => {
  it("reporta queda geral e seção zerada", () => {
    const rows = [
      { ano: 2022, zona: "117", secao: "1", candidato: "DAVID DURAND", votos: 10, aptos: 100, local_votacao: "A", bairro: "X" },
      { ano: 2026, zona: "117", secao: "1", candidato: "DAVID DURAND", votos: 0, aptos: 100, local_votacao: "A", bairro: "X" },
    ];
    const ins = _gi(_cs(rows, ["DAVID DURAND"]));
    expect(ins[0].titulo).toBe("Queda geral");
    expect(ins.some((i) => i.titulo === "1 seções zeraram em 2026")).toBe(true);
  });
});
