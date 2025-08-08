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
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    "process.env.NODE_ENV": JSON.stringify(mode),
    global: "globalThis"
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
      // ✅ Re-enable minification
      sourcemap: isDev ? true : false,
      // ✅ Back to normal sourcemap
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
        // ✅ UI Libraries based on your package.json
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
    // ✅ ESBuild global config
    esbuild: {
      logOverride: {
        "this-is-undefined-in-esm": "silent"
      },
      // ✅ FIX: Define scheduler for compatibility
      define: {
        "process.env.NODE_ENV": JSON.stringify(mode),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIFxuICAvLyBcdTI3MDUgRW52aXJvbm1lbnQgZGV0ZWN0aW9uXG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICBcbiAgLy8gXHUyNzA1IERlYnVnIGluZm8gKG9ubHkgaW4gZGV2KVxuICBpZiAoaXNEZXYpIHtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFZpdGUgTW9kZTogJHttb2RlfWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgRW52aXJvbm1lbnQgVmFyaWFibGVzOmAsIHtcbiAgICAgIFZJVEVfREVCVUdfTEVWRUw6IGVudi5WSVRFX0RFQlVHX0xFVkVMLFxuICAgICAgVklURV9GT1JDRV9MT0dTOiBlbnYuVklURV9GT1JDRV9MT0dTLFxuICAgIH0pO1xuICB9XG4gIFxuICAvLyBcdTI3MDUgUGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCh7XG4gICAgICBmYXN0UmVmcmVzaDogaXNEZXYsXG4gICAgfSlcbiAgXTtcbiAgXG4gIGlmIChpc0Rldikge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cbiAgXG4gIC8vIFx1MjcwNSBEZWZpbmUgZ2xvYmFsc1xuICBjb25zdCBkZWZpbmUgPSB7XG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkoaXNEZXYpLFxuICAgIF9fUFJPRF9fOiBKU09OLnN0cmluZ2lmeShpc1Byb2QpLFxuICAgIF9fTU9ERV9fOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgfTtcbiAgXG4gIHJldHVybiB7XG4gICAgZGVmaW5lLFxuICAgIFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBobXI6IHtcbiAgICAgICAgb3ZlcmxheTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICBwbHVnaW5zLFxuICAgIFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IENSSVRJQ0FMIEZJWDogRm9yY2Ugc2luZ2xlIFJlYWN0IGluc3RhbmNlc1xuICAgICAgICBcInJlYWN0XCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3RcIiksXG4gICAgICAgIFwicmVhY3QtZG9tXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3QtZG9tXCIpLFxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3QvanN4LXJ1bnRpbWVcIiksXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvcmVhY3QvanN4LWRldi1ydW50aW1lXCIpLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IFNDSEVEVUxFUiBGSVg6IEZvcmNlIHNpbmdsZSBzY2hlZHVsZXIgaW5zdGFuY2VcbiAgICAgICAgXCJzY2hlZHVsZXJcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9zY2hlZHVsZXJcIiksXG4gICAgICAgIFwic2NoZWR1bGVyL3RyYWNpbmdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9zY2hlZHVsZXIvdHJhY2luZ1wiKSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBFTkhBTkNFRDogQ29tcHJlaGVuc2l2ZSBkZWR1cGUgbGlzdFxuICAgICAgZGVkdXBlOiBbXG4gICAgICAgIFwicmVhY3RcIiwgXG4gICAgICAgIFwicmVhY3QtZG9tXCIsIFxuICAgICAgICBcInNjaGVkdWxlclwiLFxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXG4gICAgICBdLFxuICAgIH0sXG4gICAgXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogXCJlczIwMjBcIixcbiAgICAgIFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAvLyBcdTI3MDUgRklYRUQ6IFNlcGFyYXRlIFJlYWN0IGRhcmkgc2NoZWR1bGVyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIENvcmUgUmVhY3QgLSB0ZXJwaXNhaCB1bnR1ayBhdm9pZCBjb25mbGljdHNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3JlYWN0LycpICYmICFpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgJiYgIWlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gUmVhY3QgRE9NICsgU2NoZWR1bGVyIC0gdG9nZXRoZXJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3NjaGVkdWxlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtZG9tJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1MjcwNSBURU1QOiBEaXNhYmxlIG1hbnVhbCBjaHVua3MgdG8gYXZvaWQgZnVuY3Rpb24gY29uZmxpY3RzXG4gICAgICAgICAgLy8gbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFJhZGl4IFVJIGNvbXBvbmVudHNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyYWRpeC11aSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFRhblN0YWNrIFF1ZXJ5XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtcXVlcnknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBTdXBhYmFzZVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2hhcnQgbGlicmFyaWVzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2NoYXJ0LmpzJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWNoYXJ0anMtMicpIHx8IGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY2hhcnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWNvbnNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWljb25zJykgfHwgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1pY29ucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnaWNvbnMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBEYXRlIHV0aWxpdGllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZGF0ZS11dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEZvcm0gbGlicmFyaWVzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWhvb2stZm9ybScpIHx8IGlkLmluY2x1ZGVzKCdAaG9va2Zvcm0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Zvcm1zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gT3RoZXIgdmVuZG9yIGxpYnJhcmllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcCBjaHVua3NcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbnRleHRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdjb250ZXh0cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9jb21wb25lbnRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdjb21wb25lbnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL3V0aWxzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd1dGlscyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE1haW4gYXBwIGNodW5rXG4gICAgICAgICAgICByZXR1cm4gJ21haW4nO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gXHUyNzA1IEZpbGUgbmFtaW5nIHdpdGggY2FjaGUgYnVzdGluZ1xuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIgOiBcImFzc2V0cy9bbmFtZV0uanNcIixcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiIDogXCJhc3NldHMvW25hbWVdLmpzXCIsIFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBpc1Byb2QgPyBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdXCIgOiBcImFzc2V0cy9bbmFtZV0uW2V4dF1cIixcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgICAgXG4gICAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgICAgLy8gU2tpcCB3YXJuaW5ncyBpbiBwcm9kdWN0aW9uIHVubGVzcyByZXF1ZXN0ZWRcbiAgICAgICAgICBpZiAoIWlzRGV2ICYmICFlbnYuVklURV9TSE9XX0JVSUxEX1dBUk5JTkdTKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICBjb25zdCBpc0FwcENvZGUgPSB3YXJuaW5nLmlkICYmICF3YXJuaW5nLmlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGNyaXRpY2FsV2FybmluZ3MgPSBbXG4gICAgICAgICAgICBcIk1JU1NJTkdfRVhQT1JUXCIsXG4gICAgICAgICAgICBcIlVOUkVTT0xWRURfSU1QT1JUXCIsIFxuICAgICAgICAgICAgXCJFTVBUWV9CVU5ETEVcIixcbiAgICAgICAgICAgIFwiUExVR0lOX0VSUk9SXCIsXG4gICAgICAgICAgICBcIkNJUkNVTEFSX0RFUEVOREVOQ1lcIixcbiAgICAgICAgICBdO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGlzQ3JpdGljYWwgPSBjcml0aWNhbFdhcm5pbmdzLmluY2x1ZGVzKHdhcm5pbmcuY29kZSk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQWx3YXlzIHNob3cgY3JpdGljYWwgd2FybmluZ3NcbiAgICAgICAgICBpZiAoaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gQ1JJVElDQUwgJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoXCJidWlsZC13YXJuaW5ncy5sb2dcIiwgbG9nRW50cnkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFQTggQ1JJVElDQUwgV0FSTklORzpcIiwgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKFwiICAgXHVEODNEXHVEQ0MxXCIsIHdhcm5pbmcuaWQpO1xuICAgICAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gU2hvdyBhcHAgY29kZSB3YXJuaW5ncyBpbiBkZXZcbiAgICAgICAgICBpZiAoaXNBcHBDb2RlICYmIGlzRGV2KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlx1MjZBMFx1RkUwRiAgQVBQIFdBUk5JTkc6XCIsIHdhcm5pbmcuY29kZSwgd2FybmluZy5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmICh3YXJuaW5nLmlkKSBjb25zb2xlLmxvZyhcIiAgIFx1RDgzRFx1RENDMVwiLCB3YXJuaW5nLmlkKTtcbiAgICAgICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQ2h1bmsgc2l6ZSBsaW1pdHNcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogaXNQcm9kID8gODAwIDogNTAwMCxcbiAgICAgIFxuICAgICAgbWluaWZ5OiBpc1Byb2QgPyBcImVzYnVpbGRcIiA6IGZhbHNlLCAvLyBcdTI3MDUgUmUtZW5hYmxlIG1pbmlmaWNhdGlvblxuICAgICAgc291cmNlbWFwOiBpc0RldiA/IHRydWUgOiBmYWxzZSwgICAvLyBcdTI3MDUgQmFjayB0byBub3JtYWwgc291cmNlbWFwXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcbiAgICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgICBlc2J1aWxkOiB7XG4gICAgICAgICAgLy8gUmVtb3ZlIGNvbnNvbGUgbG9ncyBpbiBwcm9kdWN0aW9uICh1bmxlc3MgZm9yY2VkKVxuICAgICAgICAgIGRyb3A6IGVudi5WSVRFX0ZPUkNFX0xPR1MgPT09ICd0cnVlJyA/IFtcImRlYnVnZ2VyXCJdIDogW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdLFxuICAgICAgICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxuICAgICAgICAgIG1pbmlmeUlkZW50aWZpZXJzOiB0cnVlLFxuICAgICAgICAgIG1pbmlmeVN5bnRheDogdHJ1ZSxcbiAgICAgICAgICBtaW5pZnlXaGl0ZXNwYWNlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLy8gQ1NTIG9wdGltaXphdGlvblxuICAgICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICAgICAgXG4gICAgICAgIC8vIEFzc2V0IG9wdGltaXphdGlvbiAgXG4gICAgICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LFxuICAgICAgfSksXG4gICAgfSxcbiAgICBcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgLy8gXHUyNzA1IENvcmUgUmVhY3Qgd2l0aCBzY2hlZHVsZXJcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0LWRvbS9jbGllbnRcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBSb3V0ZXJcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgVGFuU3RhY2sgUXVlcnlcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBVSSBMaWJyYXJpZXMgYmFzZWQgb24geW91ciBwYWNrYWdlLmpzb25cbiAgICAgICAgXCJsdWNpZGUtcmVhY3RcIixcbiAgICAgICAgXCJjbHN4XCIsXG4gICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIixcbiAgICAgICAgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBTdXBhYmFzZVxuICAgICAgICBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IENoYXJ0c1xuICAgICAgICBcImNoYXJ0LmpzXCIsXG4gICAgICAgIFwicmVhY3QtY2hhcnRqcy0yXCIsIFxuICAgICAgICBcInJlY2hhcnRzXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgRGF0ZSB1dGlsaXRpZXNcbiAgICAgICAgXCJkYXRlLWZuc1wiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IEZvcm0gbGlicmFyaWVzXG4gICAgICAgIFwicmVhY3QtaG9vay1mb3JtXCIsXG4gICAgICAgIFwiQGhvb2tmb3JtL3Jlc29sdmVyc1wiLFxuICAgICAgICBcInpvZFwiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IE90aGVyIHV0aWxpdGllc1xuICAgICAgICBcInNvbm5lclwiLFxuICAgICAgICBcImNtZGtcIixcbiAgICAgICAgXCJ2YXVsXCIsXG4gICAgICAgIFwicmVhY3QtZGF5LXBpY2tlclwiLFxuICAgICAgXSxcbiAgICAgIFxuICAgICAgLy8gXHUyNzA1IEV4Y2x1ZGUgbGFyZ2UgbGlicmFyaWVzXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgIFwieGxzeFwiLCAvLyBMYXJnZSBFeGNlbCBsaWJyYXJ5XG4gICAgICBdLFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgQ1JJVElDQUwgZm9yIHNjaGVkdWxlciBlcnJvclxuICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInNjaGVkdWxlclwiXSxcbiAgICAgIGZvcmNlOiB0cnVlLCAvLyBGb3JjZSByZWJ1aWxkIHRvIGNsZWFyIHNjaGVkdWxlciBjb25mbGljdHNcbiAgICAgIFxuICAgICAgLy8gXHUyNzA1IEVTQnVpbGQgb3B0aW9ucyBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgQ1NTIGNvbmZpZ3VyYXRpb25cbiAgICBjc3M6IHtcbiAgICAgIGRldlNvdXJjZW1hcDogaXNEZXYsXG4gICAgICBtb2R1bGVzOiB7XG4gICAgICAgIGxvY2Fsc0NvbnZlbnRpb246ICdjYW1lbENhc2VPbmx5JyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgUHJldmlldyBjb25maWd1cmF0aW9uICBcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA0MTczLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFx1MjcwNSBFU0J1aWxkIGdsb2JhbCBjb25maWdcbiAgICBlc2J1aWxkOiB7XG4gICAgICBsb2dPdmVycmlkZToge1xuICAgICAgICAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcsXG4gICAgICB9LFxuICAgICAgLy8gXHUyNzA1IEZJWDogRGVmaW5lIHNjaGVkdWxlciBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgZGVmaW5lOiB7XG4gICAgICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgRW52aXJvbm1lbnQtc3BlY2lmaWMgY29uZmlndXJhdGlvbnNcbiAgICAuLi4oaXNEZXYgJiYge1xuICAgICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgIH0pLFxuICAgIFxuICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgbG9nTGV2ZWw6ICd3YXJuJyxcbiAgICB9KSxcbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFHM0MsUUFBTSxRQUFRLFNBQVM7QUFDdkIsUUFBTSxTQUFTLFNBQVM7QUFHeEIsTUFBSSxPQUFPO0FBQ1QsWUFBUSxJQUFJLHdCQUFpQixJQUFJLEVBQUU7QUFDbkMsWUFBUSxJQUFJLG9DQUE2QjtBQUFBLE1BQ3ZDLGtCQUFrQixJQUFJO0FBQUEsTUFDdEIsaUJBQWlCLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUdBLFFBQU0sVUFBVTtBQUFBLElBQ2QsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLEVBQ0g7QUFFQSxNQUFJLE9BQU87QUFDVCxZQUFRLEtBQUssZ0JBQWdCLENBQUM7QUFBQSxFQUNoQztBQUdBLFFBQU0sU0FBUztBQUFBLElBQ2IsU0FBUyxLQUFLLFVBQVUsS0FBSztBQUFBLElBQzdCLFVBQVUsS0FBSyxVQUFVLE1BQU07QUFBQSxJQUMvQixVQUFVLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDN0Isd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDM0MsUUFBUTtBQUFBLEVBQ1Y7QUFFQSxTQUFPO0FBQUEs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
