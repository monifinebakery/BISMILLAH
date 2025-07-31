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
      target: 'es2020',
      rollupOptions: {
        output: {
          // ✅ PERBAIKAN: Strategi chunking yang lebih aman
          manualChunks: (id) => {
            // ✅ CORE: React HARUS di chunk terpisah yang dimuat lebih dulu
            if (id.includes('node_modules/react/') && !id.includes('react-dom') && !id.includes('react-router')) {
              return 'react-core';
            }
            
            if (id.includes('node_modules/react-dom/')) {
              return 'react-dom-core';
            }
            
            // ✅ UI components yang depend pada React
            if (id.includes('node_modules/@radix-ui') || 
                id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/class-variance-authority') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge')) {
              return 'ui-vendor';
            }
            
            // ✅ Router setelah React core
            if (id.includes('node_modules/react-router')) {
              return 'react-router';
            }
            
            // ✅ Query dan state management
            if (id.includes('node_modules/@tanstack/react-query') ||
                id.includes('node_modules/zustand')) {
              return 'data-vendor';
            }
            
            // ✅ Chart libraries (dibuat optional/lazy load)
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/chart.js') ||
                id.includes('node_modules/d3')) {
              return 'charts-vendor';
            }
            
            // ✅ Heavy utilities
            if (id.includes('node_modules/date-fns') ||
                id.includes('node_modules/moment') ||
                id.includes('node_modules/dayjs')) {
              return 'date-vendor';
            }
            
            // ✅ API libraries
            if (id.includes('node_modules/@supabase') ||
                id.includes('node_modules/supabase')) {
              return 'supabase-vendor';
            }
            
            // ✅ Small utilities
            if (id.includes('node_modules/lodash') ||
                id.includes('node_modules/ramda') ||
                id.includes('node_modules/uuid')) {
              return 'utils-vendor';
            }
            
            // ✅ Toast libraries
            if (id.includes('node_modules/sonner') ||
                id.includes('node_modules/react-hot-toast')) {
              return 'toast-vendor';
            }
            
            // ✅ Application modules (lebih konservatif)
            if (id.includes('/src/contexts/') ||
                id.includes('/src/components/recipe/') ||
                id.includes('/src/pages/Recipes')) {
              return 'recipe-module';
            }
            
            if (id.includes('/src/components/operational-costs/')) {
              return 'operational-cost-module';
            }
            
            if (id.includes('/src/components/warehouse/')) {
              return 'warehouse-module';
            }
            
            if (id.includes('/src/components/orders/')) {
              return 'order-module';
            }
            
            if (id.includes('/src/components/supplier/')) {
              return 'supplier-module';
            }
            
            if (id.includes('/src/components/purchase/')) {
              return 'purchase-module';
            }
            
            if (id.includes('/src/components/financial/')) {
              return 'financial-module';
            }
            
            if (id.includes('/src/components/dashboard/') ||
                id.includes('/src/pages/Dashboard')) {
              return 'dashboard-module';
            }
            
            // ✅ Catch-all untuk node_modules lainnya
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            // ✅ Default untuk app code
            return undefined;
          },
          
          // ✅ Chunk file naming
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name;
            return `assets/${name}-[hash].js`;
          },
          
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        
        // ✅ External dependencies (jika diperlukan)
        external: [],
        
        onwarn(warning, warn) {
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        }
      },
      
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
      
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger'],
          legalComments: 'none'
        }
      }),
      
      sourcemap: mode === 'development'
    },
    
    // ✅ CRITICAL: Optimasi dependency
    optimizeDeps: {
      include: [
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "sonner",
        // ✅ TAMBAHAN: Include UI dependencies
        "@radix-ui/react-slot",
        "@radix-ui/react-toast",
        "class-variance-authority",
        "clsx",
        "tailwind-merge"
      ],
      exclude: [
        "recharts",
        "chart.js", 
        "d3"
      ],
      force: mode === 'development'
    },
    
    ...(mode === 'development' && {
      esbuild: {
        target: 'es2020'
      }
    }),
    
    ...(mode === 'production' && {
      define: {
        __DEV__: false
      }
    })
  };
});