import { createRoot } from "react-dom/client";
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import App from "./App";
import "./index.css";

// Initialize Capacitor plugins when on native platforms
const initializeCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Set platform-specific configurations
      if (Capacitor.getPlatform() === 'ios') {
        // Set status bar style for iOS (light text on transparent background)
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        
        // Add a safe area for iPhone notch/dynamic island
        document.documentElement.classList.add('ios-safe-area');
      } else {
        // For Android or other platforms
        await StatusBar.setStyle({ style: Style.Dark });
      }
      
      // Hide the splash screen with a fade animation
      await SplashScreen.hide({
        fadeOutDuration: 500
      });
      
      console.log('Capacitor initialized on native platform:', Capacitor.getPlatform());
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  } else {
    console.log('Running in browser environment');
  }
};

// Initialize app
const initializeApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
  initializeCapacitor();
};

initializeApp();
