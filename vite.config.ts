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
            // Logika untuk memecah vendor chunks
            if (id.includes('node_modules')) {
              
              // =========================================================
              // --- PEMECAHAN CHUNK BARU BERDASARKAN HASIL VISUALIZER ---
              // =========================================================

              // 1. Pisahkan library chart yang sangat besar
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
                return 'vendor_charts';
              }
              
              // 2. Pisahkan library untuk membuat PDF
              if (id.includes('html2pdf.js')) {
                return 'vendor_html2pdf';
              }

              // 3. Pisahkan library kalender/tanggal
              if (id.includes('date-fns') || id.includes('react-day-picker')) {
                return 'vendor_date';
              }
              
              // 4. Aturan yang sudah ada sebelumnya
              if (id.includes('@supabase')) return 'vendor_supabase';
              if (id.includes('react-dom')) return 'vendor_react-dom';
              if (id.includes('lucide-react')) return 'vendor_lucide';
              
              // Keranjang sisa untuk library lain yang lebih kecil
              return 'vendor_others';
            }
          }
        }
      }
    }
  };
});