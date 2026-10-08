import { CANDIDATO_DAVID, CANDIDATO_RONALDO } from "./candidatos";

export type CandidatoPerfil = {
  nome: string;
  nomeExibicao: string;
  cargo: string;
  numero: string;
  foto: string;
  cor: string;
  bio: string[];
  endereco: string;
  telefone: string;
  email: string;
  redes: { label: string; url: string }[];
  eixos?: string[];
};

export const PERFIS: Record<string, CandidatoPerfil> = {
  [CANDIDATO_RONALDO]: {
    nome: CANDIDATO_RONALDO,
    nomeExibicao: "Ronaldo Martins",
    cargo: "Vereador — Fortaleza/CE",
    numero: "10.000",
    foto: "https://republicanos10.org.br/wp-content/uploads/2014/02/RonaldoMartins.png",
    cor: "var(--ronaldo)",
    bio: [
      "Ronaldo Machado Martins nasceu em 21 de janeiro de 1978, em São Paulo (SP). Apresentador de programa de TV, radialista, acadêmico em Direito e músico, começou cedo a trabalhar em prol da juventude cearense.",
      "Por meio do esporte, coordenou um grupo com mais de cinco mil jovens, ajudando no resgate de pessoas em situação de vulnerabilidade através de futebol, artes marciais e dança.",
      "Eleito vereador de Fortaleza pelo Republicanos, tem mandato voltado para juventude, esporte, cultura e ações sociais.",
    ],
    endereco:
      "Câmara Municipal de Fortaleza — Rua Dr. Thompson Bulcão, 830 · CEP 60810-460 · Gabinete 32",
    telefone: "(85) 3444-8346",
    email: "vereadorronaldomartins@cmfor.ce.gov.br",
    redes: [
      { label: "Instagram", url: "https://www.instagram.com/10ronaldomartins/" },
      { label: "Facebook", url: "https://www.facebook.com/10RonaldoMartins" },
      { label: "YouTube", url: "https://www.youtube.com/@10RonaldoMartins" },
      { label: "Twitter/X", url: "https://twitter.com/SouRonaldo10" },
    ],
    eixos: [
      "Juventude e esporte",
      "Cultura e evangelização",
      "Assistência social",
      "Segurança pública",
    ],
  },
  [CANDIDATO_DAVID]: {
    nome: CANDIDATO_DAVID,
    nomeExibicao: "David Durand",
    cargo: "Deputado Estadual — Ceará",
    numero: "10.100",
    foto: "https://republicanos10.org.br/wp-content/uploads/2015/02/David-duran.png",
    cor: "var(--david)",
    bio: [
      "David de Albuquerque Durand nasceu em Fortaleza (CE), no dia 09 de agosto de 1967. É casado com Neide Durand e pai de David Durand Filho. É Pastor Evangélico e Radialista.",
      "Foi eleito para o seu primeiro mandato como deputado estadual em 2014 com 53.608 votos e reeleito em mandatos seguintes ampliando sua base.",
      "É líder do Republicanos na Assembleia Legislativa do Ceará e membro da Executiva Estadual do Republicanos Ceará.",
    ],
    endereco: "Av. Desembargador Moreira, 2807 — Dionísio Torres · CEP 60.170-900 · Fortaleza/CE",
    telefone: "(85) 3277-2555 / 2553 / 2500",
    email: "david.durand@al.ce.gov.br",
    redes: [
      { label: "Instagram", url: "https://www.instagram.com/daviddurandoficial/" },
      { label: "Facebook", url: "https://www.facebook.com/DavidDurandOficial/" },
      { label: "YouTube", url: "https://www.youtube.com/@DavidDurandOficial" },
    ],
    eixos: [
      "Defesa da família",
      "Educação e valores cristãos",
      "Segurança pública",
      "Apoio a igrejas e entidades sociais",
    ],
  },
};
