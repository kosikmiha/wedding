import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'swiper/css'
import './index.css'
import { installRsvpSwiperTouchGuard } from './rsvp-swiper-touch-guard'
import App from './App.tsx'

installRsvpSwiperTouchGuard()
import { ThemeProvider } from './theme/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
