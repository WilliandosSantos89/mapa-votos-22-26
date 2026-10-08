# Adicionar dados de 2026 e comparar com 2022

## O que a análise mostrou
- A planilha nova tem 80 seções (zonas 117 Fortaleza e 122 Maracanaú), bairros SIQUEIRA, JARI e JAÇANAÚ, com votos de David Durand (182) e Ronaldo Martins (445).
- Os dados atuais (2022) usam as mesmas zonas e seções, então dá para casar seção a seção (zona + seção) e comparar os dois anos.
- A planilha nova não informa o cargo; vamos assumir os mesmos de 2022 (David: Deputado Estadual, Ronaldo: Deputado Federal).

## O que será feito
1. **Ano nos votos**: todo registro passa a ter um ano. Os existentes viram 2022; os da planilha viram 2026.
2. **Importar o arquivo**: carregar as 80 seções (2 linhas por seção, uma por candidato), com aptos, local de votação e bairro (o bairro também alimenta o cadastro de bairros dos locais).
3. **A sincronização com o Google Sheets** continua atualizando só 2022, sem apagar 2026.
4. **Novos filtros (em todas as páginas)**: Ano (2022 / 2026 / Comparar), Município/Zona, Bairro, Local de votação, Candidato.
5. **Novas análises**:
   - Comparativo 2022 x 2026 por candidato: total de votos, variação absoluta e %.
   - Crescimento/queda por bairro, local e seção (ranking "onde ganhamos" e "onde perdemos").
   - Eficiência (votos ÷ aptos) por seção nos dois anos.
   - Total de aliados (David + Ronaldo) por seção, com ranking de seções prioritárias.
   - Mapa colorido pela variação entre os anos.
   - Seções presentes em só um dos anos destacadas.

## Detalhes técnicos
- Migração: `alter table votos add column ano int not null default 2022`, coluna `bairro text`; índice (ano, zona, secao).
- Import via INSERT em migração a partir do CSV (municipio derivado da zona: 117→FORTALEZA, 122→MARACANAÚ; nomes de candidato em maiúsculas iguais aos de 2022).
- `syncFromSheets`: reset apaga apenas `ano = 2022`.
- `votos.functions.ts`: parâmetro `ano` e nova função de comparativo; filtros persistidos na URL (search params).
