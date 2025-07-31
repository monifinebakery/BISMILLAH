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
        // Force single React instance
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: 'es2020', // ✅ Updated for better optimization
      rollupOptions: {
        output: {
          // ✅ PROPER manual chunking for bundle optimization
          manualChunks: (id) => {
            // ✅ Core React libraries
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router')) {
              return 'react-vendor';
            }
            
            // ✅ UI Component libraries
            if (id.includes('node_modules/@radix-ui') || 
                id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/class-variance-authority') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge')) {
              return 'ui-vendor';
            }
            
            // ✅ Query and state management
            if (id.includes('node_modules/@tanstack/react-query') ||
                id.includes('node_modules/zustand')) {
              return 'data-vendor';
            }
            
            // ✅ Chart libraries (heavy)
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/chart.js') ||
                id.includes('node_modules/d3')) {
              return 'charts-vendor';
            }
            
            // ✅ Date/Time libraries
            if (id.includes('node_modules/date-fns') ||
                id.includes('node_modules/moment') ||
                id.includes('node_modules/dayjs')) {
              return 'date-vendor';
            }
            
            // ✅ Supabase & API libraries
            if (id.includes('node_modules/@supabase') ||
                id.includes('node_modules/supabase')) {
              return 'supabase-vendor';
            }
            
            // ✅ Utility libraries
            if (id.includes('node_modules/lodash') ||
                id.includes('node_modules/ramda') ||
                id.includes('node_modules/uuid')) {
              return 'utils-vendor';
            }
            
            // ✅ Toast/notification libraries
            if (id.includes('node_modules/sonner') ||
                id.includes('node_modules/react-hot-toast')) {
              return 'toast-vendor';
            }
            
            // ✅ Recipe-related modules
            if (id.includes('/src/contexts/RecipeContext') ||
                id.includes('/src/components/recipe/') ||
                id.includes('/src/pages/Recipes')) {
              return 'recipe-module';
            }
            
            // ✅ Operational Cost modules
            if (id.includes('/src/components/operational-costs/')) {
              return 'operational-cost-module';
            }
            
            // ✅ Warehouse modules
            if (id.includes('/src/components/warehouse/')) {
              return 'warehouse-module';
            }
            
            // ✅ Order modules
            if (id.includes('/src/components/orders/')) {
              return 'order-module';
            }
            
            // ✅ Supplier modules
            if (id.includes('/src/components/supplier/') ||
                id.includes('/src/contexts/SupplierContext')) {
              return 'supplier-module';
            }
            
            // ✅ Purchase modules
            if (id.includes('/src/components/purchase/')) {
              return 'purchase-module';
            }
            
            // ✅ Financial/Report modules
            if (id.includes('/src/components/financial/')) {
              return 'financial-module';
            }
            
            // ✅ Dashboard and common components
            if (id.includes('/src/components/dashboard/') ||
                id.includes('/src/pages/Dashboard')) {
              return 'dashboard-module';
            }
            
            // ✅ Other node_modules go to vendor
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            // ✅ Default chunk for app code
            return undefined;
          },
          
          // ✅ Better chunk file naming
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name;
            return `assets/${name}-[hash].js`;
          },
          
          // ✅ Entry files naming
          entryFileNames: 'assets/[name]-[hash].js',
          
          // ✅ Asset files naming
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        
        // ✅ Optimize bundle splitting
        onwarn(warning, warn) {
          // Suppress chunk size warnings for vendor bundles
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        }
      },
      
      // ✅ Chunk size settings
      chunkSizeWarningLimit: 600, // Increased limit for vendor chunks
      
      // ✅ Better minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Remove console.log in production
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        },
        mangle: {
          safari10: true
        }
      },
      
      // ✅ Source maps only in development
      sourcemap: mode === 'development'
    },
    
    // ✅ Enhanced dependency optimization
    optimizeDeps: {
      include: [
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "sonner"
      ],
      exclude: [
        // ✅ Large libraries that should be code-split
        "recharts",
        "chart.js",
        "d3"
      ],
      force: mode === 'development' // Only force in development
    },
    
    // ✅ Development optimizations
    ...(mode === 'development' && {
      esbuild: {
        // Faster builds in development
        target: 'es2020'
      }
    }),
    
    // ✅ Production optimizations
    ...(mode === 'production' && {
      define: {
        // Remove development code
        __DEV__: false
      }
    })
  };
});