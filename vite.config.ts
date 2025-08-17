import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Env & flags
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const isProd = mode === "production";
  const shouldKeepLogs = env.VITE_FORCE_LOGS === "true";
  const shouldDropConsole = isProd && !shouldKeepLogs;

  // Build-time logs (terminal only, aman)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Console Policy:`, {
      isDev,
      isProd,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
    });
  }
  if (isProd) {
    console.log("🔧 PRODUCTION BUILD - Console Policy:", {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
      consoleWillBe: shouldDropConsole ? "REMOVED" : "KEPT",
    });
  }

  // Plugins
  const plugins = [
    react({
      fastRefresh: isDev,
      // plugins: isDev ? [] : []
    }),
  ];
  if (isDev) plugins.push(componentTagger());

  // Global defines
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    __CONSOLE_ENABLED__: JSON.stringify(!shouldDropConsole),
    global: "globalThis",
    __ENABLE_PERFORMANCE_MONITOR__: JSON.stringify(isDev),
    __ENABLE_TIMEOUT_MONITORING__: JSON.stringify(
      isDev && env.VITE_MONITOR_TIMEOUTS !== "false"
    ),
  };

  return {
    define,

    server: {
      host: "::",
      port: 8080,
      open: false,
      strictPort: false,
      hmr: {
        overlay: true,
        timeout: 5000,
      },
    },

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),

        // Single React instances
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),

        // Scheduler single instance
        scheduler: path.resolve(__dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__dirname, "./node_modules/scheduler/tracing"),
      },
      dedupe: [
        "react",
        "react-dom",
        "scheduler",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },

    build: {
      target: "es2020",
      minify: isProd ? "esbuild" : false,
      sourcemap: isDev,

      rollupOptions: {
        output: {
          // Chunking strategy
          manualChunks: (id) => {
            if (id.includes("/react/") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-core";
            }
            if (id.includes("@radix-ui")) return "radix-ui";
            if (id.includes("@tanstack/react-query")) return "react-query";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "charts-chartjs";
            if (id.includes("recharts")) return "charts-recharts";
            if (id.includes("lucide-react") || id.includes("react-icons") || id.includes("@radix-ui/react-icons")) return "icons";
            if (id.includes("date-fns")) return "date-utils";
            if (id.includes("react-hook-form") || id.includes("@hookform")) return "forms";
            if (id.includes("node_modules")) return "vendor";
            if (id.includes("src/contexts")) return "contexts";
            if (id.includes("src/components/ui/")) return "ui-components";
            if (id.includes("src/components/financial/")) return "financial-components";
            if (id.includes("src/components/promoCalculator/")) return "promo-components";
            if (id.includes("src/components/profitAnalysis/")) return "profit-components";
            if (id.includes("src/components/dashboard/")) return "dashboard-components";
            if (id.includes("src/components/orders/")) return "orders-components";
            if (id.includes("src/components")) return "shared-components";
            if (id.includes("src/utils")) return "utils";
            return "main";
          },

          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",

          ...(isProd && {
            generatedCode: "es2015",
            interop: "compat",
            systemNullSetters: false,
          }),
        },

        external: [],

        onwarn(warning, warn) {
          if (!isDev && !env.VITE_SHOW_BUILD_WARNINGS) return;

          const critical = [
            "MISSING_EXPORT",
            "UNRESOLVED_IMPORT",
            "EMPTY_BUNDLE",
            "PLUGIN_ERROR",
            "CIRCULAR_DEPENDENCY",
          ];
          const isCritical = critical.includes(warning.code as string);

          if (isCritical) {
            const line = `${new Date().toISOString()} - CRITICAL ${warning.code}: ${warning.message}\n`;
            try {
              fs.appendFileSync("build-warnings.log", line);
            } catch {}
            warn(warning);
            return;
          }
          warn(warning);
        },
      },

      chunkSizeWarningLimit: isProd ? 800 : 5000,

      // Prod-only extras
      ...(isProd && {
        cssCodeSplit: true,
        assetsInlineLimit: 4096,
        modulePreload: {
          polyfill: true,
          resolveDependencies: (_filename, deps) => {
            const crit = ["react-core", "supabase"];
            return deps.sort((a, b) => {
              const ac = crit.some((c) => a.includes(c));
              const bc = crit.some((c) => b.includes(c));
              return (bc ? 1 : 0) - (ac ? 1 : 0);
            });
          },
        },
      }),
    },

    // Global esbuild (code transform) — tempat drop console
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
      ...(isDev && {
        keepNames: true,
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: false,
      }),
      ...(isProd && shouldKeepLogs && {
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        keepNames: false,
      }),
      ...(isProd && !shouldKeepLogs && {
        drop: ["console", "debugger"], // ⬅️ ini yang memastikan console hilang di PROD
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        keepNames: false,
      }),
      define: { global: "globalThis" },
    },

    optimizeDeps: {
      include: [
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "scheduler",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "@supabase/supabase-js",
        "@supabase/gotrue-js",
        "@supabase/realtime-js",
        "chart.js",
        "react-chartjs-2",
        "recharts",
        "date-fns",
        "react-hook-form",
        "@hookform/resolvers",
        "zod",
        "sonner",
        "cmdk",
        "vaul",
        "react-day-picker",
      ],
      exclude: ["xlsx"],
      dedupe: ["react", "react-dom", "scheduler"],
      force: true,
      esbuildOptions: {
        target: "es2020",
        define: { global: "globalThis" },
        keepNames: isDev,
        minifyIdentifiers: isProd,
        minifySyntax: isProd,
        treeShaking: isProd,
      },
    },

    css: {
      devSourcemap: isDev,
      modules: { localsConvention: "camelCaseOnly" },
    },

    preview: {
      port: 4173,
      strictPort: false,
      open: false,
    },

    ...(isDev && {
      clearScreen: false,
    }),

    ...(isProd && {
      logLevel: shouldKeepLogs ? "info" : "warn",
    }),
  };
});
