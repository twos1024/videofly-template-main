/**
 * Global Proxy Configuration
 *
 * This file configures undici global proxy for all Node.js fetch requests.
 * It should be imported as early as possible in the application lifecycle.
 *
 * IMPORTANT: Import this in your API routes or server-side code BEFORE making any fetch calls.
 */

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const DEBUG_PROXY = process.env.IS_DEBUG === "true";
type ProxyAgentCtor = new (proxyUrl: string) => unknown;
type UndiciLike = {
  ProxyAgent?: ProxyAgentCtor;
  setGlobalDispatcher?: (dispatcher: unknown) => void;
};
type ProxyState = {
  initialized: boolean;
  missingUndiciLogged: boolean;
};

const proxyState = (() => {
  const globalWithState = globalThis as typeof globalThis & {
    __videoflyProxyState?: ProxyState;
  };
  if (!globalWithState.__videoflyProxyState) {
    globalWithState.__videoflyProxyState = {
      initialized: false,
      missingUndiciLogged: false,
    };
  }
  return globalWithState.__videoflyProxyState;
})();

const loadUndici = (): UndiciLike | null => {
  try {
    const dynamicRequire = Function("return require")() as (id: string) => unknown;
    return dynamicRequire("undici") as UndiciLike;
  } catch {
    return null;
  }
};

if (PROXY_URL && !proxyState.initialized) {
  try {
    const undici = loadUndici();

    if (undici?.ProxyAgent && undici.setGlobalDispatcher) {
      const proxyAgent = new undici.ProxyAgent(PROXY_URL);
      undici.setGlobalDispatcher(proxyAgent);
      proxyState.initialized = true;
      if (DEBUG_PROXY) {
        console.log("[Proxy] Global proxy configured");
      }
    } else {
      if (!proxyState.missingUndiciLogged && DEBUG_PROXY) {
        proxyState.missingUndiciLogged = true;
        console.warn("[Proxy] Undici package not available, skipped proxy dispatcher setup");
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[Proxy] Failed to configure proxy dispatcher:", message);
  }
}

export {};
