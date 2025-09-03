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
              includes: ["log", "debug", "info", "warn", "trace"],
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
      chunkSizeWarningLimit: 800, // PERFORMANCE: Reduced untuk monitoring bundle size
      // DISABLED: Tree shaking may be too aggressive
      rollupOptions: {
        // treeshake: {
        //   moduleSideEffects: false,
        //   propertyReadSideEffects: false,
        //   tryCatchDeoptimization: false
        // },
        external: ["next-themes"],
        output: {
          // Enhanced chunk splitting for optimal loading
          manualChunks: (id) => {
            // Node modules splitting
            if (id.includes('node_modules')) {
              // Critical heavy libraries - separate chunks
              if (id.includes('xlsx') || id.includes('exceljs') || id.includes('file-saver')) return 'excel';
              if (id.includes('recharts') || id.includes('d3-')) return 'recharts';
              if (id.includes('@supabase/supabase-js')) return 'supabase';
              
              // Keep React ecosystem together to avoid context issues
              if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime') || 
                  id.includes('react-router') || id.includes('@remix-run/router')) return 'vendor';
              
              // Query and state management
              if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'react-query';
              
              // UI libraries
              if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('@hookform')) return 'ui-libs';
              
              // Date/time libraries
              if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'date-utils';
              
              // All other node_modules
              return 'vendor';
            }
            
            // More conservative app code splitting
            // Only split very large and isolated features
            if (id.includes('/components/warehouse/WarehousePage') || 
                id.includes('/components/operational-costs/OperationalCostPage')) {
              return 'features-heavy';
            }
            if (id.includes('/components/profitAnalysis/') && !id.includes('/hooks/') && !id.includes('/context/')) {
              return 'features-analysis';
            }
            
            // Keep contexts, hooks, and utilities in main bundle to avoid dependency issues
            // Keep most components in main bundle for better stability
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
        "react-dom/client",
        "react/jsx-runtime",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "@radix-ui/react-icons",
        "@radix-ui/react-dialog",
        "@radix-ui/react-select"
      ],
      exclude: [
        "next-themes",
        "@supabase/supabase-js"
      ],
      // Force include React ecosystem to avoid context issues
      force: true
    },
    
    // Image optimization and asset handling
    assetsInclude: ['**/*.webp', '**/*.avif', '**/*.svg'],
    
    // CSS optimization
    css: {
      devSourcemap: !isProd,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  };
});