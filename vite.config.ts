import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const plugins = [
    react(),
  ];

  // Aktifkan plugin ini HANYA saat development
  if (mode === 'development') {
    plugins.push(componentTagger());
  }

  // Aktifkan visualizer HANYA saat menjalankan perintah 'build'
  if (command === 'build') {
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
            // Logika untuk memecah vendor chunks
            // Semua library dari node_modules akan dipecah
            if (id.includes('node_modules')) {
              // Pisahkan library besar ke dalam chunk-nya sendiri
              if (id.includes('@supabase')) return 'vendor_supabase';
              if (id.includes('react-dom')) return 'vendor_react-dom';
              if (id.includes('lucide-react')) return 'vendor_lucide';
              
              // Jika ada library chart, tambahkan di sini. Contoh:
              // if (id.includes('chart.js')) return 'vendor_chartjs';
              // if (id.includes('recharts')) return 'vendor_recharts';
              
              // Semua library lain dari node_modules akan masuk ke 'vendor_others'
              return 'vendor_others';
            }
          }
        }
      }
    }
  };
});