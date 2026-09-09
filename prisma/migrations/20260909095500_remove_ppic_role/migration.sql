-- Remove the temporary "PPIC" value from the Role enum now that no rows
-- reference it (data migrated to "PM" in an out-of-band script before this
-- migration was created — see docs/DECISIONS.md D-012). Postgres has no
-- direct "DROP VALUE" for enums, so the type is recreated.
BEGIN;

ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('CEO', 'FINANCE', 'PM', 'PURCHASING', 'ACCOUNTING', 'LOGISTIC', 'SPV', 'QS', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "ProjectAssignment" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");

DROP TYPE "Role_old";

COMMIT;
