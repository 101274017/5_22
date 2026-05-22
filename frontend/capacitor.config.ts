import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ancientencounter.app',
  appName: '此地有古人',
  webDir: 'dist',
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  // 允许 WebView 访问 HTTP（非 HTTPS）后端
  server: {
    cleartext: true,
  },
}

export default config
