// src/utils/logger.ts — dev selalu bunyi; prod silent kecuali di-force/preview/whitelist

// ---------- ENV ----------
const env = import.meta.env as any;
const IS_DEV = !!env?.DEV;
const FORCE_LOGS = String(env?.VITE_FORCE_LOGS || "").toLowerCase() === "true";

// ---------- LEVEL ----------
type Level = "debug" | "warn" | "error";
function normalizeLevel(raw: unknown): Level {
  const v = String(raw ?? "error").toLowerCase().trim();
  return v === "debug" || v === "warn" || v === "error" ? v : "error";
}
const DEBUG_LEVEL: Level = normalizeLevel(env?.VITE_DEBUG_LEVEL);
const levelRank = { debug: 0, warn: 1, error: 2 } as const;

// ✅ di DEV / FORCE, abaikan level (selalu izinkan)
const allowInfoLike =
  IS_DEV || FORCE_LOGS || levelRank[DEBUG_LEVEL] <= levelRank.debug;
const allowWarnLike =
  IS_DEV || FORCE_LOGS || levelRank[DEBUG_LEVEL] <= levelRank.warn;

// ---------- HOST GUARDS ----------
const PROD_HOSTS = new Set<string>([
  "kalkulator.monifine.my.id",
  "www.kalkulator.monifine.my.id"
]);
function isProductionHostname(h: string) {
  return PROD_HOSTS.has(h);
}
function isNetlifyPreview(h: string) {
  return h.includes("netlify.app") && !isProductionHostname(h);
}

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
  if (IS_DEV) return true;
  if (FORCE_LOGS) return true;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;

    // QoL: allow localhost/127.*/*.local (sering dipakai saat preview)
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.endsWith(".local")
    )
      return true;

    if (DISABLE_LOGS_HOSTS.includes(host)) return false;

    if (ENV_DEV_HOSTS.length > 0) {
      if (ENV_DEV_HOSTS.includes(host)) return true;
    } else {
      if (isNetlifyPreview(host)) return true;
    }

    if (isProductionHostname(host)) return false;
  }
  return false; // default: silent di prod
}
const SHOULD_LOG = getShouldLog();

// ---------- GUARDS ----------
const hasConsole = typeof console !== "undefined";
function canInfo() {
  return hasConsole && SHOULD_LOG && allowInfoLike;
}
function canWarn() {
  return hasConsole && SHOULD_LOG && allowWarnLike;
}
function canError() {
  return hasConsole && SHOULD_LOG;
}
function canAny() {
  return hasConsole && SHOULD_LOG;
}

// ---------- API ----------
export const logger = {
  test(): void {
    if (!canAny()) return;
    const payload = {
      isDev: IS_DEV,
      forceLogs: FORCE_LOGS,
      level: DEBUG_LEVEL,
      shouldLog: SHOULD_LOG
    };
    console.log("Logger test", payload);
  },

  info(message: string, data?: unknown): void {
    if (!canInfo()) return;
    if (typeof data !== "undefined") console.log(message, data);
    else console.log(message);
  },

  debug(message: string, data?: unknown): void {
    // ✅ di DEV/FORCE tampil; kalau tidak, hanya saat level 'debug'
    const canDebug =
      (IS_DEV || FORCE_LOGS || DEBUG_LEVEL === "debug") &&
      SHOULD_LOG &&
      hasConsole;
    if (!canDebug) return;
    if (typeof data !== "undefined") console.debug(message, data);
    else console.debug(message);
  },

  warn(message: string, data?: unknown): void {
    if (!canWarn()) return;
    if (typeof data !== "undefined") console.warn(message, data);
    else console.warn(message);
  },

  error(message: string, err?: unknown): void {
    if (!canError()) return;
    if (typeof err !== "undefined") console.error(message, err);
    else console.error(message);
  },

  success(message: string, data?: unknown): void {
    if (!canAny()) return;
    if (typeof data !== "undefined") console.log(message, data);
    else console.log(message);
  },

  perf(operation: string, durationMs: number, data?: unknown): void {
    if (!canAny()) return;
    const msg = `PERF ${operation}: ${String(durationMs)}ms`;
    if (typeof data !== "undefined") console.log(msg, data);
    else console.log(msg);
  },

  context(ctx: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[${ctx}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  component(name: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[C:${name}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  hook(name: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[H:${name}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  api(endpoint: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[API:${endpoint}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  criticalError(message: string, err?: unknown): void {
    if (!canError()) return;
    const head = `CRITICAL ${message}`;
    if (typeof err !== "undefined") console.error(head, err);
    else console.error(head);
  },

  payment(stage: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[PAY:${stage}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  orderVerification(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[ORDER-VERIFY]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  accessCheck(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[ACCESS-CHECK]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  linking(message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[LINKING]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  cache(op: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[CACHE:${op}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  },

  flow(step: number, stage: string, message: string, data?: unknown): void {
    if (!canAny()) return;
    const head = `[FLOW ${String(step)}:${stage}]`;
    if (typeof data !== "undefined") console.log(head, message, data);
    else console.log(head, message);
  }
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
        host: window.location.hostname
      });
    },
    forceEnableHint() {
      logger.info("Set VITE_FORCE_LOGS=true to enable logs in production");
    }
  };
}
