import path from "node:path";
import { defineConfig } from "prisma/config";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = dbUrl.replace(/^file:/, "");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: `file:${dbPath}`,
  },
});
