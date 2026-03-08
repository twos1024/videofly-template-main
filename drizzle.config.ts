import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { resolveDatabaseUrl, validateDatabaseUrl } from "./src/lib/env/database-url";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const databaseUrl = validateDatabaseUrl(resolveDatabaseUrl(process.env));

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
