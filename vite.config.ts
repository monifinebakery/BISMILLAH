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
  
  // ✅ Console management - cleaner logic
  const shouldKeepLogs = env.VITE_FORCE_LOGS === 'true';
  const shouldDropConsole = isProd && !shouldKeepLogs;

  // ✅ Debug info (only in dev)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Console Policy:`, {
      isDev,
      isProd,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
    });
  }

  // ✅ Build info (only during build)
  if (isProd) {
    console.log('🔧 PRODUCTION BUILD - Console Policy:', {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
      consoleWillBe: shouldDropConsole ? 'REMOVED' : 'KEPT'
    });
  }

  // ✅ Plugin configuration
  const plugins = [
    react({
      fastRefresh: isDev,
      // ✅ Optimize React refresh to prevent setInterval issues
      plugins: isDev ? [
        // Disable React DevTools in development if causing issues
        // ["@swc/plugin-react-remove-properties", { properties: ["data-testid"] }]
      ] : []
    })
  ];

  if (isDev) {
    plugins.push(componentTagger());
  }

  // ✅ Define globals for proper environment detection
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    __CONSOLE_ENABLED__: JSON.stringify(!shouldDropConsole),
    global: 'globalThis',
    // ✅ Custom defines for performance monitoring
    __ENABLE_PERFORMANCE_MONITOR__: JSON.stringify(isDev),
    __ENABLE_TIMEOUT_MONITORING__: JSON.stringify(isDev && env.VITE_MONITOR_TIMEOUTS !== 'false'),
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
        // ✅ Reduce HMR noise that might cause setInterval issues
        timeout: 5000,
      },
    },

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),

        // ✅ Force single React instances to prevent duplicate intervals
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),

        // ✅ Single scheduler instance - CRITICAL for preventing setInterval duplication
        "scheduler": path.resolve(__dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__dirname, "./node_modules/scheduler/tracing"),
      },

      // ✅ Dedupe untuk prevent duplicate modules causing multiple intervals
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
          // ✅ Optimized chunking to prevent setTimeout violations
          manualChunks: (id) => {
            // ✅ CRITICAL: Keep React + Scheduler together to prevent timing issues
            if (id.includes('/react/') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-core';
            }
            // Radix UI
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // ✅ CRITICAL: Keep Supabase together to prevent realtime connection issues
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Charts - split by type
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
            // App chunks
            if (id.includes('src/contexts')) {
              return 'contexts';
            }
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
            if (id.includes('src/components/orders/')) {
              return 'orders-components';
            }
            if (id.includes('src/components')) {
              return 'shared-components';
            }
            if (id.includes('src/utils')) {
              return 'utils';
            }
            return 'main';
          },

          // ✅ File naming with better cache control
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",

          // ✅ CRITICAL: Ensure proper module loading order to prevent timing issues
          ...(isProd && {
            generatedCode: 'es2015',
            interop: 'compat',
            systemNullSetters: false,
          }),
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
        // ✅ Optimize module preloading to prevent timing issues
        modulePreload: {
          polyfill: true,
          resolveDependencies: (filename, deps) => {
            // Preload critical chunks first to prevent race conditions
            const criticalChunks = ['react-core', 'supabase'];
            return deps.sort((a, b) => {
              const aIsCritical = criticalChunks.some(chunk => a.includes(chunk));
              const bIsCritical = criticalChunks.some(chunk => b.includes(chunk));
              return bIsCritical - aIsCritical;
            });
          }
        }
      }),
    },

    optimizeDeps: {
      include: [
        // ✅ Core React - include all to prevent duplication
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "scheduler",

        // Router
        "react-router-dom",

        // TanStack Query
        "@tanstack/react-query",

        // UI
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",

        // ✅ Supabase - include all to prevent connection issues
        "@supabase/supabase-js",
        "@supabase/gotrue-js",
        "@supabase/realtime-js",

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

      // ✅ Exclude problematic libraries
      exclude: [
        "xlsx",
        // Exclude if causing issues:
        // "@supabase/functions-js",
      ],

      // ✅ Force single instances
      dedupe: ["react", "react-dom", "scheduler"],
      force: true,

      // ✅ ESBuild options optimized for performance
      esbuildOptions: {
        target: "es2020",
        define: {
          global: 'globalThis',
        },
        // ✅ Prevent setTimeout violations during dev bundling
        keepNames: isDev,
        minifyIdentifiers: isProd,
        minifySyntax: isProd,
        treeShaking: isProd,
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

    // ✅ ESBuild config with PRECISE console management
    esbuild: {
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
      
      // ✅ DEVELOPMENT: Keep everything, no minification
      ...(isDev && {
        keepNames: true,
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: false,
        // Keep console.* in development
      }),
      
      // ✅ PRODUCTION with forced logs: Minify but keep console
      ...(isProd && shouldKeepLogs && {
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        // Console statements KEPT when VITE_FORCE_LOGS=true
        keepNames: false,
      }),
      
      // ✅ PRODUCTION without forced logs: Remove console completely
      ...(isProd && !shouldKeepLogs && {
        drop: ["console", "debugger"],
        legalComments: "none",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        keepNames: false,
      }),
      
      define: {
        global: 'globalThis',
      },
    },

    // ✅ Development specific settings
    ...(isDev && {
      clearScreen: false,
      // ✅ Optimize dev server to prevent timing issues
      optimizeDeps: {
        force: false, // Don't force rebuild every time in dev
      },
    }),

    // ✅ Production specific settings
    ...(isProd && {
      logLevel: shouldKeepLogs ? 'info' : 'warn',
    }),
  };
});