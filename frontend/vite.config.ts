import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import presetIcons from '@unocss/preset-icons'
import presetAttributify from '@unocss/preset-attributify'
import presetWebFonts from '@unocss/preset-web-fonts'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    UnoCSS({
      presets: [
        presetIcons({
          scale: 1.2,
          collections: {
            mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
          }
        }),
        presetAttributify(),
        presetWebFonts({
          fonts: {
            sans: 'Roboto',
          },
        }),
      ],
    }),
  ],
})
