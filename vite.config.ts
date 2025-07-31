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
        
        // ✅ Enhanced file logging dengan filtering
        onwarn(warning, warn) {
          const timestamp = new Date().toISOString();
          
          // ✅ Filter warnings - hanya log yang relevant
          const shouldLog = !warning.id?.includes('node_modules') || 
                           ['MISSING_EXPORT', 'UNRESOLVED_IMPORT', 'EMPTY_BUNDLE'].includes(warning.code);
          
          if (shouldLog) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync('build-warnings.log', logEntry);
          }
          
          // ✅ Console output - show only relevant warnings
          if (warning.id && !warning.id.includes('node_modules')) {
            // Warning dari app code - IMPORTANT
            console.log('🚨 APP WARNING:', warning.code, warning.message);
            console.log('   📁 File:', warning.id);
            warn(warning); // Show in build output
          } else {
            // Warning dari node_modules - just log quietly
            console.log('⚠️  Library Warning:', warning.code, 
                       warning.id?.replace(/.*node_modules\//, '') || 'unknown');
          }
          
          // Skip circular dependencies dan THIS_IS_UNDEFINED dari libraries
          if (warning.code === 'CIRCULAR_DEPENDENCY' || 
              warning.code === 'THIS_IS_UNDEFINED') {
            return; // Don't show in build output
          }
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