// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode, command }) => {
  const plugins = [
    react()
  ];
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  if (command === "build") {
    plugins.push(visualizer({ open: true, filename: "dist/stats.html" }));
  }
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-")) {
                return "vendor_charts";
              }
              if (id.includes("html2pdf.js")) {
                return "vendor_html2pdf";
              }
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("react-dom")) return "vendor_react-dom";
              if (id.includes("lucide-react")) return "vendor_lucide";
              return "vendor_others";
            }
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSwgY29tbWFuZCB9KSA9PiB7XG4gIGNvbnN0IHBsdWdpbnMgPSBbXG4gICAgcmVhY3QoKSxcbiAgXTtcblxuICBpZiAobW9kZSA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cblxuICBpZiAoY29tbWFuZCA9PT0gJ2J1aWxkJykge1xuICAgIHBsdWdpbnMucHVzaCh2aXN1YWxpemVyKHsgb3BlbjogdHJ1ZSwgZmlsZW5hbWU6IFwiZGlzdC9zdGF0cy5odG1sXCIgfSkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICAvLyBMb2dpa2EgdW50dWsgbWVtZWNhaCB2ZW5kb3IgY2h1bmtzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgICAgICAgLy8gLS0tIFBFTUVDQUhBTiBDSFVOSyBCQVJVIEJFUkRBU0FSS0FOIEhBU0lMIFZJU1VBTElaRVIgLS0tXG4gICAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgICAgICAgICAgIC8vIDEuIFBpc2Foa2FuIGxpYnJhcnkgY2hhcnQgeWFuZyBzYW5nYXQgYmVzYXJcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpIHx8IGlkLmluY2x1ZGVzKCdkMy0nKSB8fCBpZC5pbmNsdWRlcygndmljdG9yeS0nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yX2NoYXJ0cyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIDIuIFBpc2Foa2FuIGxpYnJhcnkgdW50dWsgbWVtYnVhdCBQREZcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdodG1sMnBkZi5qcycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3JfaHRtbDJwZGYnO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gMy4gUGlzYWhrYW4gbGlicmFyeSBrYWxlbmRlci90YW5nZ2FsXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZGF0ZS1mbnMnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZGF5LXBpY2tlcicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3JfZGF0ZSc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIDQuIEF0dXJhbiB5YW5nIHN1ZGFoIGFkYSBzZWJlbHVtbnlhXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHJldHVybiAndmVuZG9yX3N1cGFiYXNlJztcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkgcmV0dXJuICd2ZW5kb3JfcmVhY3QtZG9tJztcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkgcmV0dXJuICd2ZW5kb3JfbHVjaWRlJztcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIEtlcmFuamFuZyBzaXNhIHVudHVrIGxpYnJhcnkgbGFpbiB5YW5nIGxlYmloIGtlY2lsXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yX290aGVycyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsa0JBQWtCO0FBSjNCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsTUFBTSxRQUFRLE1BQU07QUFDakQsUUFBTSxVQUFVO0FBQUEsSUFDZCxNQUFNO0FBQUEsRUFDUjtBQUVBLE1BQUksU0FBUyxlQUFlO0FBQzFCLFlBQVEsS0FBSyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2hDO0FBRUEsTUFBSSxZQUFZLFNBQVM7QUFDdkIsWUFBUSxLQUFLLFdBQVcsRUFBRSxNQUFNLE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxDQUFDO0FBQUEsRUFDdEU7QUFFQSxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0E7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGFBQWEsSUFBWTtBQUV2QixnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBTy9CLGtCQUFJLEdBQUcsU0FBUyxVQUFVLEtBQUssR0FBRyxTQUFTLEtBQUssS0FBSyxHQUFHLFNBQVMsVUFBVSxHQUFHO0FBQzVFLHVCQUFPO0FBQUEsY0FDVDtBQUdBLGtCQUFJLEdBQUcsU0FBUyxhQUFhLEdBQUc7QUFDOUIsdUJBQU87QUFBQSxjQUNUO0FBR0Esa0JBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsa0JBQWtCLEdBQUc7QUFDOUQsdUJBQU87QUFBQSxjQUNUO0FBR0Esa0JBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGtCQUFJLEdBQUcsU0FBUyxXQUFXLEVBQUcsUUFBTztBQUNyQyxrQkFBSSxHQUFHLFNBQVMsY0FBYyxFQUFHLFFBQU87QUFHeEMscUJBQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
