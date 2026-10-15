import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  // 5180 keeps clear of the signage-cms dev servers (5173–5177) that often run
  // on this machine at the same time.
  server: { port: 5180 },
});
