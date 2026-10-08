ALTER TABLE public.votos ADD COLUMN IF NOT EXISTS ano integer NOT NULL DEFAULT 2022;
ALTER TABLE public.votos ADD COLUMN IF NOT EXISTS bairro text;
CREATE INDEX IF NOT EXISTS votos_ano_zona_secao_idx ON public.votos (ano, zona, secao);