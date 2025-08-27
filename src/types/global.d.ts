import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface SchedulerHandle {
  id: ReturnType<typeof setTimeout>;
}

interface Scheduler {
  unstable_scheduleCallback: (priority: number, cb: () => void) => SchedulerHandle;
  unstable_cancelCallback: (handle?: SchedulerHandle) => void;
  unstable_shouldYield: () => boolean;
  unstable_requestPaint: () => void;
  unstable_now: () => number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface AppDebug {
  logger: typeof import("@/utils/logger").logger;
  testLogger: () => void;
  performance: {
    initTime: number;
    getCurrentTime: () => number;
    getInitDuration: () => number;
  };
  environment: {
    mode: string;
    vercelEnv: string | undefined;
    isDev: boolean;
    isProd: boolean;
    effectiveDev: boolean;
  };
}

declare global {
  interface Performance {
    memory?: MemoryInfo;
  }

  interface Window {
    appDebug?: AppDebug;
    supabase?: SupabaseClient<Database>;
    __DEBUG_AUTH_USER__?: User | null;
    __DEBUG_AUTH_READY__?: boolean;
    __DEBUG_AUTH_LOADING__?: boolean;
    __DEBUG_AUTH_SESSION__?: Session | null;
    __DEBUG_AUTH_VALIDATE__?: () => Promise<boolean>;
    __DEBUG_AUTH_DEBUG__?: () => Promise<unknown>;
  }

  interface GlobalThis {
    scheduler?: Scheduler;
  }
}

export {};
