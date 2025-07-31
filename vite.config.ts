import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
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
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        // ✅ EMERGENCY: NO CHUNKING AT ALL
        output: {
          manualChunks: undefined, // Disable all manual chunking
          
          // ✅ Still keep detailed warnings
          // (This goes in rollupOptions level, not output level - my mistake)
        },
        
        // ✅ Simple file logging seperti yang kamu mau
        onwarn(warning, warn) {
          const logEntry = `${new Date().toISOString()} - ${warning.code}: ${warning.message}\n`;
          fs.appendFileSync('build-warnings.log', logEntry);
          
          console.log('⚠️ Rollup Warning:', warning.code, warning.message);
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        }
      },
      
      // ✅ Increase chunk size limit - single bundle will be larger
      chunkSizeWarningLimit: 3000,
      
      minify: 'esbuild',
      sourcemap: mode === 'development',
      
      // ✅ Production optimizations
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger'],
          legalComments: 'none'
        }
      })
    },
    
    // ✅ Enhanced dependency optimization - force React bundling
    optimizeDeps: {
      include: [
        // Core React
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        
        // Router
        "react-router-dom",
        
        // UI
        "lucide-react",
        
        // State
        "@tanstack/react-query",
        
        // Utils yang sering bermasalah
        "clsx",
        "tailwind-merge"
      ],
      
      // ✅ Force dedupe
      dedupe: ["react", "react-dom"],
      
      // ✅ Force pre-bundling
      force: true
    }
  };
});