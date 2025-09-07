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
      headers: {
        // ✅ ENHANCED SECURITY HEADERS
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
        // Strict Transport Security (HSTS)
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        // Content Security Policy
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kewhzkfvswbimmwtpymw.supabase.co https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://kewhzkfvswbimmwtpymw.supabase.co wss://kewhzkfvswbimmwtpymw.supabase.co https://challenges.cloudflare.com",
          "frame-src https://challenges.cloudflare.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; '),
        // Security additional headers
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    },
    preview: {
      port: 5500,
      strictPort: true,
      headers: {
        // ✅ ENHANCED SECURITY HEADERS (same as server)
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kewhzkfvswbimmwtpymw.supabase.co https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://kewhzkfvswbimmwtpymw.supabase.co wss://kewhzkfvswbimmwtpymw.supabase.co https://challenges.cloudflare.com",
          "frame-src https://challenges.cloudflare.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; '),
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
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
          // Ultra-conservative chunk splitting - NO app code splitting to avoid React issues
          manualChunks: (id) => {
            // Node modules splitting
            if (id.includes('node_modules')) {
              // Only separate libraries that are 100% pure utilities with zero dependencies
              if (id.includes('xlsx') || id.includes('exceljs') || id.includes('file-saver')) return 'excel';
              
              // Keep ALL other libraries in vendor to avoid any dependency/initialization issues
              // This includes: react, react-dom, recharts, @radix-ui, @tanstack, supabase, date libs, etc.
              return 'vendor';
            }
            
            // NO app code splitting - keep everything in main bundle for React access
            // All components, hooks, contexts stay in main bundle to prevent forwardRef errors
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
        "next-themes"
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