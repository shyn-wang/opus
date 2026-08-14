import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    build: {
        rollupOptions: {
            input: {
                index: resolve(import.meta.dirname, 'index.html'),
                results: resolve(import.meta.dirname, 'pages/results.html'),
                stage: resolve(import.meta.dirname, 'pages/stage.html'),
            }
        }
    }
});