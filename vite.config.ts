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
      },
    },
    build: {
      // Deployment optimizations
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable for production
      
      rollupOptions: {
        output: {
          // Stable chunk names untuk better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
              : 'unknown';
            return `assets/${facadeModuleId}-[hash].js`;
          },
          
          // Ensure proper MIME types by using standard extensions
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              // Keep React together to avoid version conflicts
              if (id.includes("react") || id.includes("react-dom")) {
                return "react";
              }
              
              // XLSX - lazy loaded
              if (id.includes("xlsx")) {
                return "vendor_xlsx";
              }
              
              // Date utilities  
              if (id.includes("date-fns")) {
                return "vendor_date";
              }
              
              // Large libraries
              if (id.includes("@supabase")) {
                return "vendor_supabase";
              }
              
              if (id.includes("lucide-react")) {
                return "vendor_icons";
              }
              
              return "vendor";
            }
            
            // App-specific chunks
            if (id.includes("/pages/") || id.includes("Page.tsx")) {
              return "pages";
            }
            
            if (id.includes("/components/")) {
              return "components";
            }
          },
        },
        
        // Handle external dependencies properly
        external: (id) => {
          // Don't externalize anything for deployment
          return false;
        }
      },
    },
    
    // Ensure proper asset handling
    publicDir: 'public',
    
    // Preview server config (for testing deployment)
    preview: {
      port: 5000,
      host: true,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      }
    }
  };
});