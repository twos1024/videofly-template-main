export type AuthProvidersConfig = {
  google: boolean;
  magicLink: boolean;
  hasAny: boolean;
  defaultProvider: "google" | "email" | null;
};
