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
          // Simplified chunking
          manualChunks: (id) => {
            if (id.includes('node_modules/react')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
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
        "react", 
        "react-dom", 
        "react-router-dom",
        "lucide-react"
      ]
    }
  };
});