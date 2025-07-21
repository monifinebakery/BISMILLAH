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
    plugins.push(visualizer({ open: true, filename: "dist/stats.html" }));
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
              // Do not separate 'recharts' or 'd3-' into a custom chunk.
              // This prevents potential initialization issues by allowing Vite to handle them naturally.
              
              // Maintain existing rules for other libraries if needed
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("lucide-react")) return "vendor_lucide";

              // Let remaining node_modules, including recharts and d3-, fall into the default vendor chunk
              return "vendor";
            }
          },
        },
      },
    },
  };
});