CREATE TABLE IF NOT EXISTS campanhas_disparadas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  instancia TEXT NOT NULL,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quantidade_numeros INTEGER NOT NULL,
  delay INTEGER NOT NULL DEFAULT 3,
  tipo_envio TEXT NOT NULL DEFAULT 'texto',
  imagem_url TEXT,
  mensagem TEXT
);
