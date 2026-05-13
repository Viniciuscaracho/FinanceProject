import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-popover'],
          'vendor-charts': ['recharts'],
          'vendor-calendar': ['react-big-calendar'],
          'vendor-date': ['date-fns'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.js',
    css: false,
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['src/test/**', 'src/components/ui/**'],
    },
  },
  server: {
    port: 5173,
    strictPort: true, // Falha se a porta estiver ocupada
    host: '0.0.0.0', // Escuta em todas as interfaces (IPv4 e IPv6) - necessário para acesso mobile
    hmr: {
      // Use the actual host for HMR so mobile devices get hot reload
      clientPort: 5173,
    },
    proxy: {
      '/rails': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000, // 30 segundos de timeout
        proxyTimeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
            // Retornar JSON de erro quando o backend não está disponível
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Servidor backend não está disponível',
                message: `Não foi possível conectar ao servidor Rails em http://localhost:3000. Erro: ${err.message}`,
                details: 'Certifique-se de que o servidor Rails está rodando na porta 3000'
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
            // Garantir que sempre retornamos JSON para erros da API
            if (proxyRes.statusCode >= 400 && req.url.startsWith('/api/')) {
              proxyRes.headers['content-type'] = 'application/json';
            }
          });
        },
      }
      // Não fazer proxy de /agendar - o React serve diretamente
      // POST /agendar/:token/book será feito com URL completa do backend
    }
  }
})
