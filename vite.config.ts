import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode, command }) => {
  const plugins = [react()];
  
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  
  if (command === "build") {
    plugins.push(visualizer({ 
      open: true, 
      filename: "dist/stats.html",
      gzipSize: true,
      // brotliSize: true // Disabled karena ada issue di environment ini
    }));
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
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              // Pisahkan XLSX library yang besar (hanya dimuat saat export)
              if (id.includes("xlsx")) {
                return "vendor_xlsx";
              }
              
              // Pisahkan React ecosystem
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor_react";
              }
              
              // Pisahkan Recharts dan D3 karena besar
              // Walaupun ada comment di atas, kita tetap pisahkan untuk optimasi bundle size
              if (id.includes("recharts")) {
                return "vendor_recharts";
              }
              
              if (id.includes("d3-")) {
                return "vendor_d3";
              }
              
              // Library date handling
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              
              // Supabase ecosystem
              if (id.includes("@supabase")) {
                return "vendor_supabase";
              }
              
              // Icons
              if (id.includes("lucide-react")) {
                return "vendor_lucide";
              }
              
              // UI libraries
              if (id.includes("@radix-ui") || id.includes("class-variance-authority") || id.includes("clsx")) {
                return "vendor_ui";
              }
              
              // Routing
              if (id.includes("react-router")) {
                return "vendor_router";
              }
              
              // State management
              if (id.includes("zustand") || id.includes("redux")) {
                return "vendor_state";
              }
              
              // HTTP clients
              if (id.includes("axios") || id.includes("ky")) {
                return "vendor_http";
              }
              
              // Utility libraries
              if (id.includes("lodash") || id.includes("ramda")) {
                return "vendor_utils";
              }
              
              // Notification/Toast
              if (id.includes("sonner") || id.includes("react-hot-toast")) {
                return "vendor_notifications";
              }
              
              // Default vendor chunk untuk library lainnya
              return "vendor";
            }
          },
        },
      },
    },
  };
});