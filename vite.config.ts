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
  
  // ✅ Debug info (only in dev)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
    });
  }
  
  // ✅ Plugin configuration
  const plugins = [
    react({
      fastRefresh: isDev,
      // ✅ FIX: Better JSX configuration
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: isDev ? [] : []
      }
    })
  ];
  
  if (isDev) {
    plugins.push(componentTagger());
  }
  
  // ✅ Define globals
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    'process.env.NODE_ENV': JSON.stringify(mode),
    // ✅ FIX: Global scheduler polyfill
    global: 'globalThis',
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
        port: 24678, // Different port for HMR
      },
    },
    
    plugins,
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        
        // ✅ CRITICAL FIX: Force single React instances with absolute paths
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
        
        // ✅ SCHEDULER FIX: Force single scheduler instance
        "scheduler": path.resolve(__dirname, "./node_modules/scheduler"),
        "scheduler/tracing": path.resolve(__dirname, "./node_modules/scheduler/tracing"),
        "scheduler/unstable_mock": path.resolve(__dirname, "./node_modules/scheduler/unstable_mock"),
        
        // ✅ Additional React-related aliases
        "react-dom/client": path.resolve(__dirname, "./node_modules/react-dom/client"),
        "react-dom/server": path.resolve(__dirname, "./node_modules/react-dom/server"),
      },
      
      // ✅ ENHANCED: Comprehensive dedupe list
      dedupe: [
        "react", 
        "react-dom", 
        "scheduler",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "react-dom/server"
      ],
      
      // ✅ Ensure proper module resolution
      conditions: ['import', 'module', 'browser', 'default'],
      mainFields: ['browser', 'module', 'main'],
    },
    
    build: {
      target: "es2020",
      
      rollupOptions: {
        output: {
          // ✅ Smart chunking with scheduler fix
          manualChunks: (id) => {
            // ✅ CRITICAL: Keep React + Scheduler together
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-core';
            }
            
            // Radix UI components
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
            
            // Chart libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'charts';
            }
            
            // Icons
            if (id.includes('lucide-react') || id.includes('react-icons') || id.includes('@radix-ui/react-icons')) {
              return 'icons';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            
            // Other vendor libraries
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
            
            // Main app chunk
            return 'main';
          },
          
          // ✅ File naming with cache busting
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js", 
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",
        },
        
        // ✅ Don't externalize scheduler - keep it bundled
        external: [],
        
        onwarn(warning, warn) {
          // Skip warnings in production unless requested
          if (!isDev && !env.VITE_SHOW_BUILD_WARNINGS) {
            return;
          }
          
          // ✅ Ignore scheduler warnings
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('scheduler')) {
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
        esbuild: {
          // Remove console logs in production (unless forced)
          drop: env.VITE_FORCE_LOGS === 'true' ? ["debugger"] : ["console", "debugger"],
          legalComments: "none",
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true,
        },
        
        // CSS optimization
        cssCodeSplit: true,
        cssMinify: true,
        
        // Asset optimization  
        assetsInlineLimit: 4096,
      }),
    },
    
    optimizeDeps: {
      include: [
        // ✅ CRITICAL: Core React with scheduler
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "scheduler",
        "scheduler/tracing",
        
        // ✅ Router
        "react-router-dom",
        
        // ✅ TanStack Query
        "@tanstack/react-query",
        
        // ✅ UI Libraries
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
        "react-day-picker",
      ],
      
      // ✅ Exclude large libraries
      exclude: [
        "xlsx", // Large Excel library
      ],
      
      // ✅ CRITICAL: Enhanced dedupe for scheduler
      dedupe: ["react", "react-dom", "scheduler"],
      force: true, // Always force to clear conflicts
      
      // ✅ ESBuild options for compatibility
      esbuildOptions: {
        target: "es2020",
        define: {
          global: 'globalThis',
        },
        // ✅ FIX: Proper JSX handling
        jsx: 'automatic',
        jsxDev: isDev,
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
    
    // ✅ ESBuild global config
    esbuild: {
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
      // ✅ SCHEDULER FIX: Proper defines
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        global: 'globalThis',
      },
      jsx: 'automatic',
      jsxDev: isDev,
    },
    
    // ✅ Environment-specific configurations
    ...(isDev && {
      clearScreen: false,
    }),
    
    ...(isProd && {
      logLevel: 'warn',
    }),
  };
});