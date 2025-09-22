// vite.config.ts — safe dev logs, prod-only strip, Netlify non-prod keep-logs
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import removeConsole from "vite-plugin-remove-console";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

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
   
  // 🔧 Auto-update build information
  const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local';
  const buildTime = new Date().toISOString();
  
  console.log("🐛 [VITE CONFIG]", {
    mode,
    isProd,
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT,
    keepLogs,
    VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
    // Auto-update info
    buildId,
    commitHash: commitHash.slice(0, 8),
    buildTime
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
        : []
      ),
      // ...(isProd && !keepLogs
      //   ? [
      //       removeConsole({
      //         includes: ["log", "debug", "info", "warn", "trace"],
      //       }),
      //     ]
      //   : []
      // ),
      // VitePWA disabled - using custom service worker implementation
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   devOptions: {
      //     enabled: true
      //   },
      //   manifest: {
      //     name: 'Bismillah App',
      //     short_name: 'Bismillah',
      //     description: 'My Awesome App description',
      //     theme_color: '#ffffff',
      //     icons: [
      //       {
      //         src: 'pwa-192x192.png',
      //         sizes: '192x192',
      //         type: 'image/png'
      //       },
      //       {
      //         src: 'pwa-512x512.png',
      //         sizes: '512x512',
      //         type: 'image/png'
      //       }
      //     ]
      //   },
      //   workbox: {
      //     // Exclude very large rarely-used chunks from precache to speed up first install on mobile
      //     maximumFileSizeToCacheInBytes: 700_000, // ~0.7 MB limit
      //     globIgnores: [
      //       '**/vendor-*.js',
      //       '**/excel-*.js',
      //       '**/charts-*.js',
      //       '**/*.map',
      //       'stats.html'
      //     ],
      //     navigateFallback: '/index.html',
      //     runtimeCaching: [
      //       {
      //         // Supabase REST GET requests
      //         urlPattern: new RegExp('^https://[a-zA-Z0-9.-]+\\.supabase\\.co/rest/v1/.*'),
      //         handler: 'NetworkFirst',
      //         method: 'GET',
      //         options: {
      //           cacheName: 'supabase-rest-cache',
      //           networkTimeoutSeconds: 3,
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           },
      //           expiration: {
      //             maxEntries: 200,
      //             maxAgeSeconds: 60 * 60 * 24 * 3 // 3 days
      //           }
      //         }
      //       },
      //       {
      //         // Supabase public storage assets
      //         urlPattern: new RegExp('^https://[a-zA-Z0-9.-]+\\.supabase\\.co/storage/v1/object/public/.*'),
      //         handler: 'CacheFirst',
      //         method: 'GET',
      //         options: {
      //           cacheName: 'supabase-storage-cache',
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           },
      //           expiration: {
      //             maxEntries: 300,
      //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      //           }
      //         }
      //       },
      //       {
      //         // Images (any origin)
      //         // Note: generateSW requires string or RegExp, not a function
      //         urlPattern: new RegExp('\\.(?:png|jpg|jpeg|svg|gif|webp|avif)$'),
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'image-cache',
      //           expiration: {
      //             maxEntries: 200,
      //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      //           }
      //         }
      //       },
      //       {
      //         // Google Fonts (if used)
      //         urlPattern: new RegExp('^https://fonts\\.(?:googleapis|gstatic)\\.com/.*'),
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'google-fonts-cache',
      //           cacheableResponse: { statuses: [0, 200] },
      //           expiration: {
      //             maxEntries: 50,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      //           }
      //         }
      //       }
      //     ]
      //   }
      // })
    ],

    // konsisten dengan netlify.toml (targetPort=5173) & preview 5500
    server: {
      port: 5173,
      strictPort: true,
      // host: true, // uncomment kalau mau akses via LAN IP
      // Simplified headers to prevent conflicts with external security services
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
        // Removed aggressive security headers that might trigger external security layers
      }
    },
    preview: {
      port: 5500,
      strictPort: true,
      // Simplified headers to prevent conflicts with external security services
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
        // Removed aggressive security headers that might trigger external security layers
      }
    },

    define: {
      __DEV__: JSON.stringify(!isProd),
      __PROD__: JSON.stringify(isProd),
      __CONSOLE_ENABLED__: JSON.stringify(!(isProd && !keepLogs)),
      // 🔧 Auto-update build information (available as import.meta.env)
      "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId),
      "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commitHash),
      "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
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
        // external: ["next-themes"], // Removed - not installed
        output: {
          // Enable code splitting and group a few heavy vendors for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Group very heavy libs explicitly
              if (id.includes('xlsx') || id.includes('exceljs') || id.includes('file-saver')) return 'excel';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('@supabase/')) return 'supabase';
              // Keep Radix in vendor to avoid React.forwardRef interop issues when split
              return 'vendor';
            }
            // Return undefined for app code to let Rollup/Vite perform default per-route/code-splitting
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
        "@radix-ui/react-select",
        "@supabase/supabase-js",
        "@supabase/postgrest-js"
      ],
      exclude: [
        // "next-themes" // Removed - not used
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