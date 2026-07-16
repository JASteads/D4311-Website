import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rolldownOptions: {
            input: {
                main: "./src/index.html",
                blogViewer: "./src/blog_viewer.html",
                blogEditor: "./src/blog_editor.html",
                portfolio: "./src/portfolio.html",
                loadFail: "./src/load_fail.html"
            }
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
});