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
        
        // ✅ SUPER DETAILED debug warnings (fixed placement)
        onwarn(warning, warn) {
          console.log('⚠️ DETAILED Rollup Warning:', {
            code: warning.code,
            message: warning.message,
            file: warning.loc?.file || warning.id,
            line: warning.loc?.line,
            column: warning.loc?.column,
            source: warning.source,
            names: warning.names,
            timestamp: new Date().toISOString()
          });
          
          // Extra details untuk specific warning types
          if (warning.code === 'CIRCULAR_DEPENDENCY') {
            console.log('  🔄 Cycle info:', warning.cycle);
            console.log('  📁 Files involved:', warning.loc?.file);
            return;
          }
          
          if (warning.code === 'UNRESOLVED_IMPORT') {
            console.log('  🚫 Cannot resolve:', warning.source);
            console.log('  📁 In file:', warning.importer);
            console.log('  🎯 External:', warning.isExternal);
          }
          
          if (warning.code === 'MISSING_EXPORT') {
            console.log('  ❌ Missing:', warning.binding);
            console.log('  📦 From:', warning.exporter);
            if (warning.frame) console.log('  📋 Code:\n', warning.frame);
          }
          
          // Show critical warnings in build output
          if (['MISSING_EXPORT', 'UNRESOLVED_IMPORT', 'EMPTY_BUNDLE'].includes(warning.code)) {
            warn(warning);
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