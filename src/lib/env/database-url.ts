const LOCAL_DATABASE_EXAMPLE =
  "postgresql://postgres:postgres@127.0.0.1:5432/pexelmuse";
const REMOTE_DATABASE_EXAMPLE =
  "postgresql://username:password@db.example.com:5432/pexelmuse?sslmode=require";

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv) {
  return env.DATABASE_URL ?? env.POSTGRES_URL;
}

export function validateDatabaseUrl(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL/POSTGRES_URL env var. Set a real PostgreSQL connection string before running DB commands."
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(
      "Invalid DATABASE_URL/POSTGRES_URL format. Expected a full PostgreSQL URL, for example " +
        `${REMOTE_DATABASE_EXAMPLE}`
    );
  }

  const placeholderMatches = [
    parsedUrl.hostname === "host",
    parsedUrl.username === "user",
    parsedUrl.password === "password",
    parsedUrl.pathname === "/database",
  ].filter(Boolean).length;

  if (placeholderMatches >= 2) {
    throw new Error(
      "DATABASE_URL/POSTGRES_URL is still using template placeholder values. Replace it with a real PostgreSQL URL. " +
        `Local example: ${LOCAL_DATABASE_EXAMPLE} . Managed DB example: ${REMOTE_DATABASE_EXAMPLE}`
    );
  }

  return databaseUrl;
}
