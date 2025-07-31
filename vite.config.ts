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
        },
        
        // ✅ ULTRA CLEAN: Only show YOUR code warnings
        onwarn(warning, warn) {
          const timestamp = new Date().toISOString();
          
          // ✅ Only care about app code warnings
          const isAppCode = warning.id && !warning.id.includes('node_modules');
          const criticalWarnings = ['MISSING_EXPORT', 'UNRESOLVED_IMPORT', 'EMPTY_BUNDLE', 'PLUGIN_ERROR'];
          const isCritical = criticalWarnings.includes(warning.code);
          
          // ✅ Only log and show warnings from YOUR code
          if (isAppCode || isCritical) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync('build-warnings.log', logEntry);
            
            console.log('🚨 CODE WARNING:', warning.code, warning.message);
            if (warning.id) console.log('   📁', warning.id);
            warn(warning);
          }
          
          // ✅ All library warnings are completely ignored
          // No console spam, no build output spam
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
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "lucide-react",
        "@tanstack/react-query",
        "clsx",
        "tailwind-merge"
      ],
      dedupe: ["react", "react-dom"],
      force: true
    }
  };
});