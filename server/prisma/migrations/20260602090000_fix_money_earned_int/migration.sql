-- Чиним legacy-колонку moneyEarned: в части прод-БД она осталась TEXT со строками
-- вроде "0 ₽" / "20 000 ₽" (схема менялась String→Int, но тип колонки не сконвертировался).
-- Нормализуем значения и приводим тип к INTEGER. Идемпотентно: на уже-INTEGER колонке
-- USING-каст просто пересчитает те же числа.

ALTER TABLE "User" ALTER COLUMN "moneyEarned" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "moneyEarned" TYPE INTEGER
  USING COALESCE(NULLIF(regexp_replace("moneyEarned"::text, '[^0-9]', '', 'g'), ''), '0')::integer;

ALTER TABLE "User" ALTER COLUMN "moneyEarned" SET DEFAULT 0;
ALTER TABLE "User" ALTER COLUMN "moneyEarned" SET NOT NULL;
