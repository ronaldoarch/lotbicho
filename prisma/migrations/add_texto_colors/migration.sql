-- AlterTable
ALTER TABLE "Tema" ADD COLUMN IF NOT EXISTS "textoLink" TEXT DEFAULT '#052370',
ADD COLUMN IF NOT EXISTS "textoParagrafo" TEXT DEFAULT '#1C1C1C',
ADD COLUMN IF NOT EXISTS "textoTitulo" TEXT DEFAULT '#1C1C1C';

-- Atualizar temas existentes com valores padrão
UPDATE "Tema" SET 
  "textoLink" = COALESCE("textoLink", "primaria"),
  "textoParagrafo" = COALESCE("textoParagrafo", "texto"),
  "textoTitulo" = COALESCE("textoTitulo", "texto")
WHERE "textoLink" IS NULL OR "textoParagrafo" IS NULL OR "textoTitulo" IS NULL;
