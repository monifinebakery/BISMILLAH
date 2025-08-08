import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // ✅ ENHANCED: Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // ✅ ENHANCED: Better environment detection
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  const isPreview = mode === 'preview';
  
  // ✅ Debug environment loading (only in dev)
  if (isDev) {
    console.log(`🔍 Vite Mode: ${mode}`);
    console.log(`🔍 Environment Variables:`, {
      VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
      VITE_DEBUG_COMPONENT: env.VITE_DEBUG_COMPONENT,
      VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
    });
  }
  
  // ✅ ENHANCED: Plugin configuration
  const plugins = [
    react({
      // Enable fast refresh
      fastRefresh: isDev,
    })
  ];
  
  if (isDev) {
    plugins.push(componentTagger());
  }
  
  // ✅ ENHANCED: Define globals
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
    // ✅ FIXED: Remove extra asterisks
    'process.env.NODE_ENV': JSON.stringify(mode),
  };
  
  return {
    define,
    
    server: {
      host: "::",
      port: 8080,
      // ✅ ENHANCED: Better dev server configuration
      open: false, // Don't auto-open browser
      strictPort: false, // Allow fallback to other ports
      hmr: {
        overlay: true, // Show errors in overlay
      },
    },
    
    plugins,
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // ✅ ENHANCED: More specific React aliasing
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
    
    build: {
      target: "es2020",
      
      rollupOptions: {
        output: {
          // ✅ ENHANCED: Better chunking strategy for performance
          manualChunks: (id) => {
            // Vendor chunk for node_modules
            if (id.includes('node_modules')) {
              // Split large libraries into separate chunks
              if (id.includes('@tanstack/react-query')) {
                return 'react-query';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
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
            
            // Default chunk for everything else
            return 'main';
          },
          
          // ✅ ENHANCED: Better file naming with cache busting
          entryFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js",
          chunkFileNames: isProd ? "assets/[name]-[hash].js" : "assets/[name].js", 
          assetFileNames: isProd ? "assets/[name]-[hash].[ext]" : "assets/[name].[ext]",
        },
        
        external: [],
        
        onwarn(warning, warn) {
          // ✅ ENHANCED: Better warning handling
          if (!isDev && !env.VITE_SHOW_BUILD_WARNINGS) {
            // Skip warnings in production unless explicitly requested
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
          
          // Show app code warnings in dev or when explicitly requested
          if (isAppCode && (isDev || env.VITE_SHOW_ALL_WARNINGS === 'true')) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync("build-warnings.log", logEntry);
            console.log("⚠️  APP WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   📁", warning.id);
            warn(warning);
          }
        },
      },
      
      // ✅ ENHANCED: Chunk size optimization
      chunkSizeWarningLimit: isProd ? 1000 : 5000, // Stricter limit in prod
      
      minify: isProd ? "esbuild" : false,
      sourcemap: isDev ? true : false,
      
      // ✅ ENHANCED: Production optimizations
      ...(isProd && {
        esbuild: {
          // ✅ ALWAYS drop console logs in production for security & performance
          // Only keep them if explicitly forced for debugging (use sparingly!)
          drop: env.VITE_FORCE_LOGS === 'true' ? ["debugger"] : ["console", "debugger"],
          legalComments: "none",
          // ✅ ENHANCED: Additional minification
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true,
        },
        
        // ✅ ENHANCED: CSS optimization
        cssCodeSplit: true,
        cssMinify: true,
        
        // ✅ ENHANCED: Asset optimization
        assetsInlineLimit: 4096, // Inline small assets
        

      }),
    },
    
    optimizeDeps: {
      include: [
        // ✅ ENHANCED: Core dependencies
        "react",
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        
        // ✅ ENHANCED: Router and query
        "react-router-dom",
        "@tanstack/react-query",
        
        // ✅ ENHANCED: UI dependencies
        "lucide-react",
        "clsx",
        "tailwind-merge",
        
        // ✅ ENHANCED: Supabase
        "@supabase/supabase-js",
        
        // ✅ ENHANCED: Date utilities
        "date-fns",
        "date-fns/locale",
        
        // ✅ ENHANCED: Utility libraries that benefit from pre-bundling
        "lodash-es",
        "recharts",
      ],
      
      // ✅ ENHANCED: Exclude dependencies that should not be pre-bundled
      exclude: [
        // Large libraries that are better loaded on-demand
        "@tensorflow/tfjs",
        "three",
      ],
      
      dedupe: ["react", "react-dom"],
      force: isDev, // Force re-bundle in dev, use cache in prod
    },
    
    // ✅ ENHANCED: CSS configuration
    css: {
      devSourcemap: isDev,
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    
    // ✅ ENHANCED: Preview configuration
    preview: {
      port: 4173,
      strictPort: false,
      open: false,
    },
    
    // ✅ ENHANCED: Performance configuration
    esbuild: {
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
    },
    
    // ✅ ENHANCED: Environment-specific configurations
    ...(isDev && {
      // Development-specific options
      clearScreen: false,
    }),
    
    ...(isProd && {
      // Production-specific options
      logLevel: 'warn',
    }),
  };
});