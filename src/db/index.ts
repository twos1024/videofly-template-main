import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveDatabaseUrl, validateDatabaseUrl } from "@/lib/env/database-url";
import * as schema from "./schema";

const databaseUrl = (() => {
  const resolved = resolveDatabaseUrl(process.env);
  if (!resolved) return null;
  return validateDatabaseUrl(resolved);
})();
const isLocalDatabase =
  databaseUrl?.includes("localhost") || databaseUrl?.includes("127.0.0.1");
const isNeonPooler =
  databaseUrl?.includes("-pooler.") || databaseUrl?.includes("pooler.neon.");
const createMissingDatabaseProxy = () => {
  const throwMissingDatabase = () => {
    throw new Error(
      "Missing DATABASE_URL/POSTGRES_URL env var. Configure your PostgreSQL connection before using DB-backed features."
    );
  };

  let proxy: unknown;
  proxy = new Proxy(throwMissingDatabase, {
    get() {
      return proxy;
    },
    apply() {
      throwMissingDatabase();
    },
  });

  return proxy;
};

const missingDatabaseProxy = createMissingDatabaseProxy();

const sql = databaseUrl
  ? postgres(databaseUrl, {
    max: 10,
    ssl: isLocalDatabase ? undefined : "require",
    prepare: isNeonPooler ? false : undefined,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  })
  : null;

export const db =
  (sql ? drizzle(sql, { schema }) : missingDatabaseProxy) as ReturnType<
    typeof drizzle
  >;

export { sql };
export * from "./schema";
