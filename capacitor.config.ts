import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.menova.app',
  appName: 'Menova.ai',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.menova.ai',
    // Allow local development mode
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#F9F5F6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#F26158",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK", // Use "DARK" for light text on dark backgrounds
      backgroundColor: "#F26158"
    }
  }
};

export default config;