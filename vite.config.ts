import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode, command }) => {
  const plugins = [
    react(),
  ];

  if (mode === 'development') {
    plugins.push(componentTagger());
  }

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
            if (id.includes('node_modules')) {
              
              // --- PERBAIKAN ---
              // Kita akan membiarkan Vite menangani React & React-DOM secara otomatis.
              // Kita hanya akan memisahkan library besar lainnya.

              // 1. Pisahkan library chart yang sangat besar
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor_charts';
              }
              
              // 2. Pisahkan library kalender/tanggal
              if (id.includes('date-fns') || id.includes('react-day-picker')) {
                return 'vendor_date';
              }
              
              // 3. Aturan lain yang sudah ada
              if (id.includes('@supabase')) return 'vendor_supabase';
              if (id.includes('lucide-react')) return 'vendor_lucide';
              
              // Biarkan sisa node_modules (termasuk React) di-handle oleh Vite
              // atau masuk ke dalam chunk vendor umum.
            }
          }
        }
      }
    }
  };
});
