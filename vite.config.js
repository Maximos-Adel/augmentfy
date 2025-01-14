import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  // server: {
  //   proxy: {
  //     // Example: Proxy requests to "/model" to the external server
  //     '/model': {
  //       target: 'https://assets.meshy.ai', // Target the URL hosting the models
  //       changeOrigin: true, // Change the origin of the request to the target URL
  //       secure: false, // Set to false if the target server uses self-signed certificates
  //       rewrite: (path) => path.replace(/^\/model/, ''), // Strip the "/model" prefix
  //     },
  //     '/storage': {
  //       target: 'https://pmpgkanoddidpuwqspzi.supabase.co',
  //       changeOrigin: true,
  //     },
  //   },
  // },
  // test: /\.(glb|gltf)$/,
  // use: [
  //   {
  //     loader: 'file-loader',
  //   },
  // ],
});
