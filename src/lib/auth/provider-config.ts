import "server-only";

import { env } from "./env.mjs";
import type { AuthProvidersConfig } from "./provider-config.types";

export function getAuthProvidersConfig(): AuthProvidersConfig {
  const google = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const magicLink = Boolean(env.RESEND_API_KEY && env.RESEND_FROM);

  return {
    google,
    magicLink,
    hasAny: google || magicLink,
    defaultProvider: google ? "google" : magicLink ? "email" : null,
  };
}
