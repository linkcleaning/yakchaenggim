import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // GitHub Pages 같은 하위 주소에서도 동작
  plugins: [react(), tailwindcss()],
  server: { host: true }, // 같은 와이파이의 휴대폰에서도 접속 가능
})
