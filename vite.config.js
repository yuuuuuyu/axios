const path = require("path");
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: path.resolve(__dirname, "lib/index.js"),
            name: "index",
            fileName: (format) => `main.${format}.js`,
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