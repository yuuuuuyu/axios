import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import VitePluginCleaned from "vite-plugin-cleaned";

export default defineConfig({
    plugins: [VitePluginCleaned(), vue()],
    build: {
        lib: {
            entry: path.resolve(__dirname, "lib/index.js"),
            name: "index",
            fileName: (format) => `axios.${format}.js`,
        },
        rollupOptions: {
            external: ["axios"],
            output: {
                globals: {
                    vue: "Vue",
                    axios: "axios",
                },
                exports: 'named',
            },
        },
    },
    server: {
        proxy: {
            '^/api/': {
                target: 'http://localhost:9999',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/'),
            },
        },
    },
});