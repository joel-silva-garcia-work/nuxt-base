// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  typescript: { strict: true },
  // Imports explícitos en app/ para que dependency-cruiser vea las fronteras (docs/API.md §9).
  imports: { autoImport: false },
  components: { dirs: [] },
})
