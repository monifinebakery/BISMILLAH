import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode, command }) => {
  const plugins = [react()];
  
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Force single React instance - ENHANCED
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    build: {
      target: 'es2015',
      // 🔧 ENABLE sourcemap for debugging production issues
      sourcemap: mode === 'development',
      // 🔧 Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 🚀 ENABLE smart chunking instead of disabling it completely
          manualChunks: (id) => {
            // Vendor chunk for all node_modules
            if (id.includes('node_modules')) {
              // Split large vendors
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('date-fns') || id.includes('recharts')) {
                return 'chart-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icon-vendor';
              }
              return 'vendor';
            }
            
            // Feature-based chunks for better caching
            if (id.includes('/warehouse/')) {
              return 'warehouse';
            }
            if (id.includes('/financial/')) {
              return 'financial';
            }
            if (id.includes('/purchase/') || id.includes('/pembelian/')) {
              return 'purchase';
            }
            if (id.includes('/recipe/') || id.includes('/resep/')) {
              return 'recipe';
            }
            if (id.includes('/supplier/')) {
              return 'supplier';
            }
            
            // UI components chunk
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
          },
          
          // 🎯 Better file naming for debugging
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop() 
              : 'chunk';
            return `assets/[name]-[hash].js`;
          },
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        
        // 🛡️ Handle external dependencies properly
        external: [],
        
        // 🔧 Rollup options for better error handling
        onwarn(warning, warn) {
          // Suppress certain warnings
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          warn(warning);
        }
      },
    },
    
    // 🚀 Enhanced optimizeDeps for better development experience
    optimizeDeps: {
      include: [
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        // Add commonly used libraries
        "react-router-dom",
        "date-fns",
        "lucide-react"
      ],
      force: mode === 'development',
      // 🔧 Exclude problematic packages from pre-bundling
      exclude: []
    },
    
    // 🎯 Additional configuration for production stability
    esbuild: {
      // Drop console logs in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    
    // 🌐 Ensure proper base URL handling
    base: mode === 'production' ? './' : '/',
    
    // 🔧 Preview server configuration
    preview: {
      host: "::",
      port: 4173,
      // Serve assets with correct MIME types
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  };
});