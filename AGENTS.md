<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Votes table holds multiple election years in column `ano`; the main dashboard (/) compares both years via getVotosComparativo, while the full-candidate 2022 analysis (/analise-2022) and candidate pages filter ano=2022 and the Sheets sync only replaces 2022 rows, so imported years are never wiped.
