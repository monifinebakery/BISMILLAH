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
        output: {
          // ✅ ULTRA SAFE: Keep React dengan semua UI dependencies
          manualChunks: (id) => {
            // ✅ CRITICAL FIX: Group React dengan semua yang membutuhkannya
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/@radix-ui') ||
                id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/class-variance-authority') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge')) {
              return 'react-ui-vendor'; // Semua UI components dengan React
            }
            
            // ✅ API libraries - safe to separate karena tidak depend React
            if (id.includes('node_modules/@supabase') ||
                id.includes('node_modules/supabase')) {
              return 'supabase-vendor';
            }
            
            // ✅ Utilities yang tidak depend React
            if (id.includes('node_modules/lodash') ||
                id.includes('node_modules/date-fns') ||
                id.includes('node_modules/uuid')) {
              return 'utils-vendor';
            }
            
            // ✅ Chart libraries - KEEP IN MAIN BUNDLE untuk sekarang
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/chart.js') ||
                id.includes('node_modules/d3')) {
              return undefined; // Main bundle - tidak dipisah
            }
            
            // ✅ Router - depends on React, keep with main atau React
            if (id.includes('node_modules/react-router')) {
              return 'react-ui-vendor'; // Gabung dengan React
            }
            
            // ✅ Other safe vendor code
            if (id.includes('node_modules')) {
              return 'other-vendor';
            }
            
            return undefined;
          }
        },
        
        // ✅ SUPER DETAILED debug warnings
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
      
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      sourcemap: mode === 'development'
    },
    
    optimizeDeps: {
      include: [
        // ✅ CRITICAL: Pastikan React ecosystem ter-bundle dengan benar
        "react", 
        "react-dom", 
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        
        // ✅ UI components yang depend React
        "lucide-react",
        "@radix-ui/react-slot",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        
        // ✅ State management
        "@tanstack/react-query",
        "zustand",
        
        // ✅ Toast yang depend React
        "sonner"
      ],
      
      // ✅ Force single React instance
      dedupe: ["react", "react-dom"],
      
      // ✅ ESBuild options
      esbuildOptions: {
        // Preserve React names untuk debugging
        keepNames: mode === 'development',
        target: 'es2020'
      }
    }
  };
});