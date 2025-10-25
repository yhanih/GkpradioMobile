import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    react({
      jsxImportSource: 'react',
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    cssTarget: "es2019",
    modulePreload: { polyfill: false },
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      plugins: [
        ...(process.env.ANALYZE
          ? [
              visualizer({
                filename: path.resolve(import.meta.dirname, "dist", "stats.html"),
                template: "treemap",
                gzipSize: true,
                brotliSize: true,
                open: false,
              }),
            ]
          : []),
      ],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react')) return 'vendor';
          if (id.includes('wouter')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('@stripe/stripe-js') || id.includes('@stripe/react-stripe-js')) return 'stripe';
          if (id.includes('@supabase/supabase-js')) return 'supabase';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('hls.js')) return 'hls';
          return undefined;
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
      treeshake: { preset: "recommended" },
    },
  },
});

