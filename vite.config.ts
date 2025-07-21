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
              // HAPUS ATURAN UNTUK RECHARTS DAN D3-
              // if (id.includes('recharts') || id.includes('d3-')) {
              //   return 'vendor_charts';
              // }
              
              // Biarkan Vite menangani Recharts secara default.
              // Ini akan mencegah pemisahan yang mungkin mengganggu inisialisasi internalnya.

              // Aturan lain yang sudah ada (biarkan ini jika masih diperlukan)
              if (id.includes('date-fns') || id.includes('react-day-picker')) {
                return 'vendor_date';
              }
              if (id.includes('@supabase')) return 'vendor_supabase';
              if (id.includes('lucide-react')) return 'vendor_lucide';
              
              // Biarkan sisa node_modules masuk ke chunk vendor umum (default Vite)
              return 'vendor'; // Atau biarkan Vite yang memutuskan jika tidak ada return di sini
            }
          }
        }
      }
    }
  };
});