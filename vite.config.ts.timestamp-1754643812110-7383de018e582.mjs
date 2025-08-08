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
    "process.env.NODE_ENV": JSON.stringify(mode)
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
        // ✅ FIX: Explicit React aliasing to prevent scheduler conflicts
        "react": path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
        "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom"),
        "scheduler": path.resolve(__vite_injected_original_dirname, "./node_modules/scheduler")
      },
      // ✅ FIX: Enhanced dedupe for scheduler issues
      dedupe: ["react", "react-dom", "scheduler"]
    },
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          // ✅ Smart chunking based on your dependencies
          manualChunks: (id) => {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-core";
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
        // ✅ Core React (fixed for scheduler issues)
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
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
      // ✅ FIX: Critical for scheduler error
      dedupe: ["react", "react-dom"],
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
        "process.env.NODE_ENV": JSON.stringify(mode)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIFxuICAvLyBcdTI3MDUgRW52aXJvbm1lbnQgZGV0ZWN0aW9uXG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICBcbiAgLy8gXHUyNzA1IERlYnVnIGluZm8gKG9ubHkgaW4gZGV2KVxuICBpZiAoaXNEZXYpIHtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFZpdGUgTW9kZTogJHttb2RlfWApO1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMEQgRW52aXJvbm1lbnQgVmFyaWFibGVzOmAsIHtcbiAgICAgIFZJVEVfREVCVUdfTEVWRUw6IGVudi5WSVRFX0RFQlVHX0xFVkVMLFxuICAgICAgVklURV9GT1JDRV9MT0dTOiBlbnYuVklURV9GT1JDRV9MT0dTLFxuICAgIH0pO1xuICB9XG4gIFxuICAvLyBcdTI3MDUgUGx1Z2luIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCh7XG4gICAgICBmYXN0UmVmcmVzaDogaXNEZXYsXG4gICAgfSlcbiAgXTtcbiAgXG4gIGlmIChpc0Rldikge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cbiAgXG4gIC8vIFx1MjcwNSBEZWZpbmUgZ2xvYmFsc1xuICBjb25zdCBkZWZpbmUgPSB7XG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkoaXNEZXYpLFxuICAgIF9fUFJPRF9fOiBKU09OLnN0cmluZ2lmeShpc1Byb2QpLFxuICAgIF9fTU9ERV9fOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgfTtcbiAgXG4gIHJldHVybiB7XG4gICAgZGVmaW5lLFxuICAgIFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBobXI6IHtcbiAgICAgICAgb3ZlcmxheTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICBwbHVnaW5zLFxuICAgIFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICAvLyBcdTI3MDUgRklYOiBFeHBsaWNpdCBSZWFjdCBhbGlhc2luZyB0byBwcmV2ZW50IHNjaGVkdWxlciBjb25mbGljdHNcbiAgICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcbiAgICAgICAgXCJzY2hlZHVsZXJcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9zY2hlZHVsZXJcIiksXG4gICAgICB9LFxuICAgICAgLy8gXHUyNzA1IEZJWDogRW5oYW5jZWQgZGVkdXBlIGZvciBzY2hlZHVsZXIgaXNzdWVzXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwic2NoZWR1bGVyXCJdLFxuICAgIH0sXG4gICAgXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogXCJlczIwMjBcIixcbiAgICAgIFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAvLyBcdTI3MDUgU21hcnQgY2h1bmtpbmcgYmFzZWQgb24geW91ciBkZXBlbmRlbmNpZXNcbiAgICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgICAgLy8gQ29yZSBSZWFjdFxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LWNvcmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBSYWRpeCBVSSBjb21wb25lbnRzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmFkaXgtdWknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUYW5TdGFjayBRdWVyeVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAdGFuc3RhY2svcmVhY3QtcXVlcnknKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXF1ZXJ5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU3VwYWJhc2VcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdzdXBhYmFzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENoYXJ0IGxpYnJhcmllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdjaGFydC5qcycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1jaGFydGpzLTInKSB8fCBpZC5pbmNsdWRlcygncmVjaGFydHMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2NoYXJ0cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEljb25zXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1pY29ucycpIHx8IGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtaWNvbnMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRGF0ZSB1dGlsaXRpZXNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZGF0ZS1mbnMnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2RhdGUtdXRpbHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGb3JtIGxpYnJhcmllc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1ob29rLWZvcm0nKSB8fCBpZC5pbmNsdWRlcygnQGhvb2tmb3JtJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmb3Jtcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE90aGVyIHZlbmRvciBsaWJyYXJpZXNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBcHAgY2h1bmtzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9jb250ZXh0cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY29udGV4dHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy91dGlscycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndXRpbHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBNYWluIGFwcCBjaHVua1xuICAgICAgICAgICAgcmV0dXJuICdtYWluJztcbiAgICAgICAgICB9LFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1MjcwNSBGaWxlIG5hbWluZyB3aXRoIGNhY2hlIGJ1c3RpbmdcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiIDogXCJhc3NldHMvW25hbWVdLmpzXCIsXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGlzUHJvZCA/IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIiA6IFwiYXNzZXRzL1tuYW1lXS5qc1wiLCBcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogaXNQcm9kID8gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XVwiIDogXCJhc3NldHMvW25hbWVdLltleHRdXCIsXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBleHRlcm5hbDogW10sXG4gICAgICAgIFxuICAgICAgICBvbndhcm4od2FybmluZywgd2Fybikge1xuICAgICAgICAgIC8vIFNraXAgd2FybmluZ3MgaW4gcHJvZHVjdGlvbiB1bmxlc3MgcmVxdWVzdGVkXG4gICAgICAgICAgaWYgKCFpc0RldiAmJiAhZW52LlZJVEVfU0hPV19CVUlMRF9XQVJOSU5HUykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgY29uc3QgaXNBcHBDb2RlID0gd2FybmluZy5pZCAmJiAhd2FybmluZy5pZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBjcml0aWNhbFdhcm5pbmdzID0gW1xuICAgICAgICAgICAgXCJNSVNTSU5HX0VYUE9SVFwiLFxuICAgICAgICAgICAgXCJVTlJFU09MVkVEX0lNUE9SVFwiLCBcbiAgICAgICAgICAgIFwiRU1QVFlfQlVORExFXCIsXG4gICAgICAgICAgICBcIlBMVUdJTl9FUlJPUlwiLFxuICAgICAgICAgICAgXCJDSVJDVUxBUl9ERVBFTkRFTkNZXCIsXG4gICAgICAgICAgXTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBpc0NyaXRpY2FsID0gY3JpdGljYWxXYXJuaW5ncy5pbmNsdWRlcyh3YXJuaW5nLmNvZGUpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFsd2F5cyBzaG93IGNyaXRpY2FsIHdhcm5pbmdzXG4gICAgICAgICAgaWYgKGlzQ3JpdGljYWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGxvZ0VudHJ5ID0gYCR7dGltZXN0YW1wfSAtIENSSVRJQ0FMICR7d2FybmluZy5jb2RlfTogJHt3YXJuaW5nLm1lc3NhZ2V9XFxuYDtcbiAgICAgICAgICAgIGZzLmFwcGVuZEZpbGVTeW5jKFwiYnVpbGQtd2FybmluZ3MubG9nXCIsIGxvZ0VudHJ5KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERUE4IENSSVRJQ0FMIFdBUk5JTkc6XCIsIHdhcm5pbmcuY29kZSwgd2FybmluZy5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmICh3YXJuaW5nLmlkKSBjb25zb2xlLmxvZyhcIiAgIFx1RDgzRFx1RENDMVwiLCB3YXJuaW5nLmlkKTtcbiAgICAgICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFNob3cgYXBwIGNvZGUgd2FybmluZ3MgaW4gZGV2XG4gICAgICAgICAgaWYgKGlzQXBwQ29kZSAmJiBpc0Rldikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdTI2QTBcdUZFMEYgIEFQUCBXQVJOSU5HOlwiLCB3YXJuaW5nLmNvZGUsIHdhcm5pbmcubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAod2FybmluZy5pZCkgY29uc29sZS5sb2coXCIgICBcdUQ4M0RcdURDQzFcIiwgd2FybmluZy5pZCk7XG4gICAgICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIENodW5rIHNpemUgbGltaXRzXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IGlzUHJvZCA/IDgwMCA6IDUwMDAsXG4gICAgICBcbiAgICAgIG1pbmlmeTogaXNQcm9kID8gXCJlc2J1aWxkXCIgOiBmYWxzZSxcbiAgICAgIHNvdXJjZW1hcDogaXNEZXYgPyB0cnVlIDogZmFsc2UsXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcbiAgICAgIC4uLihpc1Byb2QgJiYge1xuICAgICAgICBlc2J1aWxkOiB7XG4gICAgICAgICAgLy8gUmVtb3ZlIGNvbnNvbGUgbG9ncyBpbiBwcm9kdWN0aW9uICh1bmxlc3MgZm9yY2VkKVxuICAgICAgICAgIGRyb3A6IGVudi5WSVRFX0ZPUkNFX0xPR1MgPT09ICd0cnVlJyA/IFtcImRlYnVnZ2VyXCJdIDogW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdLFxuICAgICAgICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxuICAgICAgICAgIG1pbmlmeUlkZW50aWZpZXJzOiB0cnVlLFxuICAgICAgICAgIG1pbmlmeVN5bnRheDogdHJ1ZSxcbiAgICAgICAgICBtaW5pZnlXaGl0ZXNwYWNlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLy8gQ1NTIG9wdGltaXphdGlvblxuICAgICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICAgICAgXG4gICAgICAgIC8vIEFzc2V0IG9wdGltaXphdGlvbiAgXG4gICAgICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LFxuICAgICAgfSksXG4gICAgfSxcbiAgICBcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgLy8gXHUyNzA1IENvcmUgUmVhY3QgKGZpeGVkIGZvciBzY2hlZHVsZXIgaXNzdWVzKVxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgUm91dGVyXG4gICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IFRhblN0YWNrIFF1ZXJ5XG4gICAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgVUkgTGlicmFyaWVzIGJhc2VkIG9uIHlvdXIgcGFja2FnZS5qc29uXG4gICAgICAgIFwibHVjaWRlLXJlYWN0XCIsXG4gICAgICAgIFwiY2xzeFwiLFxuICAgICAgICBcInRhaWx3aW5kLW1lcmdlXCIsXG4gICAgICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCIsXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgU3VwYWJhc2VcbiAgICAgICAgXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBDaGFydHNcbiAgICAgICAgXCJjaGFydC5qc1wiLFxuICAgICAgICBcInJlYWN0LWNoYXJ0anMtMlwiLCBcbiAgICAgICAgXCJyZWNoYXJ0c1wiLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IERhdGUgdXRpbGl0aWVzXG4gICAgICAgIFwiZGF0ZS1mbnNcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBGb3JtIGxpYnJhcmllc1xuICAgICAgICBcInJlYWN0LWhvb2stZm9ybVwiLFxuICAgICAgICBcIkBob29rZm9ybS9yZXNvbHZlcnNcIixcbiAgICAgICAgXCJ6b2RcIixcbiAgICAgICAgXG4gICAgICAgIC8vIFx1MjcwNSBPdGhlciB1dGlsaXRpZXNcbiAgICAgICAgXCJzb25uZXJcIixcbiAgICAgICAgXCJjbWRrXCIsXG4gICAgICAgIFwidmF1bFwiLFxuICAgICAgICBcInJlYWN0LWRheS1waWNrZXJcIixcbiAgICAgIF0sXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBFeGNsdWRlIGxhcmdlIGxpYnJhcmllc1xuICAgICAgZXhjbHVkZTogW1xuICAgICAgICBcInhsc3hcIiwgLy8gTGFyZ2UgRXhjZWwgbGlicmFyeVxuICAgICAgXSxcbiAgICAgIFxuICAgICAgLy8gXHUyNzA1IEZJWDogQ3JpdGljYWwgZm9yIHNjaGVkdWxlciBlcnJvclxuICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgIGZvcmNlOiB0cnVlLCAvLyBGb3JjZSByZWJ1aWxkIHRvIGNsZWFyIHNjaGVkdWxlciBjb25mbGljdHNcbiAgICAgIFxuICAgICAgLy8gXHUyNzA1IEVTQnVpbGQgb3B0aW9ucyBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgQ1NTIGNvbmZpZ3VyYXRpb25cbiAgICBjc3M6IHtcbiAgICAgIGRldlNvdXJjZW1hcDogaXNEZXYsXG4gICAgICBtb2R1bGVzOiB7XG4gICAgICAgIGxvY2Fsc0NvbnZlbnRpb246ICdjYW1lbENhc2VPbmx5JyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgUHJldmlldyBjb25maWd1cmF0aW9uICBcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA0MTczLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFx1MjcwNSBFU0J1aWxkIGdsb2JhbCBjb25maWdcbiAgICBlc2J1aWxkOiB7XG4gICAgICBsb2dPdmVycmlkZToge1xuICAgICAgICAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcsXG4gICAgICB9LFxuICAgICAgLy8gXHUyNzA1IEZJWDogRGVmaW5lIHNjaGVkdWxlciBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgZGVmaW5lOiB7XG4gICAgICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFx1MjcwNSBFbnZpcm9ubWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9uc1xuICAgIC4uLihpc0RldiAmJiB7XG4gICAgICBjbGVhclNjcmVlbjogZmFsc2UsXG4gICAgfSksXG4gICAgXG4gICAgLi4uKGlzUHJvZCAmJiB7XG4gICAgICBsb2dMZXZlbDogJ3dhcm4nLFxuICAgIH0pLFxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLGNBQWMsZUFBZTtBQUMvUCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMsdUJBQXVCO0FBSmhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUczQyxRQUFNLFFBQVEsU0FBUztBQUN2QixRQUFNLFNBQVMsU0FBUztBQUd4QixNQUFJLE9BQU87QUFDVCxZQUFRLElBQUksd0JBQWlCLElBQUksRUFBRTtBQUNuQyxZQUFRLElBQUksb0NBQTZCO0FBQUEsTUFDdkMsa0JBQWtCLElBQUk7QUFBQSxNQUN0QixpQkFBaUIsSUFBSTtBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNIO0FBR0EsUUFBTSxVQUFVO0FBQUEsSUFDZCxNQUFNO0FBQUEsTUFDSixhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUVBLE1BQUksT0FBTztBQUNULFlBQVEsS0FBSyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2hDO0FBR0EsUUFBTSxTQUFTO0FBQUEsSUFDYixTQUFTLEtBQUssVUFBVSxLQUFLO0FBQUEsSUFDN0IsVUFBVSxLQUFLLFVBQVUsTUFBTTtBQUFBLElBQy9CLFVBQVUsS0FBSyxVQUFVLElBQUk7QUFBQSxJQUM3Qix3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxFQUM3QztBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxTQUFTO0FB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
