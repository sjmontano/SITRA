CREATE TABLE IF NOT EXISTS resources_offchain(
  resource_id TEXT PRIMARY KEY,
  pdf_url TEXT NOT NULL,
  fotos TEXT[] DEFAULT '{}',
  seriales TEXT[] DEFAULT '{}',
  hash_evento TEXT NOT NULL,
  hash_pdf TEXT NOT NULL
);
