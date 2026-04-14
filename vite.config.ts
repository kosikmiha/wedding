import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'dayjs',
      'dayjs/plugin/utc',
      'dayjs/plugin/timezone',
      'react-confetti',
      'swiper',
      'swiper/react',
      'swiper/modules',
    ],
  },
})
