var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

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
  const shouldAnalyzeBundle = env.VITE_ANALYZE === "true" || env.npm_config_analyze === "true";
  const shouldShowSizes = env.VITE_SHOW_SIZES === "true" || isDev;
  if (isDev) {
    console.log(`\u{1F50D} Vite Mode: ${mode}`);
    console.log(`\u{1F50D} Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      VITE_ANALYZE: env.VITE_ANALYZE,
      VITE_SHOW_SIZES: env.VITE_SHOW_SIZES
    });
  }
  if (isProd) {
    console.log("\u{1F527} PRODUCTION BUILD - Environment Check:", {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      VITE_ANALYZE: env.VITE_ANALYZE,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
      willAnalyzeBundle: shouldAnalyzeBundle
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
  if (shouldAnalyzeBundle) {
    const { visualizer } = __require("file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js");
    plugins.push(
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
        // 'treemap', 'sunburst', 'network'
        title: "Bundle Size Analysis - " + (/* @__PURE__ */ new Date()).toISOString()
      })
    );
    console.log("\u{1F4CA} Bundle analyzer enabled - report will be at dist/bundle-analysis.html");
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
            if (shouldShowSizes && fs.existsSync(id)) {
              try {
                const stats = fs.statSync(id);
                const sizeInKB = Math.round(stats.size / 1024);
                if (sizeInKB > 100) {
                  console.log(`\u{1F4E6} Large file detected: ${path.basename(id)} (${sizeInKB}KB)`);
                  const logEntry = `${(/* @__PURE__ */ new Date()).toISOString()} - ${sizeInKB}KB - ${id}
`;
                  fs.appendFileSync("bundle-sizes.log", logEntry);
                }
              } catch (e) {
              }
            }
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
            if (id.includes("xlsx") || id.includes("sheetjs")) {
              return "excel-utils";
            }
            if (id.includes("lodash")) {
              return "lodash";
            }
            if (id.includes("moment") || id.includes("dayjs")) {
              return "date-heavy";
            }
            if (id.includes("three") || id.includes("3d")) {
              return "three-js";
            }
            if (id.includes("d3")) {
              return "d3-utils";
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
      // ✅ NEW: Adjusted chunk size limits with warnings
      chunkSizeWarningLimit: isProd ? 500 : 5e3,
      // Lowered to catch more large chunks
      minify: isProd ? "esbuild" : false,
      sourcemap: isDev ? true : false,
      // ✅ Production optimizations
      ...isProd && {
        cssCodeSplit: true,
        cssMinify: true,
        assetsInlineLimit: 4096,
        // ✅ NEW: Report bundle sizes
        reportCompressedSize: shouldShowSizes
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
      // ✅ NEW: Exclude more large libraries to prevent bundling
      exclude: [
        "xlsx",
        "sheetjs",
        "moment",
        // Use date-fns instead
        "lodash",
        // Import specific functions only
        "three",
        // 3D library
        "d3"
        // Large data viz library
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
      logLevel: shouldShowSizes ? "info" : "warn"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgLy8gXHUyNzA1IEVudmlyb25tZW50IGRldGVjdGlvblxuICBjb25zdCBpc0RldiA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XG4gIGNvbnN0IGlzUHJvZCA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcbiAgXG4gIC8vIFx1MjcwNSBDaGVjayBpZiBsb2dzIHNob3VsZCBiZSBrZXB0IGluIHByb2R1Y3Rpb25cbiAgY29uc3Qgc2hvdWxkS2VlcExvZ3MgPSBlbnYuVklURV9GT1JDRV9MT0dTID09PSAndHJ1ZSc7XG4gIGNvbnN0IHNob3VsZERyb3BDb25zb2xlID0gaXNQcm9kICYmICFzaG91bGRLZWVwTG9ncztcblxuICAvLyBcdTI3MDUgTkVXOiBCdW5kbGUgYW5hbHlzaXMgZmxhZ3NcbiAgY29uc3Qgc2hvdWxkQW5hbHl6ZUJ1bmRsZSA9IGVudi5WSVRFX0FOQUxZWkUgPT09ICd0cnVlJyB8fCBlbnYubnBtX2NvbmZpZ19hbmFseXplID09PSAndHJ1ZSc7XG4gIGNvbnN0IHNob3VsZFNob3dTaXplcyA9IGVudi5WSVRFX1NIT1dfU0laRVMgPT09ICd0cnVlJyB8fCBpc0RldjtcblxuICAvLyBcdTI3MDUgRGVidWcgaW5mbyAob25seSBpbiBkZXYpXG4gIGlmIChpc0Rldikge1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgVml0ZSBNb2RlOiAke21vZGV9YCk7XG4gICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwRCBFbnZpcm9ubWVudCBWYXJpYWJsZXM6YCwge1xuICAgICAgVklURV9ERUJVR19MRVZFTDogZW52LlZJVEVfREVCVUdfTEVWRUwsXG4gICAgICBWSVRFX0ZPUkNFX0xPR1M6IGVudi5WSVRFX0ZPUkNFX0xPR1MsXG4gICAgICBWSVRFX0FOQUxZWkU6IGVudi5WSVRFX0FOQUxZWkUsXG4gICAgICBWSVRFX1NIT1dfU0laRVM6IGVudi5WSVRFX1NIT1dfU0laRVMsXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI3MDUgRGVidWcgYnVpbGQgZW52aXJvbm1lbnQgKG9ubHkgZHVyaW5nIGJ1aWxkKVxuICBpZiAoaXNQcm9kKSB7XG4gICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQyNyBQUk9EVUNUSU9OIEJVSUxEIC0gRW52aXJvbm1lbnQgQ2hlY2s6Jywge1xuICAgICAgbW9kZSxcbiAgICAgIFZJVEVfRk9SQ0VfTE9HUzogZW52LlZJVEVfRk9SQ0VfTE9HUyxcbiAgICAgIFZJVEVfQU5BTFlaRTogZW52LlZJVEVfQU5BTFlaRSxcbiAgICAgIHNob3VsZEtlZXBMb2dzLFxuICAgICAgd2lsbERyb3BDb25zb2xlOiBzaG91bGREcm9wQ29uc29sZSxcbiAgICAgIHdpbGxBbmFseXplQnVuZGxlOiBzaG91bGRBbmFseXplQnVuZGxlXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI3MDUgUGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCh7XG4gICAgICBmYXN0UmVmcmVzaDogaXNEZXYsXG4gICAgfSlcbiAgXTtcblxuICBpZiAoaXNEZXYpIHtcbiAgICBwbHVnaW5zLnB1c2goY29tcG9uZW50VGFnZ2VyKCkpO1xuICB9XG5cbiAgLy8gXHUyNzA1IE5FVzogQnVuZGxlIGFuYWx5emVyIHBsdWdpbiAoY29uZGl0aW9uYWwpXG4gIGlmIChzaG91bGRBbmFseXplQnVuZGxlKSB7XG4gICAgY29uc3QgeyB2aXN1YWxpemVyIH0gPSByZXF1aXJlKCdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInKTtcbiAgICBwbHVnaW5zLnB1c2goXG4gICAgICB2aXN1YWxpemVyKHtcbiAgICAgICAgZmlsZW5hbWU6ICdkaXN0L2J1bmRsZS1hbmFseXNpcy5odG1sJyxcbiAgICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICAgIGJyb3RsaVNpemU6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiAndHJlZW1hcCcsIC8vICd0cmVlbWFwJywgJ3N1bmJ1cnN0JywgJ25ldHdvcmsnXG4gICAgICAgIHRpdGxlOiAnQnVuZGxlIFNpemUgQW5hbHlzaXMgLSAnICsgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfSlcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDQ0EgQnVuZGxlIGFuYWx5emVyIGVuYWJsZWQgLSByZXBvcnQgd2lsbCBiZSBhdCBkaXN0L2J1bmRsZS1hbmFseXNpcy5odG1sJyk7XG4gIH1cblxuICAvLyBcdTI3MDUgRGVmaW5lIGdsb2JhbHMgLSBVUERBVEVEIGZvciBpbXBvcnQubWV0YS5lbnYgY29tcGF0aWJpbGl0eVxuICBjb25zdCBkZWZpbmUgPSB7XG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkoaXNEZXYpLFxuICAgIF9fUFJPRF9fOiBKU09OLnN0cmluZ2lmeShpc1Byb2QpLFxuICAgIF9fTU9ERV9fOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAvLyBCaWFya2FuIGltcG9ydC5tZXRhLmVudiB5YW5nIHBlZ2FuZyBOT0RFX0VOVi9ERVYvUFJPRFxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZGVmaW5lLFxuXG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgb3BlbjogZmFsc2UsXG4gICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAgIGhtcjoge1xuICAgICAgICBvdmVybGF5OiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgcGx1Z2lucyxcblxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuXG4gICAgICAgIC8vIFx1MjcwNSBGb3JjZSBzaW5nbGUgUmVhY3QgaW5zdGFuY2VzXG4gICAgICAgIFwicmVhY3RcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdFwiKSxcbiAgICAgICAgXCJyZWFjdC1kb21cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdC1kb21cIiksXG4gICAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdC9qc3gtcnVudGltZVwiKSxcbiAgICAgICAgXCJyZWFjdC9qc3gtZGV2LXJ1bnRpbWVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdC9qc3gtZGV2LXJ1bnRpbWVcIiksXG5cbiAgICAgICAgLy8gXHUyNzA1IFNpbmdsZSBzY2hlZHVsZXIgaW5zdGFuY2VcbiAgICAgICAgXCJzY2hlZHVsZXJcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9zY2hlZHVsZXJcIiksXG4gICAgICAgIFwic2NoZWR1bGVyL3RyYWNpbmdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9zY2hlZHVsZXIvdHJhY2luZ1wiKSxcbiAgICAgIH0sXG5cbiAgICAgIC8vIFx1MjcwNSBEZWR1cGUgdW50dWsgbW9kdWwgZHVwbGlrYXRcbiAgICAgIGRlZHVwZTogW1xuICAgICAgICBcInJlYWN0XCIsXG4gICAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICAgIFwic2NoZWR1bGVyXCIsXG4gICAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcbiAgICAgICAgXCJyZWFjdC9qc3gtZGV2LXJ1bnRpbWVcIixcbiAgICAgIF0sXG4gICAgfSxcblxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG5cbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gXHUyNzA1IENodW5raW5nIHRlcmtvbnRyb2xcbiAgICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgICAgLy8gXHUyNzA1IE5FVzogTG9nIGxhcmdlIGZpbGVzIGR1cmluZyBidWlsZFxuICAgICAgICAgICAgaWYgKHNob3VsZFNob3dTaXplcyAmJiBmcy5leGlzdHNTeW5jKGlkKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gZnMuc3RhdFN5bmMoaWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemVJbktCID0gTWF0aC5yb3VuZChzdGF0cy5zaXplIC8gMTAyNCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gTG9nIGZpbGVzIGxhcmdlciB0aGFuIDEwMEtCXG4gICAgICAgICAgICAgICAgaWYgKHNpemVJbktCID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0U2IExhcmdlIGZpbGUgZGV0ZWN0ZWQ6ICR7cGF0aC5iYXNlbmFtZShpZCl9ICgke3NpemVJbktCfUtCKWApO1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAvLyBXcml0ZSB0byBzaXplIHJlcG9ydFxuICAgICAgICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9IC0gJHtzaXplSW5LQn1LQiAtICR7aWR9XFxuYDtcbiAgICAgICAgICAgICAgICAgIGZzLmFwcGVuZEZpbGVTeW5jKCdidW5kbGUtc2l6ZXMubG9nJywgbG9nRW50cnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBmaWxlIHN0YXQgZXJyb3JzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ29yZSBSZWFjdFxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvcmVhY3QvJykgJiYgIWlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSAmJiAhaWQuaW5jbHVkZXMoJ3NjaGVkdWxlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmVhY3QgRE9NICsgU2NoZWR1bGVyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LWRvbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSYWRpeCBVSVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWknKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JhZGl4LXVpJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRhblN0YWNrIFF1ZXJ5XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtcXVlcnknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3VwYWJhc2VcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdzdXBhYmFzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDaGFydHNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnY2hhcnQuanMnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtY2hhcnRqcy0yJykgfHwgaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdjaGFydHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWNvbnNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWljb25zJykgfHwgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1pY29ucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnaWNvbnMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRGF0ZSB1dGlsc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZGF0ZS11dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGb3Jtc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1ob29rLWZvcm0nKSB8fCBpZC5pbmNsdWRlcygnQGhvb2tmb3JtJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmb3Jtcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBcdTI3MDUgTkVXOiBMYXJnZSBsaWJyYXJpZXMgZGV0ZWN0aW9uXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3hsc3gnKSB8fCBpZC5pbmNsdWRlcygnc2hlZXRqcycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZXhjZWwtdXRpbHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsb2Rhc2gnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2xvZGFzaCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ21vbWVudCcpIHx8IGlkLmluY2x1ZGVzKCdkYXlqcycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZGF0ZS1oZWF2eSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3RocmVlJykgfHwgaWQuaW5jbHVkZXMoJzNkJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd0aHJlZS1qcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2QzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdkMy11dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBWZW5kb3IgZmFsbGJhY2tcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQXBwIGNodW5rc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29udGV4dHMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2NvbnRleHRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbXBvbmVudHMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2NvbXBvbmVudHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvdXRpbHMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3V0aWxzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnbWFpbic7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIC8vIFx1MjcwNSBGaWxlIG5hbWluZyArIGNhY2hlIGJ1c3RcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiIDogXCJhc3NldHMvW25hbWVdLmpzXCIsXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGlzUHJvZCA/IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIiA6IFwiYXNzZXRzL1tuYW1lXS5qc1wiLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdXCIgOiBcImFzc2V0cy9bbmFtZV0uW2V4dF1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBleHRlcm5hbDogW10sXG5cbiAgICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgICAvLyBTa2lwIHdhcm5pbmdzIGluIHByb2R1Y3Rpb24gdW5sZXNzIHJlcXVlc3RlZFxuICAgICAgICAgIGlmICghaXNEZXYgJiYgIWVudi5WSVRFX1NIT1dfQlVJTERfV0FSTklOR1MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgY29uc3QgaXNBcHBDb2RlID0gd2FybmluZy5pZCAmJiAhd2FybmluZy5pZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKTtcblxuICAgICAgICAgIGNvbnN0IGNyaXRpY2FsV2FybmluZ3MgPSBbXG4gICAgICAgICAgICBcIk1JU1NJTkdfRVhQT1JUXCIsXG4gICAgICAgICAgICBcIlVOUkVTT0xWRURfSU1QT1JUXCIsXG4gICAgICAgICAgICBcIkVNUFRZX0JVTkRMRVwiLFxuICAgICAgICAgICAgXCJQTFVHSU5fRVJST1JcIixcbiAgICAgICAgICAgIFwiQ0lSQ1VMQVJfREVQRU5ERU5DWVwiLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBpc0NyaXRpY2FsID0gY3JpdGljYWxXYXJuaW5ncy5pbmNsdWRlcyh3YXJuaW5nLmNvZGUpO1xuXG4gICAgICAgICAgLy8gQWx3YXlzIHNob3cgY3JpdGljYWwgd2FybmluZ3NcbiAgICAgICAgICBpZiAoaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gQ1JJVElDQUwgJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoXCJidWlsZC13YXJuaW5ncy5sb2dcIiwgbG9nRW50cnkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFQTggQ1JJVElDQUwgV0FSTklORzpcIiwgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKFwiICAgXHVEODNEXHVEQ0MxXCIsIHdhcm5pbmcuaWQpO1xuICAgICAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTaG93IGFwcCBjb2RlIHdhcm5pbmdzIGluIGRldlxuICAgICAgICAgIGlmIChpc0FwcENvZGUgJiYgaXNEZXYpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHUyNkEwXHVGRTBGICBBUFAgV0FSTklORzpcIiwgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKFwiICAgXHVEODNEXHVEQ0MxXCIsIHdhcm5pbmcuaWQpO1xuICAgICAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICAvLyBcdTI3MDUgTkVXOiBBZGp1c3RlZCBjaHVuayBzaXplIGxpbWl0cyB3aXRoIHdhcm5pbmdzXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IGlzUHJvZCA/IDUwMCA6IDUwMDAsIC8vIExvd2VyZWQgdG8gY2F0Y2ggbW9yZSBsYXJnZSBjaHVua3NcblxuICAgICAgbWluaWZ5OiBpc1Byb2QgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxuICAgICAgc291cmNlbWFwOiBpc0RldiA/IHRydWUgOiBmYWxzZSxcblxuICAgICAgLy8gXHUyNzA1IFByb2R1Y3Rpb24gb3B0aW1pemF0aW9uc1xuICAgICAgLi4uKGlzUHJvZCAmJiB7XG4gICAgICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICAgICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgICAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBORVc6IFJlcG9ydCBidW5kbGUgc2l6ZXNcbiAgICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHNob3VsZFNob3dTaXplcyxcbiAgICAgIH0pLFxuICAgIH0sXG5cbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgLy8gXHUyNzA1IENvcmUgUmVhY3RcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0LWRvbS9jbGllbnRcIixcblxuICAgICAgICAvLyBSb3V0ZXJcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG5cbiAgICAgICAgLy8gVGFuU3RhY2sgUXVlcnlcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcblxuICAgICAgICAvLyBVSVxuICAgICAgICBcImx1Y2lkZS1yZWFjdFwiLFxuICAgICAgICBcImNsc3hcIixcbiAgICAgICAgXCJ0YWlsd2luZC1tZXJnZVwiLFxuICAgICAgICBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiLFxuXG4gICAgICAgIC8vIFN1cGFiYXNlXG4gICAgICAgIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIsXG5cbiAgICAgICAgLy8gQ2hhcnRzXG4gICAgICAgIFwiY2hhcnQuanNcIixcbiAgICAgICAgXCJyZWFjdC1jaGFydGpzLTJcIixcbiAgICAgICAgXCJyZWNoYXJ0c1wiLFxuXG4gICAgICAgIC8vIERhdGVcbiAgICAgICAgXCJkYXRlLWZuc1wiLFxuXG4gICAgICAgIC8vIEZvcm1zXG4gICAgICAgIFwicmVhY3QtaG9vay1mb3JtXCIsXG4gICAgICAgIFwiQGhvb2tmb3JtL3Jlc29sdmVyc1wiLFxuICAgICAgICBcInpvZFwiLFxuXG4gICAgICAgIC8vIFV0aWxpdGllc1xuICAgICAgICBcInNvbm5lclwiLFxuICAgICAgICBcImNtZGtcIixcbiAgICAgICAgXCJ2YXVsXCIsXG4gICAgICAgIFwicmVhY3QtZGF5LXBpY2tlclwiLFxuICAgICAgXSxcblxuICAgICAgLy8gXHUyNzA1IE5FVzogRXhjbHVkZSBtb3JlIGxhcmdlIGxpYnJhcmllcyB0byBwcmV2ZW50IGJ1bmRsaW5nXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgIFwieGxzeFwiLFxuICAgICAgICBcInNoZWV0anNcIixcbiAgICAgICAgXCJtb21lbnRcIiwgLy8gVXNlIGRhdGUtZm5zIGluc3RlYWRcbiAgICAgICAgXCJsb2Rhc2hcIiwgLy8gSW1wb3J0IHNwZWNpZmljIGZ1bmN0aW9ucyBvbmx5XG4gICAgICAgIFwidGhyZWVcIiwgIC8vIDNEIGxpYnJhcnlcbiAgICAgICAgXCJkM1wiLCAgICAgLy8gTGFyZ2UgZGF0YSB2aXogbGlicmFyeVxuICAgICAgXSxcblxuICAgICAgLy8gXHUyNzA1IERlZHVwZSAmIGZvcmNlIHJlYnVpbGRcbiAgICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJzY2hlZHVsZXJcIl0sXG4gICAgICBmb3JjZTogdHJ1ZSxcblxuICAgICAgLy8gXHUyNzA1IEVTQnVpbGQgb3B0aW9ucyBmb3IgcHJlLWJ1bmRsaW5nXG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLy8gXHUyNzA1IENTUyBjb25maWd1cmF0aW9uXG4gICAgY3NzOiB7XG4gICAgICBkZXZTb3VyY2VtYXA6IGlzRGV2LFxuICAgICAgbW9kdWxlczoge1xuICAgICAgICBsb2NhbHNDb252ZW50aW9uOiAnY2FtZWxDYXNlT25seScsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBcdTI3MDUgUHJldmlldyBjb25maWd1cmF0aW9uXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogNDE3MyxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgb3BlbjogZmFsc2UsXG4gICAgfSxcblxuICAgIC8vIFx1MjcwNSBHbG9iYWwgZXNidWlsZCBjb25maWdcbiAgICBlc2J1aWxkOiB7XG4gICAgICBsb2dPdmVycmlkZToge1xuICAgICAgICAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcsXG4gICAgICB9LFxuICAgICAgLy8gXHUyNkYzXHVGRTBGIENPTkRJVElPTkFMOiBvbmx5IGRyb3AgY29uc29sZSBpZiBub3QgZm9yY2VkIHRvIGtlZXAgbG9nc1xuICAgICAgLi4uKHNob3VsZERyb3BDb25zb2xlICYmIHtcbiAgICAgICAgZHJvcDogW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdLFxuICAgICAgICBsZWdhbENvbW1lbnRzOiBcIm5vbmVcIixcbiAgICAgICAgbWluaWZ5SWRlbnRpZmllcnM6IHRydWUsXG4gICAgICAgIG1pbmlmeVN5bnRheDogdHJ1ZSxcbiAgICAgICAgbWluaWZ5V2hpdGVzcGFjZTogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgLy8gXHUyNzA1IFdoZW4ga2VlcGluZyBsb2dzIGluIHByb2R1Y3Rpb24sIHN0aWxsIG1pbmlmeSBidXQgcHJlc2VydmUgY29uc29sZVxuICAgICAgLi4uKGlzUHJvZCAmJiBzaG91bGRLZWVwTG9ncyAmJiB7XG4gICAgICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxuICAgICAgICBtaW5pZnlJZGVudGlmaWVyczogdHJ1ZSxcbiAgICAgICAgbWluaWZ5U3ludGF4OiB0cnVlLFxuICAgICAgICBtaW5pZnlXaGl0ZXNwYWNlOiB0cnVlLFxuICAgICAgICAvLyBEb24ndCBkcm9wIGNvbnNvbGUgd2hlbiBWSVRFX0ZPUkNFX0xPR1M9dHJ1ZVxuICAgICAgfSksXG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAuLi4oaXNEZXYgJiYge1xuICAgICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgIH0pLFxuXG4gICAgLi4uKGlzUHJvZCAmJiB7XG4gICAgICBsb2dMZXZlbDogc2hvdWxkU2hvd1NpemVzID8gJ2luZm8nIDogJ3dhcm4nLFxuICAgIH0pLFxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFB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QUFBQTtBQUFBLFFBR0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBO0FBQUEsUUFHQTtBQUFBO0FBQUEsUUFHQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUdBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFHQSxTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUdBLFFBQVEsQ0FBQyxTQUFTLGFBQWEsV0FBVztBQUFBLE1BQzFDLE9BQU87QUFBQTtBQUFBLE1BR1AsZ0JBQWdCO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLEtBQUs7QUFBQSxNQUNILGNBQWM7QUFBQSxNQUNkLFNBQVM7QUFBQSxRQUNQLGtCQUFrQjtBQUFBLE1BQ3BCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixNQUFNO0FBQUEsSUFDUjtBQUFBO0FBQUEsSUFHQSxTQUFTO0FBQUEsTUFDUCxhQUFhO0FBQUEsUUFDWCw0QkFBNEI7QUFBQSxNQUM5QjtBQUFBO0FBQUEsTUFFQSxHQUFJLHFCQUFxQjtBQUFBLFFBQ3ZCLE1BQU0sQ0FBQyxXQUFXLFVBQVU7QUFBQSxRQUM1QixlQUFlO0FBQUEsUUFDZixtQkFBbUI7QUFBQSxRQUNuQixjQUFjO0FBQUEsUUFDZCxrQkFBa0I7QUFBQSxNQUNwQjtBQUFBO0FBQUEsTUFFQSxHQUFJLFVBQVUsa0JBQWtCO0FBQUEsUUFDOUIsZUFBZTtBQUFBLFFBQ2YsbUJBQW1CO0FBQUEsUUFDbkIsY0FBYztBQUFBLFFBQ2Qsa0JBQWtCO0FBQUE7QUFBQSxNQUVwQjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxHQUFJLFNBQVM7QUFBQSxNQUNYLGFBQWE7QUFBQSxJQUNmO0FBQUEsSUFFQSxHQUFJLFVBQVU7QUFBQSxNQUNaLFVBQVUsa0JBQWtCLFNBQVM7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
