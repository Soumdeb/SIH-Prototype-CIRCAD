import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ CLEAN config — no Tailwind imports needed here
export default defineConfig({
  plugins: [react()],
});
