// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import removeConsole from "vite-plugin-remove-console"; // ⬅️ tambahkan
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const isProd = mode === "production";
  const shouldKeepLogs = env.VITE_FORCE_LOGS === "true";
  const shouldDropConsole = isProd && !shouldKeepLogs;

  const plugins = [
    react({ fastRefresh: isDev }),
    ...(isProd
      ? [removeConsole({
          // Hapus console.* umum saat production
          include: ["log", "debug", "info", "warn", "trace"],
        })]
      : []),
    ...(env.VITE_ANALYZE === 'true' ? [
      // Generate bundle analysis at dist/stats.html (no side effects in runtime)
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      })
    ] : []),
  ];
  if (isDev) plugins.push(componentTagger());

  return {
    plugins,

    // Resolve aliases so @ maps to src
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },

    // ⬇️ seluruh konfigurasi chunking kamu biarkan apa adanya
    build: {
      target: "es2020",
      minify: isProd ? "esbuild" : false,
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
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
            // Feature groups to avoid an oversized shared-components chunk
            if (id.includes("src/components/financial/")) return "financial-components";
            if (id.includes("src/components/promoCalculator/")) return "promo-components";
            if (id.includes("src/components/profitAnalysis/")) return "profit-components";
            if (id.includes("src/components/dashboard/")) return "dashboard-components";
            if (id.includes("src/components/orders/")) return "orders-components";
            if (id.includes("src/components/warehouse/")) return "warehouse-components";
            if (id.includes("src/components/purchase/")) return "purchase-components";
            if (id.includes("src/components/update/")) return "update-components";
            if (id.includes("src/components/assets/")) return "assets-components";
            if (id.includes("src/components/layout/")) return "layout-components";
            if (id.includes("src/components/pages/")) return "pages-components";
            if (id.includes("src/components/popups/")) return "popup-components";
            if (id.includes("src/components/common/") || id.includes("src/components/shared/")) return "common-components";
            if (id.includes("src/components")) return "shared-components";
            if (id.includes("src/utils")) return "utils";
            return "main";
          },
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",
        },
        onwarn(warning, warn) {
          // … (biarkan logika onwarn kamu yang lama)
          warn(warning);
        },
      },
    },

    // Drop debugger dan console agar tidak ada log di production
    esbuild: {
      drop: isProd ? ["debugger", "console"] : [],
    },

    // … sisanya (alias, optimizeDeps, server, dsb) tetap sesuai punyamu
  };
});
