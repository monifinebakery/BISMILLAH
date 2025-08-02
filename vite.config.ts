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
        // ✅ EMERGENCY FIX: Disable ALL code splitting
        output: {
          manualChunks: () => 'everything', // Force everything into one chunk
          // ✅ Simplified naming to avoid weird hashes
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        },
        
        // ✅ Handle dynamic imports more safely
        external: [],
        
        // ✅ Clean warnings
        onwarn(warning, warn) {
          const timestamp = new Date().toISOString();
          
          const isAppCode = warning.id && !warning.id.includes('node_modules');
          const criticalWarnings = ['MISSING_EXPORT', 'UNRESOLVED_IMPORT', 'EMPTY_BUNDLE', 'PLUGIN_ERROR'];
          const isCritical = criticalWarnings.includes(warning.code);
          
          if (isAppCode || isCritical) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync('build-warnings.log', logEntry);
            
            console.log('🚨 CODE WARNING:', warning.code, warning.message);
            if (warning.id) console.log('   📁', warning.id);
            warn(warning);
          }
        }
      },
      
      // ✅ Large chunk size since we're using single bundle
      chunkSizeWarningLimit: 5000,
      
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
    
    // ✅ Enhanced dependency optimization
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