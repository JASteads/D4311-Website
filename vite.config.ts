import { defineConfig } from 'vite'

// Loads pages properly
const input = {
    main: './src/index.html',
    adminPanel: './src/admin_panel.html',
    upload: './src/upload.html',
    login: './src/login.html',
    blogViewer: './src/blog_viewer.html',
    blogEditor: './src/blog_editor.html',
    productViewer: './src/product_viewer.html',
    library: './src/library.html',
    gallery: './src/gallery.html',
    portfolio: './src/portfolio.html',
    loadFail: './src/load_fail.html'
};

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rolldownOptions: { input }
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