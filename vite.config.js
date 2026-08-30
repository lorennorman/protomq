import vue from '@vitejs/plugin-vue'

export default {
  plugins: [vue()],
  // Bind dev server to all interfaces so `npm run web` is reachable from other
  // machines on the LAN (default is localhost-only).
  server: {
    host: true,
  },
}
