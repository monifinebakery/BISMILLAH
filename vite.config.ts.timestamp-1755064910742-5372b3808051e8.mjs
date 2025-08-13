// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const isProd = mode === "production";
  const shouldKeepLogs = env.VITE_FORCE_LOGS === "true";
  const shouldDropConsole = isProd && !shouldKeepLogs;
  if (isDev) {
    console.log(`\u{1F50D} Vite Mode: ${mode}`);
    console.log(`\u{1F50D} Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS
    });
  }
  if (isProd) {
    console.log("\u{1F527} PRODUCTION BUILD - Environment Check:", {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole
    });
  }
  const plugins = [
    react({
      fastRefresh: isDev
    })
  ];
  if (isDev) {
    plugins.push(componentTagger());
  }
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    global: "globalThis"
    // Biarkan import.meta.env yang pegang NODE_ENV/DEV/PROD
  };
  return {
    define,
    server: {
      host: "::",
      port: 8080,
      open: false,
      strictPort: false,
      hmr: {
        overlay: true
      }
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        // ✅ Force single React instances
        "react": path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
        "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__vite_injected_original_dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__vite_injected_original_dirname, "./node_modules/react/jsx-dev-runtime"),
        // ✅ Single scheduler instance
        "scheduler": path.resolve(__vite_injected_original_dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__vite_injected_original_dirname, "./node_modules/scheduler/tracing")
      },
      // ✅ Dedupe untuk modul duplikat
      dedupe: [
        "react",
        "react-dom",
        "scheduler",
        "react/jsx-runtime",
        "react/jsx-dev-runtime"
      ]
    },
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          // ✅ Chunking terkontrol
          manualChunks: (id) => {
            if (id.includes("/react/") && !id.includes("react-dom") && !id.includes("scheduler")) {
              return "react";
            }
            if (id.includes("react-dom") || id.includes("scheduler")) {
              return "react-dom";
            }
            if (id.includes("@radix-ui")) {
              return "radix-ui";
            }
            if (id.includes("@tanstack/react-query")) {
              return "react-query";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("chart.js") || id.includes("react-chartjs-2") || id.includes("recharts")) {
              return "charts";
            }
            if (id.includes("lucide-react") || id.includes("react-icons") || id.includes("@radix-ui/react-icons")) {
              return "icons";
            }
            if (id.includes("date-fns")) {
              return "date-utils";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform")) {
              return "forms";
            }
            if (id.includes("node_modules")) {
              return "vendor";
            }
            if (id.includes("src/contexts")) {
              return "contexts";
            }
            if (id.includes("src/components")) {
              return "components";
            }
            if (id.includes("src/utils")) {
              return "utils";
            }
            return "main";
          },
          // ✅ File naming + cache bust
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]"
        },
        external: [],
        onwarn(warning, warn) {
          if (!isDev && !env.VITE_SHOW_BUILD_WARNINGS) {
            return;
          }
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const isAppCode = warning.id && !warning.id.includes("node_modules");
          const criticalWarnings = [
            "MISSING_EXPORT",
            "UNRESOLVED_IMPORT",
            "EMPTY_BUNDLE",
            "PLUGIN_ERROR",
            "CIRCULAR_DEPENDENCY"
          ];
          const isCritical = criticalWarnings.includes(warning.code);
          if (isCritical) {
            const logEntry = `${timestamp} - CRITICAL ${warning.code}: ${warning.message}
`;
            fs.appendFileSync("build-warnings.log", logEntry);
            console.log("\u{1F6A8} CRITICAL WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   \u{1F4C1}", warning.id);
            warn(warning);
            return;
          }
          if (isAppCode && isDev) {
            console.log("\u26A0\uFE0F  APP WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   \u{1F4C1}", warning.id);
            warn(warning);
          }
        }
      },
      // Chunk size limits
      chunkSizeWarningLimit: isProd ? 800 : 5e3,
      minify: isProd ? "esbuild" : false,
      sourcemap: isDev ? true : false,
      // ✅ Production optimizations
      ...isProd && {
        cssCodeSplit: true,
        cssMinify: true,
        assetsInlineLimit: 4096
      }
    },
    optimizeDeps: {
      include: [
        // ✅ Core React
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        // Router
        "react-router-dom",
        // TanStack Query
        "@tanstack/react-query",
        // UI
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        // Supabase
        "@supabase/supabase-js",
        // Charts
        "chart.js",
        "react-chartjs-2",
        "recharts",
        // Date
        "date-fns",
        // Forms
        "react-hook-form",
        "@hookform/resolvers",
        "zod",
        // Utilities
        "sonner",
        "cmdk",
        "vaul",
        "react-day-picker"
      ],
      // ✅ Exclude large libraries
      exclude: [
        "xlsx"
      ],
      // ✅ Dedupe & force rebuild
      dedupe: ["react", "react-dom", "scheduler"],
      force: true,
      // ✅ ESBuild options for pre-bundling
      esbuildOptions: {
        target: "es2020",
        define: {
          global: "globalThis"
        }
      }
    },
    // ✅ CSS configuration
    css: {
      devSourcemap: isDev,
      modules: {
        localsConvention: "camelCaseOnly"
      }
    },
    // ✅ Preview configuration
    preview: {
      port: 4173,
      strictPort: false,
      open: false
    },
    // ✅ Global esbuild config
    esbuild: {
      logOverride: {
        "this-is-undefined-in-esm": "silent"
      },
      // ⛳️ CONDITIONAL: only drop console if not forced to keep logs
      ...shouldDropConsole && {
        drop: ["console", "debugger"],
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true
      },
      // ✅ When keeping logs in production, still minify but preserve console
      ...isProd && shouldKeepLogs && {
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true
        // Don't drop console when VITE_FORCE_LOGS=true
      },
      define: {
        global: "globalThis"
      }
    },
    ...isDev && {
      clearScreen: false
    },
    ...isProd && {
      logLevel: "warn"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgLy8gXHUyNzA1IEVudmlyb25tZW50IGRldGVjdGlvblxuICBjb25zdCBpc0RldiA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XG4gIGNvbnN0IGlzUHJvZCA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcbiAgXG4gIC8vIFx1MjcwNSBDaGVjayBpZiBsb2dzIHNob3VsZCBiZSBrZXB0IGluIHByb2R1Y3Rpb25cbiAgY29uc3Qgc2hvdWxkS2VlcExvZ3MgPSBlbnYuVklURV9GT1JDRV9MT0dTID09PSAndHJ1ZSc7XG4gIGNvbnN0IHNob3VsZERyb3BDb25zb2xlID0gaXNQcm9kICYmICFzaG91bGRLZWVwTG9ncztcblxuICAvLyBcdTI3MDUgRGVidWcgaW5mbyAob25seSBpbiBkZXYpXG4gIGlmIChpc0Rldikge1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgVml0ZSBNb2RlOiAke21vZGV9YCk7XG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwRCBFbnZpcm9ubWVudCBWYXJpYWJsZXM6YCwge1xuICAgICAgVklURV9ERUJVR19MRVZFTDogZW52LlZJVEVfREVCVUdfTEVWRUwsXG4gICAgICBWSVRFX0ZPUkNFX0xPR1M6IGVudi5WSVRFX0ZPUkNFX0xPR1MsXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI3MDUgRGVidWcgYnVpbGQgZW52aXJvbm1lbnQgKG9ubHkgZHVyaW5nIGJ1aWxkKVxuICBpZiAoaXNQcm9kKSB7XG4gICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQyNyBQUk9EVUNUSU9OIEJVSUxEIC0gRW52aXJvbm1lbnQgQ2hlY2s6Jywge1xuICAgICAgbW9kZSxcbiAgICAgIFZJVEVfRk9SQ0VfTE9HUzogZW52LlZJVEVfRk9SQ0VfTE9HUyxcbiAgICAgIHNob3VsZEtlZXBMb2dzLFxuICAgICAgd2lsbERyb3BDb25zb2xlOiBzaG91bGREcm9wQ29uc29sZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNzA1IFBsdWdpbiBjb25maWd1cmF0aW9uXG4gIGNvbnN0IHBsdWdpbnMgPSBbXG4gICAgcmVhY3Qoe1xuICAgICAgZmFzdFJlZnJlc2g6IGlzRGV2LFxuICAgIH0pXG4gIF07XG5cbiAgaWYgKGlzRGV2KSB7XG4gICAgcGx1Z2lucy5wdXNoKGNvbXBvbmVudFRhZ2dlcigpKTtcbiAgfVxuXG4gIC8vIFx1MjcwNSBEZWZpbmUgZ2xvYmFscyAtIFVQREFURUQgZm9yIGltcG9ydC5tZXRhLmVudiBjb21wYXRpYmlsaXR5XG4gIGNvbnN0IGRlZmluZSA9IHtcbiAgICBfX0RFVl9fOiBKU09OLnN0cmluZ2lmeShpc0RldiksXG4gICAgX19QUk9EX186IEpTT04uc3RyaW5naWZ5KGlzUHJvZCksXG4gICAgX19NT0RFX186IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgIC8vIEJpYXJrYW4gaW1wb3J0Lm1ldGEuZW52IHlhbmcgcGVnYW5nIE5PREVfRU5WL0RFVi9QUk9EXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBkZWZpbmUsXG5cbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIG92ZXJsYXk6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBwbHVnaW5zLFxuXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG5cbiAgICAgICAgLy8gXHUyNzA1IEZvcmNlIHNpbmdsZSBSZWFjdCBpbnN0YW5jZXNcbiAgICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0L2pzeC1ydW50aW1lXCIpLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0L2pzeC1kZXYtcnVudGltZVwiKSxcblxuICAgICAgICAvLyBcdTI3MDUgU2luZ2xlIHNjaGVkdWxlciBpbnN0YW5jZVxuICAgICAgICBcInNjaGVkdWxlclwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3NjaGVkdWxlclwiKSxcbiAgICAgICAgXCJzY2hlZHVsZXIvdHJhY2luZ1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3NjaGVkdWxlci90cmFjaW5nXCIpLFxuICAgICAgfSxcblxuICAgICAgLy8gXHUyNzA1IERlZHVwZSB1bnR1ayBtb2R1bCBkdXBsaWthdFxuICAgICAgZGVkdXBlOiBbXG4gICAgICAgIFwicmVhY3RcIixcbiAgICAgICAgXCJyZWFjdC1kb21cIixcbiAgICAgICAgXCJzY2hlZHVsZXJcIixcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgXSxcbiAgICB9LFxuXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogXCJlczIwMjBcIixcblxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAvLyBcdTI3MDUgQ2h1bmtpbmcgdGVya29udHJvbFxuICAgICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgICAvLyBDb3JlIFJlYWN0XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9yZWFjdC8nKSAmJiAhaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpICYmICFpZC5pbmNsdWRlcygnc2NoZWR1bGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZWFjdCBET00gKyBTY2hlZHVsZXJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3NjaGVkdWxlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtZG9tJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJhZGl4IFVJXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmFkaXgtdWknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGFuU3RhY2sgUXVlcnlcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC1xdWVyeSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTdXBhYmFzZVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoYXJ0c1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdjaGFydC5qcycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1jaGFydGpzLTInKSB8fCBpZC5pbmNsdWRlcygncmVjaGFydHMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2NoYXJ0cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJY29uc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtaWNvbnMnKSB8fCBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlYWN0LWljb25zJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdpY29ucyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBEYXRlIHV0aWxzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2RhdGUtZm5zJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdkYXRlLXV0aWxzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZvcm1zXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWhvb2stZm9ybScpIHx8IGlkLmluY2x1ZGVzKCdAaG9va2Zvcm0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Zvcm1zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFZlbmRvciBmYWxsYmFja1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBcHAgY2h1bmtzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9jb250ZXh0cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY29udGV4dHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy91dGlscycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndXRpbHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICdtYWluJztcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgLy8gXHUyNzA1IEZpbGUgbmFtaW5nICsgY2FjaGUgYnVzdFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIgOiBcImFzc2V0cy9bbmFtZV0uanNcIixcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiIDogXCJhc3NldHMvW25hbWVdLmpzXCIsXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IGlzUHJvZCA/IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF1cIiA6IFwiYXNzZXRzL1tuYW1lXS5bZXh0XVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIGV4dGVybmFsOiBbXSxcblxuICAgICAgICBvbndhcm4od2FybmluZywgd2Fybikge1xuICAgICAgICAgIC8vIFNraXAgd2FybmluZ3MgaW4gcHJvZHVjdGlvbiB1bmxlc3MgcmVxdWVzdGVkXG4gICAgICAgICAgaWYgKCFpc0RldiAmJiAhZW52LlZJVEVfU0hPV19CVUlMRF9XQVJOSU5HUykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICBjb25zdCBpc0FwcENvZGUgPSB3YXJuaW5nLmlkICYmICF3YXJuaW5nLmlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpO1xuXG4gICAgICAgICAgY29uc3QgY3JpdGljYWxXYXJuaW5ncyA9IFtcbiAgICAgICAgICAgIFwiTUlTU0lOR19FWFBPUlRcIixcbiAgICAgICAgICAgIFwiVU5SRVNPTFZFRF9JTVBPUlRcIixcbiAgICAgICAgICAgIFwiRU1QVFlfQlVORExFXCIsXG4gICAgICAgICAgICBcIlBMVUdJTl9FUlJPUlwiLFxuICAgICAgICAgICAgXCJDSVJDVUxBUl9ERVBFTkRFTkNZXCIsXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIGNvbnN0IGlzQ3JpdGljYWwgPSBjcml0aWNhbFdhcm5pbmdzLmluY2x1ZGVzKHdhcm5pbmcuY29kZSk7XG5cbiAgICAgICAgICAvLyBBbHdheXMgc2hvdyBjcml0aWNhbCB3YXJuaW5nc1xuICAgICAgICAgIGlmIChpc0NyaXRpY2FsKSB7XG4gICAgICAgICAgICBjb25zdCBsb2dFbnRyeSA9IGAke3RpbWVzdGFtcH0gLSBDUklUSUNBTCAke3dhcm5pbmcuY29kZX06ICR7d2FybmluZy5tZXNzYWdlfVxcbmA7XG4gICAgICAgICAgICBmcy5hcHBlbmRGaWxlU3luYyhcImJ1aWxkLXdhcm5pbmdzLmxvZ1wiLCBsb2dFbnRyeSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlx1RDgzRFx1REVBOCBDUklUSUNBTCBXQVJOSU5HOlwiLCB3YXJuaW5nLmNvZGUsIHdhcm5pbmcubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAod2FybmluZy5pZCkgY29uc29sZS5sb2coXCIgICBcdUQ4M0RcdURDQzFcIiwgd2FybmluZy5pZCk7XG4gICAgICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNob3cgYXBwIGNvZGUgd2FybmluZ3MgaW4gZGV2XG4gICAgICAgICAgaWYgKGlzQXBwQ29kZSAmJiBpc0Rldikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdTI2QTBcdUZFMEYgIEFQUCBXQVJOSU5HOlwiLCB3YXJuaW5nLmNvZGUsIHdhcm5pbmcubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAod2FybmluZy5pZCkgY29uc29sZS5sb2coXCIgICBcdUQ4M0RcdURDQzFcIiwgd2FybmluZy5pZCk7XG4gICAgICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG5cbiAgICAgIC8vIENodW5rIHNpemUgbGltaXRzXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IGlzUHJvZCA/IDgwMCA6IDUwMDAsXG5cbiAgICAgIG1pbmlmeTogaXNQcm9kID8gXCJlc2J1aWxkXCIgOiBmYWxzZSxcbiAgICAgIHNvdXJjZW1hcDogaXNEZXYgPyB0cnVlIDogZmFsc2UsXG5cbiAgICAgIC8vIFx1MjcwNSBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcbiAgICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgICB9KSxcbiAgICB9LFxuXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgIC8vIFx1MjcwNSBDb3JlIFJlYWN0XG4gICAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcbiAgICAgICAgXCJyZWFjdC9qc3gtZGV2LXJ1bnRpbWVcIixcbiAgICAgICAgXCJyZWFjdC1kb20vY2xpZW50XCIsXG5cbiAgICAgICAgLy8gUm91dGVyXG4gICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuXG4gICAgICAgIC8vIFRhblN0YWNrIFF1ZXJ5XG4gICAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXG5cbiAgICAgICAgLy8gVUlcbiAgICAgICAgXCJsdWNpZGUtcmVhY3RcIixcbiAgICAgICAgXCJjbHN4XCIsXG4gICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIixcbiAgICAgICAgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIixcblxuICAgICAgICAvLyBTdXBhYmFzZVxuICAgICAgICBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiLFxuXG4gICAgICAgIC8vIENoYXJ0c1xuICAgICAgICBcImNoYXJ0LmpzXCIsXG4gICAgICAgIFwicmVhY3QtY2hhcnRqcy0yXCIsXG4gICAgICAgIFwicmVjaGFydHNcIixcblxuICAgICAgICAvLyBEYXRlXG4gICAgICAgIFwiZGF0ZS1mbnNcIixcblxuICAgICAgICAvLyBGb3Jtc1xuICAgICAgICBcInJlYWN0LWhvb2stZm9ybVwiLFxuICAgICAgICBcIkBob29rZm9ybS9yZXNvbHZlcnNcIixcbiAgICAgICAgXCJ6b2RcIixcblxuICAgICAgICAvLyBVdGlsaXRpZXNcbiAgICAgICAgXCJzb25uZXJcIixcbiAgICAgICAgXCJjbWRrXCIsXG4gICAgICAgIFwidmF1bFwiLFxuICAgICAgICBcInJlYWN0LWRheS1waWNrZXJcIixcbiAgICAgIF0sXG5cbiAgICAgIC8vIFx1MjcwNSBFeGNsdWRlIGxhcmdlIGxpYnJhcmllc1xuICAgICAgZXhjbHVkZTogW1xuICAgICAgICBcInhsc3hcIixcbiAgICAgIF0sXG5cbiAgICAgIC8vIFx1MjcwNSBEZWR1cGUgJiBmb3JjZSByZWJ1aWxkXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwic2NoZWR1bGVyXCJdLFxuICAgICAgZm9yY2U6IHRydWUsXG5cbiAgICAgIC8vIFx1MjcwNSBFU0J1aWxkIG9wdGlvbnMgZm9yIHByZS1idW5kbGluZ1xuICAgICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIFx1MjcwNSBDU1MgY29uZmlndXJhdGlvblxuICAgIGNzczoge1xuICAgICAgZGV2U291cmNlbWFwOiBpc0RldixcbiAgICAgIG1vZHVsZXM6IHtcbiAgICAgICAgbG9jYWxzQ29udmVudGlvbjogJ2NhbWVsQ2FzZU9ubHknLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLy8gXHUyNzA1IFByZXZpZXcgY29uZmlndXJhdGlvblxuICAgIHByZXZpZXc6IHtcbiAgICAgIHBvcnQ6IDQxNzMsXG4gICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgIH0sXG5cbiAgICAvLyBcdTI3MDUgR2xvYmFsIGVzYnVpbGQgY29uZmlnXG4gICAgZXNidWlsZDoge1xuICAgICAgbG9nT3ZlcnJpZGU6IHtcbiAgICAgICAgJ3RoaXMtaXMtdW5kZWZpbmVkLWluLWVzbSc6ICdzaWxlbnQnLFxuICAgICAgfSxcbiAgICAgIC8vIFx1MjZGM1x1RkUwRiBDT05ESVRJT05BTDogb25seSBkcm9wIGNvbnNvbGUgaWYgbm90IGZvcmNlZCB0byBrZWVwIGxvZ3NcbiAgICAgIC4uLihzaG91bGREcm9wQ29uc29sZSAmJiB7XG4gICAgICAgIGRyb3A6IFtcImNvbnNvbGVcIiwgXCJkZWJ1Z2dlclwiXSxcbiAgICAgICAgbGVnYWxDb21tZW50czogXCJub25lXCIsXG4gICAgICAgIG1pbmlmeUlkZW50aWZpZXJzOiB0cnVlLFxuICAgICAgICBtaW5pZnlTeW50YXg6IHRydWUsXG4gICAgICAgIG1pbmlmeVdoaXRlc3BhY2U6IHRydWUsXG4gICAgICB9KSxcbiAgICAgIC8vIFx1MjcwNSBXaGVuIGtlZXBpbmcgbG9ncyBpbiBwcm9kdWN0aW9uLCBzdGlsbCBtaW5pZnkgYnV0IHByZXNlcnZlIGNvbnNvbGVcbiAgICAgIC4uLihpc1Byb2QgJiYgc2hvdWxkS2VlcExvZ3MgJiYge1xuICAgICAgICBsZWdhbENvbW1lbnRzOiBcIm5vbmVcIixcbiAgICAgICAgbWluaWZ5SWRlbnRpZmllcnM6IHRydWUsXG4gICAgICAgIG1pbmlmeVN5bnRheDogdHJ1ZSxcbiAgICAgICAgbWluaWZ5V2hpdGVzcGFjZTogdHJ1ZSxcbiAgICAgICAgLy8gRG9uJ3QgZHJvcCBjb25zb2xlIHdoZW4gVklURV9GT1JDRV9MT0dTPXRydWVcbiAgICAgIH0pLFxuICAgICAgZGVmaW5lOiB7XG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLi4uKGlzRGV2ICYmIHtcbiAgICAgIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgICB9KSxcblxuICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgbG9nTGV2ZWw6ICd3YXJuJyxcbiAgICB9KSxcbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFHM0MsUUFBTSxRQUFRLFNBQVM7QUFDdkIsUUFBTSxT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
