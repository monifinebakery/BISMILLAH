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
        // Force React to single instance
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: 'es2015',
      rollupOptions: {
        output: {
          // SIMPLIFIED: Minimal chunking to avoid React issues
          manualChunks: {
            // Keep ALL React stuff together
            'react-vendor': ['react', 'react-dom'],
            
            // Only separate truly heavy libraries
            'heavy-vendor': ['xlsx'],
            
            // Everything else in vendor
            'vendor': ['lucide-react', 'date-fns', '@supabase/supabase-js', 'sonner']
          }
        },
      },
    },
    
    // Force React optimization
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime"],
      force: true // Force re-optimization
    },
    
    // Clear cache on build
    cacheDir: mode === 'production' ? false : '.vite'
  };
});