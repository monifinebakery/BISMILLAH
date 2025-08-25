import type { SupabaseClient } from "@supabase/supabase-js";
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
  }

  interface GlobalThis {
    scheduler?: Scheduler;
  }
}

export {};
