import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // o site chama /api/... e o Vite repassa pro backend na porta 3000.
    // Assim front e back parecem um endereco so: sem CORS e sem VITE_API_URL.
    proxy: {
      '/api': 'http://localhost:3000',
    },
    // libera o endereco que o GitHub Codespaces cria para a porta 5173
    allowedHosts: ['.app.github.dev'],
  },
})
