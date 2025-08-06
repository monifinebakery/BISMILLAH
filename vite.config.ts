import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // ✅ ENHANCED: Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [react()];
  
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  
  // ✅ ENHANCED: Better environment detection
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  
  // ✅ Debug environment loading
  console.log(`🔍 Vite Mode: ${mode}`);
  console.log(`🔍 Environment Variables:`, {
    VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
    VITE_DEBUG_COMPONENT: env.VITE_DEBUG_COMPONENT,
    VITE_FORCE_LOGS: env.VITE_FORCE_LOGS,
  });
  
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode),
  };
  
  return {
    define,
    
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: () => "everything",
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
        external: [],
        onwarn(warning, warn) {
          const timestamp = new Date().toISOString();
          const isAppCode =
            warning.id && !warning.id.includes("node_modules");
          const criticalWarnings = [
            "MISSING_EXPORT",
            "UNRESOLVED_IMPORT",
            "EMPTY_BUNDLE",
            "PLUGIN_ERROR",
          ];
          const isCritical = criticalWarnings.includes(warning.code);
          if (isAppCode || isCritical) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}\n`;
            fs.appendFileSync("build-warnings.log", logEntry);
            console.log("🚨 CODE WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   📁", warning.id);
            warn(warning);
          }
        },
      },
      chunkSizeWarningLimit: 5000,
      minify: "esbuild",
      sourcemap: isDev,
      
      // ✅ ENHANCED: Conditional console removal
      ...(isProd && {
        esbuild: {
          // ✅ Only drop console in production if VITE_FORCE_LOGS is not true
          drop: env.VITE_FORCE_LOGS === 'true' ? ["debugger"] : ["console", "debugger"],
          legalComments: "none",
        },
      }),
    },
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
        "tailwind-merge",
      ],
      dedupe: ["react", "react-dom"],
      force: true,
    },
  };
});