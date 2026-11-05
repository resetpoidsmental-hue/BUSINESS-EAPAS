import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const client = new PrismaClient({ adapter });

  // Sans ça, SQLite est en mode journal par défaut : un cron ou un webhook qui écrit pile au
  // moment où une page fait plusieurs lectures en parallèle (ex. Administratif) déclenche un
  // "database is locked" immédiat, qui casse la requête. WAL permet des lectures concurrentes
  // pendant une écriture, et busy_timeout fait réessayer au lieu d'échouer sur le reste des cas.
  client.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch((e) => console.error("PRAGMA journal_mode:", e));
  client.$executeRawUnsafe("PRAGMA busy_timeout = 5000;").catch((e) => console.error("PRAGMA busy_timeout:", e));

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
