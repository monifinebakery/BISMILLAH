// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode, command }) => {
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
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("lucide-react")) return "vendor_lucide";
              return "vendor";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlLCBjb21tYW5kIH0pID0+IHtcbiAgY29uc3QgcGx1Z2lucyA9IFtyZWFjdCgpXTtcblxuICBpZiAobW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gICAgcGx1Z2lucy5wdXNoKGNvbXBvbmVudFRhZ2dlcigpKTtcbiAgfVxuXG4gIGlmIChjb21tYW5kID09PSBcImJ1aWxkXCIpIHtcbiAgICBwbHVnaW5zLnB1c2godmlzdWFsaXplcih7IG9wZW46IHRydWUsIGZpbGVuYW1lOiBcImRpc3Qvc3RhdHMuaHRtbFwiIH0pKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgIH0sXG4gICAgcGx1Z2lucyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3MoaWQ6IHN0cmluZykge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpKSB7XG4gICAgICAgICAgICAgIC8vIERvIG5vdCBzZXBhcmF0ZSAncmVjaGFydHMnIG9yICdkMy0nIGludG8gYSBjdXN0b20gY2h1bmsuXG4gICAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgcG90ZW50aWFsIGluaXRpYWxpemF0aW9uIGlzc3VlcyBieSBhbGxvd2luZyBWaXRlIHRvIGhhbmRsZSB0aGVtIG5hdHVyYWxseS5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIE1haW50YWluIGV4aXN0aW5nIHJ1bGVzIGZvciBvdGhlciBsaWJyYXJpZXMgaWYgbmVlZGVkXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImRhdGUtZm5zXCIpIHx8IGlkLmluY2x1ZGVzKFwicmVhY3QtZGF5LXBpY2tlclwiKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcInZlbmRvcl9kYXRlXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiQHN1cGFiYXNlXCIpKSByZXR1cm4gXCJ2ZW5kb3Jfc3VwYWJhc2VcIjtcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibHVjaWRlLXJlYWN0XCIpKSByZXR1cm4gXCJ2ZW5kb3JfbHVjaWRlXCI7XG5cbiAgICAgICAgICAgICAgLy8gTGV0IHJlbWFpbmluZyBub2RlX21vZHVsZXMsIGluY2x1ZGluZyByZWNoYXJ0cyBhbmQgZDMtLCBmYWxsIGludG8gdGhlIGRlZmF1bHQgdmVuZG9yIGNodW5rXG4gICAgICAgICAgICAgIHJldHVybiBcInZlbmRvclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFKM0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxNQUFNLFFBQVEsTUFBTTtBQUNqRCxRQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFFeEIsTUFBSSxTQUFTLGVBQWU7QUFDMUIsWUFBUSxLQUFLLGdCQUFnQixDQUFDO0FBQUEsRUFDaEM7QUFFQSxNQUFJLFlBQVksU0FBUztBQUN2QixZQUFRLEtBQUssV0FBVyxFQUFFLE1BQU0sTUFBTSxVQUFVLGtCQUFrQixDQUFDLENBQUM7QUFBQSxFQUN0RTtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFZO0FBQ3ZCLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFLL0Isa0JBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsa0JBQWtCLEdBQUc7QUFDOUQsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGtCQUFJLEdBQUcsU0FBUyxjQUFjLEVBQUcsUUFBTztBQUd4QyxxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
