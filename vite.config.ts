import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // ✅ Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  // ✅ Environment detection
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  
  // ✅ Check if logs should be kept in production
  const shouldKeepLogs = env.VITE_FORCE_LOGS === 'true';
  const shouldDropConsole = isProd && !shouldKeepLogs;

  // ✅ Debug info (only in dev)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
    });
  }

  // ✅ Debug build environment (only during build)
  if (isProd) {
    console.log('🔧 PRODUCTION BUILD - Environment Check:', {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole
    });
  }

  // ✅ Plugin configuration
  const plugins = [
    react({
      fastRefresh: isDev,
    })
  ];

  if (isDev) {
    plugins.push(componentTagger());
  }

  // ✅ Define globals - UPDATED for import.meta.env compatibility
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    global: 'globalThis',
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
        overlay: true,
      },
    },

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),

        // ✅ Force single React instances
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),

        // ✅ Single scheduler instance
        "scheduler": path.resolve(__dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__dirname, "./node_modules/scheduler/tracing"),
      },

      // ✅ Dedupe untuk modul duplikat
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

      rollupOptions: {
        output: {
          // ✅ Chunking terkontrol - OPTIMIZED
          manualChunks: (id) => {
            // Core React
            if (id.includes('/react/') && !id.includes('react-dom')&& !id.includes('scheduler')) {
              return 'react';
            }
            // React DOM + Scheduler
            if (id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-dom';
            }
            // Radix UI
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Charts - SPLIT BY TYPE
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts-chartjs';
            }
            if (id.includes('recharts')) {
              return 'charts-recharts';
            }
            // Icons
            if (id.includes('lucide-react') || id.includes('react-icons') || id.includes('@radix-ui/react-icons')) {
              return 'icons';
            }
            // Date utils
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            // Vendor fallback
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // App chunks - SPLIT COMPONENTS BY FEATURE
            if (id.includes('src/contexts')) {
              return 'contexts';
            }
            // Split components by feature areas to reduce size
            if (id.includes('src/components/ui/')) {
              return 'ui-components';
            }
            if (id.includes('src/components/financial/')) {
              return 'financial-components';
            }
            if (id.includes('src/components/promoCalculator/')) {
              return 'promo-components';
            }
            if (id.includes('src/components/profitAnalysis/')) {
              return 'profit-components';
            }
            if (id.includes('src/components/dashboard/')) {
              return 'dashboard-components';
            }
            if (id.includes('src/components')) {
              return 'shared-components';
            }
            if (id.includes('src/utils')) {
              return 'utils';
            }
            return 'main';
          },

          // ✅ File naming + cache bust
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",
        },

        external: [],

        onwarn(warning, warn) {
          // Skip warnings in production unless requested
          if (!isDev && !env.VITE_SHOW_BUILD_WARNINGS) {
            return;
          }

          const timestamp = new Date().toISOString();
          const isAppCode = warning.id && !warning.id.includes("node_modules");

          const criticalWarnings = [
            "MISSING_EXPORT",
            "UNRESOLVED_IMPORT",
            "EMPTY_BUNDLE",
            "PLUGIN_ERROR",
            "CIRCULAR_DEPENDENCY",
          ];

          const isCritical = criticalWarnings.includes(warning.code);

          // Always show critical warnings
          if (isCritical) {
            const logEntry = `${timestamp} - CRITICAL ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync("build-warnings.log", logEntry);
            console.log("🚨 CRITICAL WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   📁", warning.id);
            warn(warning);
            return;
          }

          // Show app code warnings in dev
          if (isAppCode && isDev) {
            console.log("⚠️  APP WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   📁", warning.id);
            warn(warning);
          }
        },
      },

      // Chunk size limits
      chunkSizeWarningLimit: isProd ? 800 : 5000,

      minify: isProd ? "esbuild" : false,
      sourcemap: isDev ? true : false,

      // ✅ Production optimizations
      ...(isProd && {
        cssCodeSplit: true,
        cssMinify: true,
        assetsInlineLimit: 4096,
      }),
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
        "react-day-picker",
      ],

      // ✅ Exclude large libraries
      exclude: [
        "xlsx",
      ],

      // ✅ Dedupe & force rebuild
      dedupe: ["react", "react-dom", "scheduler"],
      force: true,

      // ✅ ESBuild options for pre-bundling
      esbuildOptions: {
        target: "es2020",
        define: {
          global: 'globalThis',
        },
      },
    },

    // ✅ CSS configuration
    css: {
      devSourcemap: isDev,
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },

    // ✅ Preview configuration
    preview: {
      port: 4173,
      strictPort: false,
      open: false,
    },

    // ✅ Global esbuild config
    esbuild: {
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
      // ⛳️ CONDITIONAL: only drop console if not forced to keep logs
      ...(shouldDropConsole && {
        drop: ["console", "debugger"],
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      }),
      // ✅ When keeping logs in production, still minify but preserve console
      ...(isProd && shouldKeepLogs && {
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        // Don't drop console when VITE_FORCE_LOGS=true
      }),
      define: {
        global: 'globalThis',
      },
    },

    ...(isDev && {
      clearScreen: false,
    }),

    ...(isProd && {
      logLevel: 'warn',
    }),
  };
});