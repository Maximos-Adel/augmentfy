import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  server: {
    proxy: {
      '/mesh': {
        target: 'https://assets.meshy.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mesh/, ''), // Rewrite the path if needed
      },
    },
  },
});
