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
  if (isDev) {
    console.log(`\u{1F50D} Vite Mode: ${mode}`);
    console.log(`\u{1F50D} Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS
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
    // ✅ Custom build-time constants
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    // ✅ Global polyfills
    global: "globalThis"
    // ✅ REMOVED: process.env.NODE_ENV (let import.meta.env handle this)
    // We'll migrate code to use import.meta.env instead
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
        // ✅ CRITICAL FIX: Force single React instances
        "react": path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
        "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__vite_injected_original_dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__vite_injected_original_dirname, "./node_modules/react/jsx-dev-runtime"),
        // ✅ SCHEDULER FIX: Force single scheduler instance
        "scheduler": path.resolve(__vite_injected_original_dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__vite_injected_original_dirname, "./node_modules/scheduler/tracing")
      },
      // ✅ ENHANCED: Comprehensive dedupe list
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
          // ✅ FIXED: Separate React dari scheduler
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
          // ✅ File naming with cache busting
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
        esbuild: {
          // Remove console logs in production (unless forced)
          drop: env.VITE_FORCE_LOGS === "true" ? ["debugger"] : ["console", "debugger"],
          legalComments: "none",
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true
        },
        // CSS optimization
        cssCodeSplit: true,
        cssMinify: true,
        // Asset optimization  
        assetsInlineLimit: 4096
      }
    },
    optimizeDeps: {
      include: [
        // ✅ Core React with scheduler
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        // ✅ Router
        "react-router-dom",
        // ✅ TanStack Query
        "@tanstack/react-query",
        // ✅ UI Libraries
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        // ✅ Supabase
        "@supabase/supabase-js",
        // ✅ Charts
        "chart.js",
        "react-chartjs-2",
        "recharts",
        // ✅ Date utilities
        "date-fns",
        // ✅ Form libraries
        "react-hook-form",
        "@hookform/resolvers",
        "zod",
        // ✅ Other utilities
        "sonner",
        "cmdk",
        "vaul",
        "react-day-picker"
      ],
      // ✅ Exclude large libraries
      exclude: [
        "xlsx"
        // Large Excel library
      ],
      // ✅ CRITICAL for scheduler error
      dedupe: ["react", "react-dom", "scheduler"],
      force: true,
      // Force rebuild to clear scheduler conflicts
      // ✅ ESBuild options for compatibility
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
    // ✅ ESBuild global config - UPDATED
    esbuild: {
      logOverride: {
        "this-is-undefined-in-esm": "silent"
      },
      // ✅ SIMPLIFIED: Remove process.env.NODE_ENV define
      define: {
        global: "globalThis"
      }
    },
    // ✅ Environment-specific configurations
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIFxuICAvLyBcdTI3MDUgRW52aXJvbm1lbnQgZGV0ZWN0aW9uXG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICBcbiAgLy8gXHUyNzA1IERlYnVnIGluZm8gKG9ubHkgaW4gZGV2KVxuICBpZiAoaXNEZXYpIHtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFZpdGUgTW9kZTogJHttb2RlfWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgRW52aXJvbm1lbnQgVmFyaWFibGVzOmAsIHtcbiAgICAgIFZJVEVfREVCVUdfTEVWRUw6IGVudi5WSVRFX0RFQlVHX0xFVkVMLFxuICAgICAgVklURV9GT1JDRV9MT0dTOiBlbnYuVklURV9GT1JDRV9MT0dTLFxuICAgIH0pO1xuICB9XG4gIFxuICAvLyBcdTI3MDUgUGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCh7XG4gICAgICBmYXN0UmVmcmVzaDogaXNEZXYsXG4gICAgfSlcbiAgXTtcbiAgXG4gIGlmIChpc0Rldikge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cbiAgXG4gIC8vIFx1MjcwNSBEZWZpbmUgZ2xvYmFscyAtIFVQREFURUQgZm9yIGltcG9ydC5tZXRhLmVudiBjb21wYXRpYmlsaXR5XG4gIGNvbnN0IGRlZmluZSA9IHtcbiAgICAvLyBcdTI3MDUgQ3VzdG9tIGJ1aWxkLXRpbWUgY29uc3RhbnRzXG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkoaXNEZXYpLFxuICAgIF9fUFJPRF9fOiBKU09OLnN0cmluZ2lmeShpc1Byb2QpLFxuICAgIF9fTU9ERV9fOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICBcbiAgICAvLyBcdTI3MDUgR2xvYmFsIHBvbHlmaWxsc1xuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgIFxuICAgIC8vIFx1MjcwNSBSRU1PVkVEOiBwcm9jZXNzLmVudi5OT0RFX0VOViAobGV0IGltcG9ydC5tZXRhLmVudiBoYW5kbGUgdGhpcylcbiAgICAvLyBXZSdsbCBtaWdyYXRlIGNvZGUgdG8gdXNlIGltcG9ydC5tZXRhLmVudiBpbnN0ZWFkXG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGRlZmluZSxcbiAgICBcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIG92ZXJsYXk6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgXG4gICAgcGx1Z2lucyxcbiAgICBcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBDUklUSUNBTCBGSVg6IEZvcmNlIHNpbmdsZSBSZWFjdCBpbnN0YW5jZXNcbiAgICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0L2pzeC1ydW50aW1lXCIpLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0L2pzeC1kZXYtcnVudGltZVwiKSxcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBTQ0hFRFVMRVIgRklYOiBGb3JjZSBzaW5nbGUgc2NoZWR1bGVyIGluc3RhbmNlXG4gICAgICAgIFwic2NoZWR1bGVyXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvc2NoZWR1bGVyXCIpLFxuICAgICAgICBcInNjaGVkdWxlci90cmFjaW5nXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvc2NoZWR1bGVyL3RyYWNpbmdcIiksXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgRU5IQU5DRUQ6IENvbXByZWhlbnNpdmUgZGVkdXBlIGxpc3RcbiAgICAgIGRlZHVwZTogW1xuICAgICAgICBcInJlYWN0XCIsIFxuICAgICAgICBcInJlYWN0LWRvbVwiLCBcbiAgICAgICAgXCJzY2hlZHVsZXJcIixcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgXSxcbiAgICB9LFxuICAgIFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgICBcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gXHUyNzA1IEZJWEVEOiBTZXBhcmF0ZSBSZWFjdCBkYXJpIHNjaGVkdWxlclxuICAgICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgICAvLyBDb3JlIFJlYWN0IC0gdGVycGlzYWggdW50dWsgYXZvaWQgY29uZmxpY3RzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9yZWFjdC8nKSAmJiAhaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpICYmICFpZC5pbmNsdWRlcygnc2NoZWR1bGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFJlYWN0IERPTSArIFNjaGVkdWxlciAtIHRvZ2V0aGVyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LWRvbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFJhZGl4IFVJIGNvbXBvbmVudHNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyYWRpeC11aSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFRhblN0YWNrIFF1ZXJ5XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtcXVlcnknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBTdXBhYmFzZVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2hhcnQgbGlicmFyaWVzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2NoYXJ0LmpzJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWNoYXJ0anMtMicpIHx8IGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY2hhcnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWNvbnNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWljb25zJykgfHwgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1pY29ucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnaWNvbnMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBEYXRlIHV0aWxpdGllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZGF0ZS11dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEZvcm0gbGlicmFyaWVzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWhvb2stZm9ybScpIHx8IGlkLmluY2x1ZGVzKCdAaG9va2Zvcm0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Zvcm1zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gT3RoZXIgdmVuZG9yIGxpYnJhcmllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcCBjaHVua3NcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbnRleHRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdjb250ZXh0cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9jb21wb25lbnRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdjb21wb25lbnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL3V0aWxzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd1dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE1haW4gYXBwIGNodW5rXG4gICAgICAgICAgICByZXR1cm4gJ21haW4nO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gXHUyNzA1IEZpbGUgbmFtaW5nIHdpdGggY2FjaGUgYnVzdGluZ1xuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIgOiBcImFzc2V0cy9bbmFtZV0uanNcIixcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiIDogXCJhc3NldHMvW25hbWVdLmpzXCIsIFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdXCIgOiBcImFzc2V0cy9bbmFtZV0uW2V4dF1cIixcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgICAgXG4gICAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgICAgLy8gU2tpcCB3YXJuaW5ncyBpbiBwcm9kdWN0aW9uIHVubGVzcyByZXF1ZXN0ZWRcbiAgICAgICAgICBpZiAoIWlzRGV2ICYmICFlbnYuVklURV9TSE9XX0JVSUxEX1dBUk5JTkdTKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICBjb25zdCBpc0FwcENvZGUgPSB3YXJuaW5nLmlkICYmICF3YXJuaW5nLmlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGNyaXRpY2FsV2FybmluZ3MgPSBbXG4gICAgICAgICAgICBcIk1JU1NJTkdfRVhQT1JUXCIsXG4gICAgICAgICAgICBcIlVOUkVTT0xWRURfSU1QT1JUXCIsIFxuICAgICAgICAgICAgXCJFTVBUWV9CVU5ETEVcIixcbiAgICAgICAgICAgIFwiUExVR0lOX0VSUk9SXCIsXG4gICAgICAgICAgICBcIkNJUkNVTEFSX0RFUEVOREVOQ1lcIixcbiAgICAgICAgICBdO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGlzQ3JpdGljYWwgPSBjcml0aWNhbFdhcm5pbmdzLmluY2x1ZGVzKHdhcm5pbmcuY29kZSk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQWx3YXlzIHNob3cgY3JpdGljYWwgd2FybmluZ3NcbiAgICAgICAgICBpZiAoaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gQ1JJVElDQUwgJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoXCJidWlsZC13YXJuaW5ncy5sb2dcIiwgbG9nRW50cnkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFQTggQ1JJVElDQUwgV0FSTklORzpcIiwgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKFwiICAgXHVEODNEXHVEQ0MxXCIsIHdhcm5pbmcuaWQpO1xuICAgICAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gU2hvdyBhcHAgY29kZSB3YXJuaW5ncyBpbiBkZXZcbiAgICAgICAgICBpZiAoaXNBcHBDb2RlICYmIGlzRGV2KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlx1MjZBMFx1RkUwRiAgQVBQIFdBUk5JTkc6XCIsIHdhcm5pbmcuY29kZSwgd2FybmluZy5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmICh3YXJuaW5nLmlkKSBjb25zb2xlLmxvZyhcIiAgIFx1RDgzRFx1RENDMVwiLCB3YXJuaW5nLmlkKTtcbiAgICAgICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQ2h1bmsgc2l6ZSBsaW1pdHNcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogaXNQcm9kID8gODAwIDogNTAwMCxcbiAgICAgIFxuICAgICAgbWluaWZ5OiBpc1Byb2QgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxuICAgICAgc291cmNlbWFwOiBpc0RldiA/IHRydWUgOiBmYWxzZSxcbiAgICAgIFxuICAgICAgLy8gXHUyNzA1IFByb2R1Y3Rpb24gb3B0aW1pemF0aW9uc1xuICAgICAgLi4uKGlzUHJvZCAmJiB7XG4gICAgICAgIGVzYnVpbGQ6IHtcbiAgICAgICAgICAvLyBSZW1vdmUgY29uc29sZSBsb2dzIGluIHByb2R1Y3Rpb24gKHVubGVzcyBmb3JjZWQpXG4gICAgICAgICAgZHJvcDogZW52LlZJVEVfRk9SQ0VfTE9HUyA9PT0gJ3RydWUnID8gW1wiZGVidWdnZXJcIl0gOiBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0sXG4gICAgICAgICAgbGVnYWxDb21tZW50czogXCJub25lXCIsXG4gICAgICAgICAgbWluaWZ5SWRlbnRpZmllcnM6IHRydWUsXG4gICAgICAgICAgbWluaWZ5U3ludGF4OiB0cnVlLFxuICAgICAgICAgIG1pbmlmeVdoaXRlc3BhY2U6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICAvLyBDU1Mgb3B0aW1pemF0aW9uXG4gICAgICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICAgICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgICAgICBcbiAgICAgICAgLy8gQXNzZXQgb3B0aW1pemF0aW9uICBcbiAgICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgICB9KSxcbiAgICB9LFxuICAgIFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAvLyBcdTI3MDUgQ29yZSBSZWFjdCB3aXRoIHNjaGVkdWxlclxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QtZG9tL2NsaWVudFwiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IFJvdXRlclxuICAgICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBUYW5TdGFjayBRdWVyeVxuICAgICAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IFVJIExpYnJhcmllc1xuICAgICAgICBcImx1Y2lkZS1yZWFjdFwiLFxuICAgICAgICBcImNsc3hcIixcbiAgICAgICAgXCJ0YWlsd2luZC1tZXJnZVwiLFxuICAgICAgICBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IFN1cGFiYXNlXG4gICAgICAgIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgQ2hhcnRzXG4gICAgICAgIFwiY2hhcnQuanNcIixcbiAgICAgICAgXCJyZWFjdC1jaGFydGpzLTJcIiwgXG4gICAgICAgIFwicmVjaGFydHNcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBEYXRlIHV0aWxpdGllc1xuICAgICAgICBcImRhdGUtZm5zXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgRm9ybSBsaWJyYXJpZXNcbiAgICAgICAgXCJyZWFjdC1ob29rLWZvcm1cIixcbiAgICAgICAgXCJAaG9va2Zvcm0vcmVzb2x2ZXJzXCIsXG4gICAgICAgIFwiem9kXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgT3RoZXIgdXRpbGl0aWVzXG4gICAgICAgIFwic29ubmVyXCIsXG4gICAgICAgIFwiY21ka1wiLFxuICAgICAgICBcInZhdWxcIixcbiAgICAgICAgXCJyZWFjdC1kYXktcGlja2VyXCIsXG4gICAgICBdLFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgRXhjbHVkZSBsYXJnZSBsaWJyYXJpZXNcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgXCJ4bHN4XCIsIC8vIExhcmdlIEV4Y2VsIGxpYnJhcnlcbiAgICAgIF0sXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBDUklUSUNBTCBmb3Igc2NoZWR1bGVyIGVycm9yXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwic2NoZWR1bGVyXCJdLFxuICAgICAgZm9yY2U6IHRydWUsIC8vIEZvcmNlIHJlYnVpbGQgdG8gY2xlYXIgc2NoZWR1bGVyIGNvbmZsaWN0c1xuICAgICAgXG4gICAgICAvLyBcdTI3MDUgRVNCdWlsZCBvcHRpb25zIGZvciBjb21wYXRpYmlsaXR5XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFx1MjcwNSBDU1MgY29uZmlndXJhdGlvblxuICAgIGNzczoge1xuICAgICAgZGV2U291cmNlbWFwOiBpc0RldixcbiAgICAgIG1vZHVsZXM6IHtcbiAgICAgICAgbG9jYWxzQ29udmVudGlvbjogJ2NhbWVsQ2FzZU9ubHknLFxuICAgICAgfSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFx1MjcwNSBQcmV2aWV3IGNvbmZpZ3VyYXRpb24gIFxuICAgIHByZXZpZXc6IHtcbiAgICAgIHBvcnQ6IDQxNzMsXG4gICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgIH0sXG4gICAgXG4gICAgLy8gXHUyNzA1IEVTQnVpbGQgZ2xvYmFsIGNvbmZpZyAtIFVQREFURURcbiAgICBlc2J1aWxkOiB7XG4gICAgICBsb2dPdmVycmlkZToge1xuICAgICAgICAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcsXG4gICAgICB9LFxuICAgICAgLy8gXHUyNzA1IFNJTVBMSUZJRUQ6IFJlbW92ZSBwcm9jZXNzLmVudi5OT0RFX0VOViBkZWZpbmVcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgRW52aXJvbm1lbnQtc3BlY2lmaWMgY29uZmlndXJhdGlvbnNcbiAgICAuLi4oaXNEZXYgJiYge1xuICAgICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgIH0pLFxuICAgIFxuICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgbG9nTGV2ZWw6ICd3YXJuJyxcbiAgICB9KSxcbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFHM0MsUUFBTSxRQUFRLFNBQVM7QUFDdkIsUUFBTSxTQUFTLFNBQVM7QUFHeEIsTUFBSSxPQUFPO0FBQ1QsWUFBUSxJQUFJLHdCQUFpQixJQUFJLEVBQUU7QUFDbkMsWUFBUSxJQUFJLG9DQUE2QjtBQUFBLE1BQ3ZDLGtCQUFrQixJQUFJO0FBQUEsTUFDdEIsaUJBQWlCLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUdBLFFBQU0sVUFBVTtBQUFBLElBQ2QsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLEVBQ0g7QUFFQSxNQUFJLE9BQU87QUFDVCxZQUFRLEtBQUssZ0JBQWdCLENBQUM7QUFBQSxFQUNoQztBQUdBLFFBQU0sU0FBUztBQUFBO0FBQUEsSUFFYixTQUFTLEtBQUssVUFBVSxLQUFLO0FBQUEsSUFDN0IsVUFBVSxLQUFLLFVBQVUsTUFBTTtBQUFBLElBQy9CLFVBQVUsS0FBSyxVQUFVLElBQUk7QUFBQTtBQUFBLElBRzdCLFFBQVE7QUFBQTtBQUFBO0FBQUEsRUFJVjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixN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
