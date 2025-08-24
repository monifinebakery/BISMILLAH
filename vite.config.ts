// vite.config.ts — safe dev logs, prod-only strip, Netlify non-prod keep-logs
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import removeConsole from "vite-plugin-remove-console";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  // ✅ hanya load VITE_* (client-safe)
  const env = loadEnv(mode, process.cwd());
  const isProd = mode === "production";

  // ✅ Netlify contexts: deploy-preview & branch-deploy (non-production)
  const isNetlifyNonProd =
    process.env.NETLIFY === "true" && process.env.CONTEXT !== "production";

  // ✅ Keep logs jika user force ATAU build Netlify non-prod
  const keepLogs = env.VITE_FORCE_LOGS === "true" || isNetlifyNonProd;

  // 🔎 Build-time visibility (muncul di log Netlify)
  // Hapus kalau sudah tidak perlu debug
   
  console.log("🐛 [VITE CONFIG]", {
    mode,
    isProd,
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT,
    keepLogs,
    VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
  });

  return {
    plugins: [
      react(),
      // ✅ strip console HANYA saat build production && tidak keepLogs
      ...(isProd && !keepLogs
        ? [
            removeConsole({
              include: ["log", "debug", "info", "warn", "trace"],
            }),
          ]
        : []),
      ...(env.VITE_ANALYZE === "true"
        ? [
            visualizer({
              filename: "dist/stats.html",
              template: "treemap",
              gzipSize: true,
              brotliSize: true,
              open: false,
            }),
          ]
        : []),
    ],

    // konsisten dengan netlify.toml (targetPort=5173) & preview 5500
    server: {
      port: 5173,
      strictPort: true,
      // host: true, // uncomment kalau mau akses via LAN IP
    },
    preview: {
      port: 5500,
      strictPort: true,
    },

    define: {
      __DEV__: JSON.stringify(!isProd),
      __PROD__: JSON.stringify(isProd),
      __CONSOLE_ENABLED__: JSON.stringify(!(isProd && !keepLogs)),
    },

    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },

    build: {
      target: "es2020",
      minify: isProd ? "esbuild" : false,
      sourcemap: !isProd,
      // Performance optimizations
      chunkSizeWarningLimit: 1000, // Increase limit to reduce warnings
      rollupOptions: {
        external: ["next-themes"],
        output: {
          manualChunks: (id) => {
            if (id.includes("@tanstack/react-query")) return "react-query";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("chart.js") || id.includes("react-chartjs-2"))
              return "charts-chartjs";
            if (id.includes("recharts")) return "charts-recharts";
            if (
              id.includes("lucide-react") ||
              id.includes("react-icons") ||
              id.includes("@radix-ui/react-icons")
            )
              return "icons";
            if (id.includes("date-fns")) return "date-utils";
            if (id.includes("react-hook-form") || id.includes("@hookform"))
              return "forms";
            if (id.includes("node_modules")) return "vendor";
            if (id.includes("src/contexts")) return "contexts";
            if (id.includes("src/components/ui/")) return "ui-components";
            if (id.includes("src/components/financial/"))
              return "financial-components";
            if (id.includes("src/components/promoCalculator/"))
              return "promo-components";
            if (id.includes("src/components/profitAnalysis/"))
              return "profit-components";
            if (id.includes("src/components/dashboard/"))
              return "dashboard-components";
            if (id.includes("src/components/orders/"))
              return "orders-components";
            if (id.includes("src/components/warehouse/"))
              return "warehouse-components";
            if (id.includes("src/components/purchase/"))
              return "purchase-components";
            if (id.includes("src/components/update/"))
              return "update-components";
            if (id.includes("src/components/assets/"))
              return "assets-components";
            if (id.includes("src/components/layout/"))
              return "layout-components";
            if (id.includes("src/components/pages/"))
              return "pages-components";
            if (id.includes("src/components/popups/"))
              return "popup-components";
            if (
              id.includes("src/components/common/") ||
              id.includes("src/components/shared/")
            )
              return "common-components";
            if (id.includes("src/components")) return "shared-components";
            if (id.includes("src/utils")) return "utils";
            return "main";
          },
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd
            ? "assets/[name]-[hash].[ext]"
            : "assets/[name].[ext]",
        },
        onwarn(warning, warn) {
          // Suppress circular dependency warnings for known safe cases
          if (warning.code === 'CIRCULAR_DEPENDENCY') {
            // Only warn about significant circular dependencies
            if (!warning.ids?.some(id => 
              id.includes('node_modules') || 
              id.includes('react') || 
              id.includes('react-dom')
            )) {
              warn(warning);
            }
            return;
          }
          warn(warning);
        },
      },
    },

    // ❌ jangan drop console di esbuild global (biar dev aman 100%)
    // esbuild: { drop: isProd && !keepLogs ? ["debugger", "console"] : [] },
    
    // Performance optimization: Enable caching
    cacheDir: "node_modules/.vite",
    
    // Optimization for dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "@supabase/supabase-js",
        "lucide-react",
        "@radix-ui/react-icons"
      ],
      exclude: ["next-themes"]
    }
  };
});