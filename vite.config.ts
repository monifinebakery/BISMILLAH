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

  // ✅ NEW: Bundle analysis flags
  const shouldAnalyzeBundle = env.VITE_ANALYZE === 'true' || env.npm_config_analyze === 'true';
  const shouldShowSizes = env.VITE_SHOW_SIZES === 'true' || isDev;

  // ✅ Debug info (only in dev)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      VITE_ANALYZE: env.VITE_ANALYZE,
      VITE_SHOW_SIZES: env.VITE_SHOW_SIZES,
    });
  }

  // ✅ Debug build environment (only during build)
  if (isProd) {
    console.log('🔧 PRODUCTION BUILD - Environment Check:', {
      mode,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
      VITE_ANALYZE: env.VITE_ANALYZE,
      shouldKeepLogs,
      willDropConsole: shouldDropConsole,
      willAnalyzeBundle: shouldAnalyzeBundle
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

  // ✅ NEW: Bundle analyzer plugin (conditional)
  if (shouldAnalyzeBundle) {
    const { visualizer } = require('rollup-plugin-visualizer');
    plugins.push(
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
        title: 'Bundle Size Analysis - ' + new Date().toISOString(),
      })
    );
    console.log('📊 Bundle analyzer enabled - report will be at dist/bundle-analysis.html');
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
          // ✅ Chunking terkontrol
          manualChunks: (id) => {
            // ✅ NEW: Log large files during build
            if (shouldShowSizes && fs.existsSync(id)) {
              try {
                const stats = fs.statSync(id);
                const sizeInKB = Math.round(stats.size / 1024);
                
                // Log files larger than 100KB
                if (sizeInKB > 100) {
                  console.log(`📦 Large file detected: ${path.basename(id)} (${sizeInKB}KB)`);
                  
                  // Write to size report
                  const logEntry = `${new Date().toISOString()} - ${sizeInKB}KB - ${id}\n`;
                  fs.appendFileSync('bundle-sizes.log', logEntry);
                }
              } catch (e) {
                // Ignore file stat errors
              }
            }

            // Core React
            if (id.includes('/react/') && !id.includes('react-dom') && !id.includes('scheduler')) {
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
            // Charts
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'charts';
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
            // ✅ NEW: Large libraries detection
            if (id.includes('xlsx') || id.includes('sheetjs')) {
              return 'excel-utils';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            if (id.includes('moment') || id.includes('dayjs')) {
              return 'date-heavy';
            }
            if (id.includes('three') || id.includes('3d')) {
              return 'three-js';
            }
            if (id.includes('d3')) {
              return 'd3-utils';
            }
            // Vendor fallback
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // App chunks
            if (id.includes('src/contexts')) {
              return 'contexts';
            }
            if (id.includes('src/components')) {
              return 'components';
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

      // ✅ NEW: Adjusted chunk size limits with warnings
      chunkSizeWarningLimit: isProd ? 500 : 5000, // Lowered to catch more large chunks

      minify: isProd ? "esbuild" : false,
      sourcemap: isDev ? true : false,

      // ✅ Production optimizations
      ...(isProd && {
        cssCodeSplit: true,
        cssMinify: true,
        assetsInlineLimit: 4096,
        
        // ✅ NEW: Report bundle sizes
        reportCompressedSize: shouldShowSizes,
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

      // ✅ NEW: Exclude more large libraries to prevent bundling
      exclude: [
        "xlsx",
        "sheetjs",
        "moment", // Use date-fns instead
        "lodash", // Import specific functions only
        "three",  // 3D library
        "d3",     // Large data viz library
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
      logLevel: shouldShowSizes ? 'info' : 'warn',
    }),
  };
});