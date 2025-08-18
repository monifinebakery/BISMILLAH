// src/utils/logger.ts — dev selalu bunyi; prod silent kecuali di-force/preview/whitelist

// ---------- ENV ----------
const env = import.meta.env as any;
const IS_DEV = !!env?.DEV;
const FORCE_LOGS = String(env?.VITE_FORCE_LOGS || "").trim().toLowerCase() === "true";
const NETLIFY_CONTEXT = String(env?.VITE_NETLIFY_CONTEXT || "").trim(); // "production" | "deploy-preview" | "branch-deploy"

// ---------- LEVEL ----------
type Level = "debug" | "warn" | "error";
function normalizeLevel(raw: unknown): Level {
  const v = String(raw ?? "error").toLowerCase().trim();
  return v === "debug" || v === "warn" || v === "error" ? v : "error";
}
const DEBUG_LEVEL: Level = normalizeLevel(env?.VITE_DEBUG_LEVEL);
const levelRank = { debug: 0, warn: 1, error: 2 } as const;

// di DEV / FORCE abaikan level (selalu izinkan info-like & warn-like)
const allowInfoLike = IS_DEV || FORCE_LOGS || levelRank[DEBUG_LEVEL] <= levelRank.debug;
const allowWarnLike = IS_DEV || FORCE_LOGS || levelRank[DEBUG_LEVEL] <= levelRank.warn;

// ---------- HOST GUARDS ----------
const PROD_HOSTS = new Set<string>([
  "kalkulator.monifine.my.id",
  "www.kalkulator.monifine.my.id",
]);
function isProductionHostname(h: string) {
  return PROD_HOSTS.has(h);
}
function isNetlifyHost(h: string) {
  return h.endsWith("netlify.app");
}

// ENV lists (aman kalau kosong)
const ENV_DEV_HOSTS = String(env?.VITE_DEV_HOSTS || "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

const DISABLE_LOGS_HOSTS = String(env?.VITE_DISABLE_LOGS_ON_HOSTS || "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

// ---------- SHOULD_LOG ----------
function getShouldLog(): boolean {
  // 1) Local dev & forced
  if (IS_DEV) return true;
  if (FORCE_LOGS) return true;

  // 2) Netlify context (dari build-time via VITE_NETLIFY_CONTEXT)
  //    deploy-preview & branch-deploy => aktif; production => silent
  if (NETLIFY_CONTEXT === "deploy-preview" || NETLIFY_CONTEXT === "branch-deploy") {
    return true;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;

    // 3) QoL: localhost / 127.* / *.local
    if (host === "localhost" || host.startsWith("127.") || host.endsWith(".local")) {
      return true;
    }

    // 4) Host-explicit off
    if (DISABLE_LOGS_HOSTS.includes(host)) return false;

    // 5) Host-explicit allow
    if (ENV_DEV_HOSTS.length > 0 && ENV_DEV_HOSTS.includes(host)) return true;

    // 6) Netlify non-prod host (*.netlify.app) — tetap allow,
    //    selama bukan production custom domain
    if (isNetlifyHost(host) && !isProductionHostname(host)) return true;

    // 7) Production custom domain => silent
    if (isProductionHostname(host)) return false;
  }

  // 8) Default: silent
  return false;
}
const SHOULD_LOG = getShouldLog();

// ---------- GUARDS ----------
const hasConsole = typeof console !== "undefined";
function canInfo()  { return hasConsole && SHOULD_LOG && allowInfoLike; }
function canWarn()  { return hasConsole && SHOULD_LOG && allowWarnLike; }
function canError() { return hasConsole && SHOULD_LOG; }
function canAny()   { return hasConsole && SHOULD_LOG; }

// ---------- API ----------
export const logger = {
  test(): void {
    if (!canAny()) return;
    const payload = {
      isDev: IS_DEV,
      forceLogs: FORCE_LOGS,
      level: DEBUG_LEVEL,
      shouldLog: SHOULD_LOG,
      netlifyContext: NETLIFY_CONTEXT || null,
      host: typeof window !== "undefined" ? window.location.hostname : null,
    };
    console.log("Logger test", payload);
  },

  info(message: string, data?: unknown): void {
    if (!canInfo()) return;
    typeof data !== "undefined" ? console.log(message, data) : console.log(message);
  },

  debug(message: string, data?: unknown): void {
    const canDebug =
      (IS_DEV || FORCE_LOGS || DEBUG_LEVEL === "debug") &&
      SHOULD_LOG &&
      hasConsole;
    if (!canDebug) return;
    typeof data !== "undefined" ? console.debug(message, data) : console.debug(message);
  },

  warn(message: string, data?: unknown): void {
    if (!canWarn()) return;
    typeof data !== "undefined" ? console.warn(message, data) : console.warn(message);
  },

  error(message: string, err?: unknown): void {
    if (!canError()) return;
    typeof err !== "undefined" ? console.error(message, err) : console.error(message);
  },

  success(message: string, data?: unknown): void {
    if (!canAny()) return;
    typeof data !== "undefined" ? console.log(message, data) : console.log(message);
  },

  perf(operation: string, durationMs: number, data?: unknown): void {
    if (!canAny()) return;
    const msg = `PERF ${operation}: ${String(durationMs)}ms`;
    typeof data !== "undefined" ? console.log(msg, data) : console.log(msg);
  },

  context(ctx: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[${ctx}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  component(name: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[C:${name}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  hook(name: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[H:${name}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  api(endpoint: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[API:${endpoint}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  criticalError(message: string, err?: unknown): void {
    if (!canError()) return;
    const head = `CRITICAL ${message}`;
    typeof err !== "undefined" ? console.error(head, err) : console.error(head);
  },

  payment(stage: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[PAY:${stage}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  orderVerification(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[ORDER-VERIFY]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  accessCheck(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[ACCESS-CHECK]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  linking(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[LINKING]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  cache(op: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[CACHE:${op}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },

  flow(step: number, stage: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[FLOW ${String(step)}:${stage}]`;
    typeof data !== "undefined" ? console.log(head, message, data) : console.log(head, message);
  },
};

// ---------- Optional expose (dev/preview only) ----------
if (typeof window !== "undefined" && SHOULD_LOG) {
  (window as any).__LOGGER__ = logger;
  (window as any).__DEBUG_PAYMENT__ = {
    test() {
      logger.orderVerification("test log");
      logger.payment("TEST", "payment log");
      logger.linking("linking log");
    },
    status() {
      logger.info("Logger status", {
        shouldLog: SHOULD_LOG,
        isDev: IS_DEV,
        forceLogs: FORCE_LOGS,
        level: DEBUG_LEVEL,
        host: window.location.hostname,
        netlifyContext: NETLIFY_CONTEXT || null,
      });
    },
    forceEnableHint() {
      logger.info("Set VITE_FORCE_LOGS=true to enable logs in production");
    },
  };
}
